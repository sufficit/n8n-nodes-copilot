import { IDataObject, IExecuteFunctions, INodeExecutionData, NodeOperationError } from 'n8n-workflow';
import { makeApiRequest, CopilotResponse } from '../../GitHubCopilotChatAPI/utils';
import { GITHUB_COPILOT_API } from '../../../shared/utils/GitHubCopilotEndpoints';
import { GitHubCopilotModelsManager } from '../../../shared/models/GitHubCopilotModels';
import { DynamicModelsManager } from '../../../shared/utils/DynamicModelsManager';
import { parseMessages } from './parseMessages';

// OpenAI → GitHub Copilot model name mapping
const MODEL_MAPPING: Record<string, string> = {
	'gpt-4': 'gpt-4o',
	'gpt-4o': 'gpt-4o',
	'gpt-4o-mini': 'gpt-4o-mini',
	'gpt-4-turbo': 'gpt-4o',
	'claude-3-5-sonnet': 'claude-3.5-sonnet',
	'claude-3.5-sonnet-20241022': 'claude-3.5-sonnet',
	o1: 'o1',
	'o1-preview': 'o1-preview',
	'o1-mini': 'o1-mini',
};

function resolveModel(context: IExecuteFunctions, i: number): string {
	const modelSource = context.getNodeParameter('modelSource', i, 'fromList') as string;

	if (modelSource === 'custom') {
		const custom = context.getNodeParameter('customModel', i) as string;
		if (!custom?.trim()) throw new Error("Custom model name is required when using 'Custom (Manual Entry)' mode");
		console.log(`🔧 Using custom model: ${custom}`);
		return custom;
	}

	const selected = context.getNodeParameter('model', i) as string;
	if (selected === '__manual__') {
		const manual = context.getNodeParameter('customModel', i) as string;
		if (!manual?.trim()) throw new Error("Custom model name is required when selecting '✏️ Enter Custom Model Name'");
		console.log(`✏️ Using manually entered model: ${manual}`);
		return manual;
	}

	console.log(`📋 Using model from list: ${selected}`);
	return selected;
}

function detectVisionContent(messages: Array<{ role: string; content: any }>): boolean {
	for (const msg of messages) {
		const content = (msg as any).content;
		const type = (msg as any).type;

		if (type === 'file' || type === 'image') return true;

		if (typeof content === 'string') {
			const trimmed = content.trim();
			const isDataUrl = /^data:image\/[a-z]+;base64,[A-Za-z0-9+\/=]{100,}/i.test(trimmed);
			if (isDataUrl || trimmed.startsWith('copilot-file://')) return true;
		} else if (Array.isArray(content)) {
			for (const part of content) {
				if (part?.type === 'image_url' || part?.type === 'image' || part?.image_url || part?.type === 'file') {
					return true;
				}
			}
		}
	}
	return false;
}

async function resolveVisionModel(
	context: IExecuteFunctions,
	copilotModel: string,
	advancedOptions: IDataObject,
	i: number,
): Promise<string> {
	const credentials = await context.getCredentials('githubCopilotApi');
	const oauthToken = credentials.oauthToken as string;

	let supportsVision: boolean | null = DynamicModelsManager.modelSupportsVision(oauthToken, copilotModel);
	if (supportsVision === null) {
		const modelInfo = GitHubCopilotModelsManager.getModelByValue(copilotModel);
		supportsVision = !!(modelInfo?.capabilities?.vision || modelInfo?.capabilities?.multimodal);
		console.log(`👁️ Vision check for ${copilotModel}: static list, supported=${supportsVision}`);
	} else {
		console.log(`👁️ Vision check for ${copilotModel}: API cache, supported=${supportsVision}`);
	}

	if (supportsVision) return copilotModel;

	const enableFallback = (advancedOptions.enableVisionFallback as boolean) || false;
	if (!enableFallback) {
		throw new NodeOperationError(
			context.getNode(),
			`Model ${copilotModel} does not support vision. Enable "Vision Fallback" in Advanced Options and select a vision-capable model.`,
			{ itemIndex: i },
		);
	}

	const fallbackRaw = advancedOptions.visionFallbackModel as string;
	const fallback =
		fallbackRaw === '__manual__'
			? (advancedOptions.visionFallbackCustomModel as string)
			: fallbackRaw;

	if (!fallback?.trim()) {
		throw new NodeOperationError(
			context.getNode(),
			'Vision fallback enabled but no fallback model was selected or provided.',
			{ itemIndex: i },
		);
	}

	console.log(`👁️ Model ${copilotModel} lacks vision - falling back to: ${fallback}`);
	return fallback;
}

function parseResponseFormat(
	requestBodyFromJson: IDataObject | undefined,
	advancedOptions: IDataObject,
): { type?: string } | undefined {
	if (requestBodyFromJson?.response_format) {
		const rf = requestBodyFromJson.response_format as { type?: string };
		console.log('📋 response_format from JSON body:', JSON.stringify(rf));
		return rf;
	}

	const uiValue = (advancedOptions.response_format as string) || 'text';
	if (uiValue && uiValue !== 'text') {
		console.log('📋 response_format from UI:', uiValue);
		return { type: uiValue };
	}

	if (advancedOptions.response_format && typeof advancedOptions.response_format === 'string') {
		try {
			const parsed = JSON.parse(advancedOptions.response_format as string) as { type?: string };
			console.log('📋 response_format from advancedOptions:', JSON.stringify(parsed));
			return parsed;
		} catch {
			console.log('⚠️ Failed to parse response_format from advancedOptions');
		}
	}

	return undefined;
}

function cleanJsonFromMarkdown(content: string): string {
	const trimmed = content.trim();
	const match = trimmed.match(/^```(?:json)?\s*\n([\s\S]*?)\n```\s*$/);
	if (match?.[1]) return match[1].trim();
	return trimmed;
}

function buildOpenAIResponse(
	response: CopilotResponse,
	model: string,
	response_format: { type?: string } | undefined,
): Record<string, any> {
	const result: Record<string, any> = {
		id: response.id || `chatcmpl-${Date.now()}`,
		object: response.object || 'chat.completion',
		created: response.created || Math.floor(Date.now() / 1000),
		model,
		choices: response.choices.map((choice: any, idx: number) => {
			console.log(`\n📝 Processing choice ${idx}: role=${choice.message.role}`);

			let processedContent = choice.message.content;
			if (choice.message.content != null && response_format?.type === 'json_object') {
				processedContent = cleanJsonFromMarkdown(choice.message.content);
			}

			const choiceObj: Record<string, any> = {
				index: choice.index,
				message: {
					role: choice.message.role,
					content: processedContent,
					refusal: choice.message.refusal || null,
					annotations: choice.message.annotations || [],
				},
				logprobs: choice.logprobs || null,
				finish_reason: choice.finish_reason,
			};

			if (choice.message.tool_calls?.length) {
				choiceObj.message.tool_calls = choice.message.tool_calls;
			}

			return choiceObj;
		}),
		usage: response.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
	};

	if ((response as any).system_fingerprint) {
		result.system_fingerprint = (response as any).system_fingerprint;
	}
	return result;
}

/**
 * Executes the "Chat Completions" operation.
 */
export async function executeChatCompletion(
	context: IExecuteFunctions,
	items: INodeExecutionData[],
	i: number,
): Promise<Record<string, any>> {
	// Resolve model
	const model = resolveModel(context, i);

	// Parse messages
	const { messages, requestBodyFromJson } = await parseMessages(context, items, i);

	// Advanced options
	const advancedOptions = context.getNodeParameter('advancedOptions', i, {}) as IDataObject;

	let max_tokens = (advancedOptions.max_tokens as number) || 4096;
	if (!max_tokens || max_tokens <= 0 || isNaN(max_tokens)) max_tokens = 4096;

	const temperature = (advancedOptions.temperature as number) ?? 1;
	const top_p = (advancedOptions.top_p as number) ?? 1;
	const frequency_penalty = (advancedOptions.frequency_penalty as number) ?? 0;
	const presence_penalty = (advancedOptions.presence_penalty as number) ?? 0;
	const seed = (advancedOptions.seed as number) || 0;
	const stream = (advancedOptions.stream as boolean) ?? false;
	const user = (advancedOptions.user as string) || undefined;
	const stop = (advancedOptions.stop as string) || undefined;

	// Parse tools
	let parsedTools: Array<Record<string, unknown>> = [];
	const tools = advancedOptions.tools as string | Array<Record<string, unknown>> | undefined;
	if (tools) {
		try {
			if (Array.isArray(tools) && tools.length > 0) {
				parsedTools = tools;
			} else if (typeof tools === 'string' && tools.trim()) {
				const parsed = JSON.parse(tools);
				if (Array.isArray(parsed) && parsed.length > 0) parsedTools = parsed;
			}
		} catch {
			console.log('⚠️ Failed to parse tools, ignoring');
		}
	}

	// Parse response_format
	const response_format = parseResponseFormat(requestBodyFromJson, advancedOptions);

	// Map model name + vision handling
	let copilotModel = MODEL_MAPPING[model] || model;
	const hasVisionContent = detectVisionContent(messages);
	if (hasVisionContent) {
		copilotModel = await resolveVisionModel(context, copilotModel, advancedOptions, i);
	}

	// Build request body
	const requestBody: Record<string, unknown> = {
		model: copilotModel,
		messages,
		stream,
		temperature,
		max_tokens,
	};

	if (top_p !== 1) requestBody.top_p = top_p;
	if (frequency_penalty !== 0) requestBody.frequency_penalty = frequency_penalty;
	if (presence_penalty !== 0) requestBody.presence_penalty = presence_penalty;
	if (user) requestBody.user = user;
	if (stop) {
		try {
			requestBody.stop = JSON.parse(stop);
		} catch {
			requestBody.stop = stop;
		}
	}
	if (parsedTools.length > 0) {
		requestBody.tools = parsedTools;
		const tool_choice = (advancedOptions.tool_choice as string) || 'auto';
		if (tool_choice !== 'auto') requestBody.tool_choice = tool_choice;
	}
	if (response_format) requestBody.response_format = response_format;
	if (seed > 0) requestBody.seed = seed;

	console.log(`🚀 Sending request: model=${copilotModel}, messages=${messages.length}, vision=${hasVisionContent}`);

	// Make API request
	let response: CopilotResponse;
	try {
		response = await makeApiRequest(
			context,
			GITHUB_COPILOT_API.ENDPOINTS.CHAT_COMPLETIONS,
			requestBody,
			hasVisionContent,
		);
	} catch (error) {
		const errorMsg = error instanceof Error ? error.message : String(error);
		throw new NodeOperationError(
			context.getNode(),
			`${errorMsg}\n\n🤖 Model used: ${copilotModel}`,
		);
	}

	const retriesUsed = (response as any)._retryMetadata?.retries || 0;
	if (retriesUsed > 0) console.log(`ℹ️ Request completed with ${retriesUsed} retry(ies)`);

	// Build and return OpenAI-compatible response
	return buildOpenAIResponse(response, model, response_format);
}
