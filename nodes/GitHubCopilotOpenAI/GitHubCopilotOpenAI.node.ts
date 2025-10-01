import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  IDataObject,
} from "n8n-workflow";

import { nodeProperties } from "./nodeProperties";

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
          const messagesParam = this.getNodeParameter("messages", i, {
            message: [],
          }) as IDataObject;
          const temperature = this.getNodeParameter("temperature", i, 1) as number;
          const tools = this.getNodeParameter("tools", i, "") as string;

          // Parse messages from n8n UI format
          const messages: Array<{ role: string; content: string }> = [];
          if (messagesParam.message && Array.isArray(messagesParam.message)) {
            for (const msg of messagesParam.message as IDataObject[]) {
              messages.push({
                role: msg.role as string,
                content: msg.content as string,
              });
            }
          }

          // Default message if none provided
          if (messages.length === 0) {
            messages.push({
              role: "user",
              content: "Hello! How can you help me?",
            });
          }

          // Map OpenAI model names to GitHub Copilot models
          const modelMapping: Record<string, string> = {
            "gpt-4": "gpt-4o",
            "gpt-4o": "gpt-4o",
            "gpt-4o-mini": "gpt-4o-mini",
            "claude-3-5-sonnet": "claude-3.5-sonnet",
          };
          const copilotModel = modelMapping[model] || "gpt-4o";

          // For now, return a mock OpenAI-compatible response
          // Later we'll integrate with the real GitHub Copilot API
          const mockResponse = {
            id: `chatcmpl-${Date.now()}`,
            object: "chat.completion",
            created: Math.floor(Date.now() / 1000),
            model: model,
            choices: [
              {
                index: 0,
                message: {
                  role: "assistant",
                  content: `🚀 GitHub Copilot OpenAI Mock Response

**Request Details:**
- Model: ${model} → ${copilotModel}
- Messages: ${messages.length}
- Temperature: ${temperature}
- Tools: ${tools ? "Yes" : "No"}

**Sample Messages:**
${messages
    .map(
      (msg, idx) =>
        `${idx + 1}. [${msg.role}]: ${msg.content.substring(0, 100)}${
          msg.content.length > 100 ? "..." : ""
        }`,
    )
    .join("\n")}

This is a mock response. The real GitHub Copilot integration will be implemented next.`,
                },
                finish_reason: "stop",
              },
            ],
            usage: {
              prompt_tokens: 50,
              completion_tokens: 125,
              total_tokens: 175,
            },
          };

          returnData.push({
            json: mockResponse,
            pairedItem: { item: i },
          });
        } else {
          throw new Error(`Unknown operation: ${operation}`);
        }
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              error: {
                message: error instanceof Error ? error.message : "Unknown error",
                type: "api_error",
                code: "github_copilot_openai_error",
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
