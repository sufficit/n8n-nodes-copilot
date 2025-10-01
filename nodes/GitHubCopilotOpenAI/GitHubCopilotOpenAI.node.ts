import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  IDataObject,
} from "n8n-workflow";

import { nodeProperties } from "./nodeProperties";
import { makeApiRequest, CopilotResponse } from "../GitHubCopilotChatAPI/utils";
import { GITHUB_COPILOT_API } from "../../shared/utils/GitHubCopilotEndpoints";

export class GitHubCopilotOpenAI implements INodeType {
  description: INodeTypeDescription = {
    displayName: "GitHub Copilot OpenAI",
    name: "gitHubCopilotOpenAI",
    icon: "file:../../shared/icons/copilot.svg",
    group: ["transform"],
    version: 1,
    subtitle: "={{$parameter[\"operation\"] + \": \" + $parameter[\"model\"]}}",
    description:
			"OpenAI-compatible GitHub Copilot Chat API with full support for messages, tools, and all OpenAI parameters",
    defaults: {
      name: "GitHub Copilot OpenAI",
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

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const operation = this.getNodeParameter("operation", i) as string;

        if (operation === "chat") {
          // Get OpenAI-style parameters from n8n UI
          const model = this.getNodeParameter("model", i, "gpt-4o") as string;
          const messagesInputMode = this.getNodeParameter("messagesInputMode", i, "manual") as string;
          const temperature = this.getNodeParameter("temperature", i, 1) as number;
          const tools = this.getNodeParameter("tools", i, "") as string;

          // Parse messages based on input mode
          let messages: Array<{ role: string; content: string }> = [];
          let requestBodyFromJson: IDataObject | undefined = undefined;

          if (messagesInputMode === "json") {
            // JSON mode: accept both string (to be parsed) or direct object/array
            const messagesJson = this.getNodeParameter("messagesJson", i, "[]");
            
            try {
              let parsed: any;
              
              // Check if it's already an object/array (passed directly from n8n expression)
              if (typeof messagesJson === 'object') {
                parsed = messagesJson;
                console.log('📥 Received messages as direct object/array (no parsing needed)');
              } else {
                // It's a string, parse it
                parsed = JSON.parse(messagesJson as string);
                console.log('📥 Parsed messages from JSON string');
              }
              
              // Check if it's a full OpenAI request body or just messages array
              if (Array.isArray(parsed)) {
                messages = parsed;
              } else if (parsed.messages && Array.isArray(parsed.messages)) {
                // Full OpenAI request body - extract everything
                messages = parsed.messages;
                requestBodyFromJson = parsed;
                console.log('📥 Full OpenAI request body received:', JSON.stringify(parsed, null, 2));
              } else {
                messages = parsed;
              }
            } catch (error) {
              throw new Error(`Failed to parse messages JSON: ${error instanceof Error ? error.message : "Unknown error"}`);
            }
          } else {
            // Manual mode: parse from n8n UI format
            const messagesParam = this.getNodeParameter("messages", i, {
              message: [],
            }) as IDataObject;
            
            if (messagesParam.message && Array.isArray(messagesParam.message)) {
              for (const msg of messagesParam.message as IDataObject[]) {
                messages.push({
                  role: msg.role as string,
                  content: msg.content as string,
                });
              }
            }
          }

          // Default message if none provided
          if (messages.length === 0) {
            messages.push({
              role: "user",
              content: "Hello! How can you help me?",
            });
          }

          // Parse tools if provided - accept both string or direct array
          let parsedTools: unknown[] = [];
          if (tools) {
            try {
              if (typeof tools === 'object' && Array.isArray(tools)) {
                // Already an array, use directly
                parsedTools = tools;
                console.log('📥 Received tools as direct array (no parsing needed)');
              } else if (typeof tools === 'string' && tools.trim()) {
                // String, parse it
                parsedTools = JSON.parse(tools);
                console.log('📥 Parsed tools from JSON string');
              }
            } catch (error) {
              throw new Error(`Failed to parse tools JSON: ${error instanceof Error ? error.message : "Unknown error"}`);
            }
          }

          // Get other OpenAI parameters
          const max_tokens = this.getNodeParameter("max_tokens", i, 4096) as number;
          const seed = this.getNodeParameter("seed", i, 0) as number;
          const response_format_ui = this.getNodeParameter("response_format", i, "text") as string;
          const advancedOptions = this.getNodeParameter("advancedOptions", i, {}) as IDataObject;
          
          // Parse response_format - prioritize: JSON request body → UI field → advancedOptions
          let response_format: { type?: string } | undefined = undefined;
          
          // Priority 1: Check if response_format came from JSON request body (Chatwoot)
          if (requestBodyFromJson?.response_format) {
            response_format = requestBodyFromJson.response_format as { type?: string };
            console.log('📋 response_format from JSON request body:', JSON.stringify(response_format));
          } 
          // Priority 2: Check UI field
          else if (response_format_ui && response_format_ui !== 'text') {
            response_format = { type: response_format_ui };
            console.log('📋 response_format from UI field:', JSON.stringify(response_format));
          }
          // Priority 3: Check advancedOptions (legacy)
          else if (advancedOptions.response_format && typeof advancedOptions.response_format === 'string') {
            try {
              response_format = JSON.parse(advancedOptions.response_format as string) as { type?: string };
              console.log('📋 response_format from advancedOptions:', JSON.stringify(response_format));
            } catch {
              // If parse fails, ignore response_format
              console.log('⚠️ Failed to parse response_format from advancedOptions');
            }
          }
          
          if (response_format) {
            console.log('✅ Final response_format:', JSON.stringify(response_format));
            console.log('🔍 response_format.type:', response_format.type);
          } else {
            console.log('ℹ️ No response_format specified - using default text format');
          }

          // Map OpenAI model names to GitHub Copilot models
          const modelMapping: Record<string, string> = {
            "gpt-4": "gpt-4o",
            "gpt-4o": "gpt-4o",
            "gpt-4o-mini": "gpt-4o-mini",
            "gpt-4-turbo": "gpt-4o",
            "claude-3-5-sonnet": "claude-3.5-sonnet",
            "claude-3.5-sonnet-20241022": "claude-3.5-sonnet",
            "o1": "o1",
            "o1-preview": "o1-preview",
            "o1-mini": "o1-mini",
          };
          const copilotModel = modelMapping[model] || model;

          // Build GitHub Copilot API request body
          const requestBody: Record<string, unknown> = {
            model: copilotModel,
            messages,
            stream: false,
            temperature,
            max_tokens,
          };

          // Add tools if provided
          if (parsedTools.length > 0) {
            requestBody.tools = parsedTools;
          }

          // Add response_format if provided
          if (response_format) {
            requestBody.response_format = response_format;
          }

          // Add seed if provided
          if (seed > 0) {
            requestBody.seed = seed;
          }

          // Make API request to GitHub Copilot
          const response: CopilotResponse = await makeApiRequest(
            this,
            GITHUB_COPILOT_API.ENDPOINTS.CHAT_COMPLETIONS,
            requestBody,
            false, // hasMedia
          );

          // Helper function to parse JSON from markdown code blocks and return as object
          // Function to clean JSON from markdown blocks (but keep as string)
          const cleanJsonFromMarkdown = (content: string): string => {
            if (!content || typeof content !== 'string') {
              return content;
            }
            
            try {
              const trimmed = content.trim();
              console.log('🧹 cleanJsonFromMarkdown - Input length:', trimmed.length);
              
              // Check if content is wrapped in markdown code block
              const jsonBlockRegex = /^```(?:json)?\s*\n([\s\S]*?)\n```\s*$/;
              const match = trimmed.match(jsonBlockRegex);
              
              if (match && match[1]) {
                // Extract JSON from markdown block and return as string
                const extracted = match[1].trim();
                console.log('✅ cleanJsonFromMarkdown - Extracted from markdown block');
                return extracted;
              }
              
              // No markdown block, return as is
              console.log('ℹ️ cleanJsonFromMarkdown - No markdown block found, returning as is');
              return trimmed;
              
            } catch (error) {
              console.error('❌ cleanJsonFromMarkdown - Error:', error);
              return content;
            }
          };          // Build OpenAI-compatible response
          console.log('🔨 Building OpenAI response...');
          console.log('🔍 response_format check:', response_format?.type === 'json_object' ? 'WILL CLEAN MARKDOWN' : 'WILL KEEP AS IS');
          
          const openAIResponse = {
            id: response.id || `chatcmpl-${Date.now()}`,
            object: response.object || "chat.completion",
            created: response.created || Math.floor(Date.now() / 1000),
            model: model, // Return the requested OpenAI model name
            choices: response.choices.map((choice, choiceIndex) => {
              console.log(`\n📝 Processing choice ${choiceIndex}:`);
              console.log('  - role:', choice.message.role);
              console.log('  - content type:', typeof choice.message.content);
              console.log('  - content length:', choice.message.content?.length || 0);
              console.log('  - has tool_calls:', !!choice.message.tool_calls);
              
              let processedContent = choice.message.content;
              
              // Process content - only clean markdown if json_object, but KEEP AS STRING
              if (choice.message.content !== null && choice.message.content !== undefined) {
                if (response_format?.type === 'json_object') {
                  console.log('  🧹 Applying cleanJsonFromMarkdown (keeping as string)...');
                  processedContent = cleanJsonFromMarkdown(choice.message.content);
                  console.log('  ✅ Processed content type:', typeof processedContent);
                } else {
                  console.log('  ℹ️ Keeping content as is');
                }
              }
              
              return {
                index: choice.index,
                message: {
                  role: choice.message.role,
                  // Content as STRING (never parse to object)
                  // When tool_calls is present, content should be null
                  ...(choice.message.content !== null && choice.message.content !== undefined && { 
                    content: processedContent
                  }),
                  // OpenAI standard fields - must be present
                  refusal: (choice.message as any).refusal || null,
                  annotations: (choice.message as any).annotations || [],
                  // Only include tool_calls if present (standard OpenAI field)
                  ...(choice.message.tool_calls && { tool_calls: choice.message.tool_calls }),
                },
                logprobs: (choice as any).logprobs || null,
                finish_reason: choice.finish_reason,
              };
            }),
            usage: response.usage || {
              prompt_tokens: 0,
              completion_tokens: 0,
              total_tokens: 0,
            },
          };

          returnData.push({
            json: openAIResponse,
            pairedItem: { item: i },
          });
        } else {
          throw new Error(`Unknown operation: ${operation}`);
        }
      } catch (error) {
        if (this.continueOnFail()) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          const errorString = JSON.stringify(error);
          
          console.error('❌ Error occurred:', errorMessage);
          console.error('❌ Error details:', errorString);
          
          // Clean error message - remove n8n specific information
          let cleanMessage = errorMessage;
          
          // Remove token information: [Token used: gho_...xxxxx]
          cleanMessage = cleanMessage.replace(/\[Token used: [^\]]+\]/g, '').trim();
          
          // Remove retry attempt information: [Attempt: x/x]
          cleanMessage = cleanMessage.replace(/\[Attempt: \d+\/\d+\]/g, '').trim();
          
          // Remove "GitHub Copilot API error:" prefix if present
          cleanMessage = cleanMessage.replace(/^GitHub Copilot API error:\s*/i, '').trim();
          
          // Clean up multiple spaces
          cleanMessage = cleanMessage.replace(/\s+/g, ' ').trim();
          
          console.log('🧹 Cleaned error message:', cleanMessage);
          
          // Try to extract GitHub Copilot API error if available
          let apiError: any = null;
          try {
            // Check if error has response body (from API)
            if (error && typeof error === 'object' && 'cause' in error) {
              const cause = (error as any).cause;
              if (cause && cause.error) {
                apiError = cause.error;
              }
            }
            // Check if error message contains JSON
            if (!apiError && errorString.includes('{') && errorString.includes('}')) {
              const jsonMatch = errorString.match(/\{[^{}]*"error"[^{}]*\}/);
              if (jsonMatch) {
                apiError = JSON.parse(jsonMatch[0]);
              }
            }
          } catch (parseError) {
            console.error('Failed to parse API error:', parseError);
          }
          
          // Determine OpenAI error type and code based on error message/API error
          let errorType = "invalid_request_error";
          let errorCode: string | null = null;
          let errorParam: string | null = null;
          let finalMessage = cleanMessage;
          
          // If we have API error from GitHub Copilot, use it
          if (apiError && apiError.error) {
            finalMessage = apiError.error.message || cleanMessage;
            errorType = apiError.error.type || errorType;
            errorCode = apiError.error.code || null;
            errorParam = apiError.error.param || null;
            console.log('✅ Using GitHub Copilot API error details');
          } else {
            // Fallback: detect error type from message and create clean OpenAI-style messages
            const lowerMessage = cleanMessage.toLowerCase();
            
            if (lowerMessage.includes("403") || lowerMessage.includes("forbidden")) {
              errorType = "invalid_request_error";
              errorCode = "insufficient_quota";
              // Clean message for 403 errors
              if (lowerMessage.includes("access") && lowerMessage.includes("forbidden")) {
                finalMessage = "You exceeded your current quota, please check your plan and billing details.";
              } else {
                finalMessage = cleanMessage;
              }
            } else if (lowerMessage.includes("max") && lowerMessage.includes("token")) {
              errorType = "invalid_request_error";
              errorCode = "context_length_exceeded";
              errorParam = "max_tokens";
              finalMessage = "This model's maximum context length is exceeded. Please reduce the length of the messages or completion.";
            } else if (lowerMessage.includes("401") || lowerMessage.includes("unauthorized")) {
              errorType = "invalid_request_error";
              errorCode = "invalid_api_key";
              finalMessage = "Incorrect API key provided. You can find your API key at https://platform.openai.com/account/api-keys.";
            } else if (lowerMessage.includes("400") || lowerMessage.includes("bad request")) {
              errorType = "invalid_request_error";
              errorCode = "invalid_request";
              finalMessage = cleanMessage;
            } else if (lowerMessage.includes("429") || lowerMessage.includes("rate limit")) {
              errorType = "rate_limit_error";
              errorCode = "rate_limit_exceeded";
              finalMessage = "Rate limit reached. Please wait before making more requests.";
            } else if (lowerMessage.includes("timeout")) {
              errorType = "api_error";
              errorCode = "timeout";
              finalMessage = "Request timeout. Please try again.";
            } else {
              errorType = "api_error";
              errorCode = "internal_error";
              finalMessage = cleanMessage;
            }
            console.log('⚠️ Using fallback error detection with cleaned message');
          }
          
          console.log('📋 Final error format:', {
            message: finalMessage,
            type: errorType,
            param: errorParam,
            code: errorCode,
          });
          
          // OpenAI standard error format
          returnData.push({
            json: {
              error: {
                message: finalMessage,
                type: errorType,
                param: errorParam,
                code: errorCode,
              },
            },
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
