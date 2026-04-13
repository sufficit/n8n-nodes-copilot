import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
	ILoadOptionsFunctions,
	INodePropertyOptions,
} from "n8n-workflow";

import { nodeProperties } from "./nodeProperties";
import { executeChatCompletion } from "./execute/chatCompletion";
import { executeListModels } from "./execute/listModels";
import { loadAvailableModels, loadAvailableVisionModels } from "../../shared/models/DynamicModelLoader";

export class GitHubCopilotOpenAI implements INodeType {
	description: INodeTypeDescription = {
		displayName: "GitHub Copilot OpenAI",
		name: "gitHubCopilotOpenAI",
		icon: "file:../../shared/icons/copilot.svg",
		group: ["transform"],
		version: 1,
		subtitle: '={{$parameter["operation"] === "listModels" ? "List Models" : $parameter["model"]}}',
		description: "OpenAI-compatible GitHub Copilot API: Chat Completions and List Models (GET /v1/models)",
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

	methods = {
		loadOptions: {
			async getAvailableModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				return await loadAvailableModels.call(this);
			},
			async getVisionFallbackModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				return await loadAvailableVisionModels.call(this);
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter("operation", i, "chatCompletions") as string;

				if (operation === "listModels") {
					const result = await executeListModels(this, i);
					returnData.push({ json: result, pairedItem: { item: i } });
					continue;
				}

				// Default: chatCompletions
				const openAIResponse = await executeChatCompletion(this, items, i);
				returnData.push({ json: openAIResponse, pairedItem: { item: i } });

			} catch (error) {
				if (this.continueOnFail()) {
					const errorMessage = error instanceof Error ? error.message : "Unknown error";
					const errorString = JSON.stringify(error);

					console.error("ERROR occurred:", errorMessage);

					// Clean sensitive/noisy info from error message
					let cleanMessage = errorMessage
						.replace(/\[Token used: [^\]]+\]/g, "")
						.replace(/\[Attempt: \d+\/\d+\]/g, "")
						.replace(/^GitHub Copilot API error:\s*/i, "")
						.replace(/\s+/g, " ")
						.trim();

					// Try to extract structured API error
					let apiError: any = null;
					try {
						if (error && typeof error === "object" && "cause" in error) {
							const cause = (error as any).cause;
							if (cause?.error) apiError = cause.error;
						}
						if (!apiError && errorString.includes('"error"')) {
							const jsonMatch = errorString.match(/\{[^{}]*"error"[^{}]*\}/);
							if (jsonMatch) apiError = JSON.parse(jsonMatch[0]);
						}
					} catch {
						// ignore parse errors
					}

					const lower = cleanMessage.toLowerCase();

					// 400 errors are non-retryable - re-throw
					const is400 =
						lower.includes("400") ||
						lower.includes("bad request") ||
						apiError?.error?.code === "invalid_request_body";

					if (is400) {
						throw new NodeOperationError(this.getNode(), `Bad Request (400): ${cleanMessage}`, {
							itemIndex: i,
							description: "The request was malformed. Retrying will not help.",
						});
					}

					// Determine OpenAI-style error type/code
					let errorType = "invalid_request_error";
					let errorCode: string | null = null;
					let errorParam: string | null = null;
					let finalMessage = cleanMessage;

					if (apiError?.error) {
						finalMessage = apiError.error.message || cleanMessage;
						errorType = apiError.error.type || errorType;
						errorCode = apiError.error.code || null;
						errorParam = apiError.error.param || null;
					} else if (lower.includes("403") || lower.includes("forbidden")) {
						errorCode = "insufficient_quota";
						finalMessage =
							lower.includes("access") && lower.includes("forbidden")
								? "You exceeded your current quota, please check your plan and billing details."
								: cleanMessage;
					} else if (lower.includes("max") && lower.includes("token")) {
						errorCode = "context_length_exceeded";
						errorParam = "max_tokens";
						finalMessage = "This model's maximum context length is exceeded.";
					} else if (lower.includes("401") || lower.includes("unauthorized")) {
						errorCode = "invalid_api_key";
						finalMessage = "Incorrect API key provided.";
					} else if (lower.includes("429") || lower.includes("rate limit")) {
						errorType = "rate_limit_error";
						errorCode = "rate_limit_exceeded";
						finalMessage = "Rate limit reached. Please wait before making more requests.";
					} else if (lower.includes("timeout")) {
						errorType = "api_error";
						errorCode = "timeout";
						finalMessage = "Request timeout. Please try again.";
					} else {
						errorType = "api_error";
						errorCode = "internal_error";
					}

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
