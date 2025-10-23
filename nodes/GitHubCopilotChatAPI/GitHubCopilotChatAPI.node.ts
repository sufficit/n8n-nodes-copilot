import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  IDataObject,
  ILoadOptionsFunctions,
  INodePropertyOptions,
} from "n8n-workflow";

import { ChatMessage, ChatMessageContent, makeApiRequest, CopilotResponse } from "./utils";
import { nodeProperties } from "./nodeProperties";
import { processMediaFile } from "./utils/mediaDetection";
import { GitHubCopilotModelsManager } from "../../shared/models/GitHubCopilotModels";
import { GITHUB_COPILOT_API } from "../../shared/utils/GitHubCopilotEndpoints";
import { loadAvailableModels } from "../../shared/models/DynamicModelLoader";

export class GitHubCopilotChatAPI implements INodeType {
  description: INodeTypeDescription = {
    displayName: "GitHub Copilot Chat API",
    name: "gitHubCopilotChatAPI",
    icon: "file:../../shared/icons/copilot.svg",
    group: ["transform"],
    version: 1,
    subtitle: "={{$parameter[\"operation\"] + \": \" + $parameter[\"model\"]}}",
    description:
			"Use official GitHub Copilot Chat API with your subscription - access GPT-5, Claude, Gemini and more",
    defaults: {
      name: "GitHub Copilot Chat API",
    },
    inputs: ["main"],
    outputs: ["main"],
    credentials: [
      {
        name: "githubCopilotApi",
        required: true,
      },
    ],
    properties: nodeProperties,
  };

  methods = {
    loadOptions: {
      async getAvailableModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        return await loadAvailableModels.call(this);
      },
    },
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const operation = this.getNodeParameter("operation", i) as string;
        
        // Get model based on source (fromList or custom)
        const modelSource = this.getNodeParameter("modelSource", i, "fromList") as string;
        let model: string;
        
        if (modelSource === "custom") {
          // User chose "Custom (Manual Entry)" mode
          model = this.getNodeParameter("customModel", i) as string;
          if (!model || model.trim() === "") {
            throw new Error("Custom model name is required when using 'Custom (Manual Entry)' mode");
          }
          console.log(`🔧 Using custom model: ${model}`);
        } else {
          // User chose "From List (Auto-Discovered)" mode
          const selectedModel = this.getNodeParameter("model", i) as string;
          
          if (selectedModel === "__manual__") {
            // User selected "✏️ Enter Custom Model Name" from dropdown
            model = this.getNodeParameter("customModel", i) as string;
            if (!model || model.trim() === "") {
              throw new Error("Custom model name is required when selecting '✏️ Enter Custom Model Name'");
            }
            console.log(`✏️ Using manually entered model: ${model}`);
          } else {
            // Normal model selection from dropdown
            model = selectedModel;
            console.log(`✅ Using model from list: ${model}`);
          }
        }

        if (operation === "chat") {
          const userMessage = this.getNodeParameter("message", i) as string;
          const systemMessage = this.getNodeParameter("systemMessage", i, "") as string;
          const advancedOptions = this.getNodeParameter("advancedOptions", i, {}) as IDataObject;

          // Get retry options
          const enableRetry = advancedOptions.enableRetry !== false;
          const maxRetries = (advancedOptions.maxRetries as number) || 3;

          const includeMedia = this.getNodeParameter("includeMedia", i, false) as boolean;

          // Get model capabilities from centralized manager (if available)
          const modelInfo = GitHubCopilotModelsManager.getModelByValue(model);

          // Validate model capabilities before processing (only if media is included)
          if (includeMedia) {
            if (modelInfo && !modelInfo?.capabilities.vision && !modelInfo?.capabilities.multimodal) {
              throw new Error(
                `Model ${model} does not support vision/image processing. Please select a model with vision capabilities.`,
              );
            } else if (!modelInfo) {
              console.warn(`⚠️ Model ${model} not found in known models list. Vision capability unknown - proceeding anyway.`);
            }
          }

          // Build messages array
          const messages: ChatMessage[] = [];

          // Add system message if provided
          if (systemMessage) {
            messages.push({
              role: "system",
              content: systemMessage,
            });
          }

          // Prepare user message content
          let userContent: string | Array<ChatMessageContent> = userMessage;

          // Handle multimodal content (unified media handling)
          if (includeMedia) {
            const mediaSource = this.getNodeParameter("mediaSource", i) as string;
            const mediaFile = this.getNodeParameter("mediaFile", i, "") as string;
            const mediaUrl = this.getNodeParameter("mediaUrl", i, "") as string;
            const mediaBinaryProperty = this.getNodeParameter(
              "mediaBinaryProperty",
              i,
              "",
            ) as string;

            const contentArray: Array<ChatMessageContent> = [];

            // Add text content
            if (userMessage.trim()) {
              contentArray.push({
                type: "text",
                text: userMessage,
              });
            }

            // Process media file and auto-detect type
            try {
              const mediaResult = await processMediaFile(
                this,
                i,
								mediaSource as "manual" | "url" | "binary",
								mediaFile,
								mediaUrl,
								mediaBinaryProperty,
              );

              if (mediaResult.type === "image" && mediaResult.dataUrl) {
                // Handle as image
                contentArray.push({
                  type: "image_url",
                  image_url: {
                    url: mediaResult.dataUrl,
                  },
                });
              } else {
                // Unknown or error
                contentArray.push({
                  type: "text",
                  text: `[Image processing failed: ${mediaResult.description}]`,
                });
              }
            } catch (error) {
              contentArray.push({
                type: "text",
                text: `[Media processing error: ${
                  error instanceof Error ? error.message : "Unknown error"
                }]`,
              });
            }

            userContent = contentArray;
          }

          // Add user message
          messages.push({
            role: "user",
            content: userContent,
          });

          // Prepare request body
          const requestBody: Record<string, unknown> = {
            model,
            messages,
            stream: false,
            ...advancedOptions,
          };

          // Make API request with retry logic
          const hasMedia = includeMedia;
          let response: CopilotResponse | null = null;
          let attempt = 1;
          const totalAttempts = maxRetries + 1;
          let retriesUsed = 0;

          while (attempt <= totalAttempts) {
            try {
              response = await makeApiRequest(
                this,
                GITHUB_COPILOT_API.ENDPOINTS.CHAT_COMPLETIONS,
                requestBody,
                hasMedia,
              );
              // Success - calculate retries from this loop
              retriesUsed = attempt - 1;
              break; // Exit retry loop
            } catch (error: unknown) {
              const isLastAttempt = attempt >= totalAttempts;
              const errorObj = error as { status?: number; message?: string };
              const is403Error = errorObj.status === 403 || errorObj.message?.includes("403");

              if (is403Error && enableRetry && !isLastAttempt) {
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000); // Exponential backoff, max 30s
                console.log(
                  `GitHub Copilot API attempt ${attempt}/${totalAttempts} failed with 403, retrying in ${delay}ms...`,
                );
                await new Promise((resolve) => setTimeout(resolve, delay));
                attempt++;
                continue;
              }

              // If not retryable or last attempt, throw the error
              retriesUsed = attempt - 1; // Count retries even on failure
              throw error;
            }
          }

          if (!response) {
            throw new Error(
              `Failed to get response from GitHub Copilot API after ${totalAttempts} attempts (${retriesUsed} retries)`,
            );
          }

          // Extract result with retry information
          const result: IDataObject = {
            message: response.choices[0]?.message?.content || "",
            model,
            operation,
            usage: response.usage || null,
            finish_reason: response.choices[0]?.finish_reason || "unknown",
            retries: retriesUsed,
          };

          returnData.push({
            json: result,
            pairedItem: { item: i },
          });
        }
      } catch (error) {
        if (this.continueOnFail()) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          returnData.push({
            json: {
              error: errorMessage,
              operation: this.getNodeParameter("operation", i),
              model: this.getNodeParameter("model", i),
            } as IDataObject,
            pairedItem: { item: i },
          });
        } else {
          throw error;
        }
      }
    }

    return [returnData];
  }
}
