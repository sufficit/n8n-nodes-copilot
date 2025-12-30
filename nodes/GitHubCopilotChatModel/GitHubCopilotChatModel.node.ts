import {
	ISupplyDataFunctions,
	INodeType,
	INodeTypeDescription,
	SupplyData,
} from 'n8n-workflow';
import { ChatOpenAI, ChatOpenAICallOptions } from '@langchain/openai';
import { BaseMessage, AIMessage } from '@langchain/core/messages';
import type { ChatResult, ChatGeneration } from '@langchain/core/outputs';
import {
	GitHubCopilotModelsManager,
	DEFAULT_MODELS,
} from '../../shared/models/GitHubCopilotModels';
import { GITHUB_COPILOT_API } from '../../shared/utils/GitHubCopilotEndpoints';
import { loadAvailableModels, loadAvailableVisionModels } from '../../shared/models/DynamicModelLoader';
import { CHAT_MODEL_PROPERTIES } from '../../shared/properties/ModelProperties';
import {
	getMinVSCodeVersion,
	getAdditionalHeaders,
} from '../../shared/models/ModelVersionRequirements';
import { makeGitHubCopilotRequest } from '../../shared/utils/GitHubCopilotApiUtils';

/**
 * Options for configuring the GitHub Copilot Chat Model
 */
interface IOptions {
	temperature?: number;
	maxTokens?: number;
	topP?: number;
	enableStreaming?: boolean;
	systemMessage?: string;
	enableRetry?: boolean;
	timeout?: number;
	tools?: string;
	tool_choice?: string;
	enableVision?: boolean;
	/** When base model doesn't support vision, enable using a separate vision-capable model */
	enableVisionFallback?: boolean;
	/** Selected fallback model (id) or '__manual__' to type a custom model id */
	visionFallbackModel?: string;
	/** If fallback model is manual, user can enter the model id here */
	visionFallbackCustomModel?: string;
	maxRetries?: number;
}

/**
 * Content part for multimodal messages (text or image)
 * Used for vision requests with image_url content
 */
interface IMessageContentPart {
	type: 'text' | 'image_url';
	text?: string;
	image_url?: {
		url: string;
		detail?: 'auto' | 'low' | 'high';
	};
}

/**
 * Message format for GitHub Copilot API
 * Supports both text-only and multimodal (vision) content
 */
interface ICopilotMessage {
	role: 'system' | 'user' | 'assistant';
	content: string | IMessageContentPart[];
}

/**
 * Configuration for the ChatOpenAI model instance
 */
interface IModelConfig {
	model: string;
	temperature: number;
	maxTokens: number;
	topP: number;
	maxRetries: number;
	tools?: object[];
	tool_choice?: string;
	configuration: {
		baseURL: string;
		apiKey: string;
		defaultHeaders: Record<string, string>;
	};
}

/**
 * Extended ChatOpenAI class for GitHub Copilot API
 * Overrides _generate to use GitHub Copilot endpoints with proper vision support
 */
class GitHubCopilotChatOpenAI extends ChatOpenAI {
	private context: ISupplyDataFunctions;
	private options: IOptions;

	constructor(context: ISupplyDataFunctions, options: IOptions, config: IModelConfig) {
		super(config as unknown as ConstructorParameters<typeof ChatOpenAI>[0]);
		this.context = context;
		this.options = options;
	}

	/**
	 * Override invocation params to ensure model name is correctly set
	 */
	invocationParams(options?: Partial<ChatOpenAICallOptions>) {
		const params = super.invocationParams(options);
		(params as { model: string }).model = this.model;
		return params;
	}

	/**
	 * Generate a response from GitHub Copilot API
	 * 
	 * This method handles:
	 * - Converting LangChain messages to Copilot format
	 * - Detecting vision content (images) and setting appropriate headers
	 * - Adding the required Copilot-Vision-Request header for image requests
	 * - Tool/function calling support
	 * 
	 * @param messages - Array of LangChain BaseMessage objects
	 * @param options - Optional ChatOpenAI call options
	 * @returns ChatResult with generated response
	 */
	async _generate(
		messages: BaseMessage[],
		options?: Partial<ChatOpenAICallOptions>,
	): Promise<ChatResult> {
		if (!messages || messages.length === 0) {
			throw new Error('No messages provided for generation');
		}

		// Track if any message contains images for vision header
		// GitHub Copilot requires the Copilot-Vision-Request header for image requests
		let hasVisionContent = false;

		// Convert LangChain messages to Copilot API format
		let copilotMessages: ICopilotMessage[] = messages.map((msg) => {
			// Map LangChain message types to Copilot roles
			let role: 'system' | 'user' | 'assistant';
			switch (msg._getType()) {
				case 'human':
					role = 'user';
					break;
				case 'ai':
					role = 'assistant';
					break;
				case 'system':
					role = 'system';
					break;
				default:
					console.warn(`⚠️ Unknown message type: ${msg._getType()}, defaulting to 'user'`);
					role = 'user';
			}

			let content: string | IMessageContentPart[] = '';
			const rawContent = msg.content;
			
			// Check for image data in string content (data:image/... format)
			if (typeof rawContent === 'string') {
				// Detect base64 image data URLs in string content
				if (rawContent.includes('data:image/') || rawContent.match(/\[.*image.*\]/i)) {
					hasVisionContent = true;
					console.log(`👁️ Vision content detected in string message (data URL or image reference)`);
				}
				content = rawContent;
			} else if (Array.isArray(rawContent)) {
				// Check if this is a vision content array (contains image_url or image data)
				const hasImageContent = rawContent.some((part: unknown) => {
					if (typeof part === 'object' && part !== null) {
						const p = part as Record<string, unknown>;
						// Check various image content formats
						if (p.type === 'image_url' || p.type === 'image' || p.image_url !== undefined) {
							return true;
						}
						// Check for data URL in url field
						if (typeof p.url === 'string' && p.url.startsWith('data:image/')) {
							return true;
						}
						// Check for LangChain image format
						if (p.image || p.imageUrl || p.image_data) {
							return true;
						}
					}
					return false;
				});
				
				if (hasImageContent) {
					hasVisionContent = true;
					console.log(`👁️ Vision content detected in array message`);
					// Keep the array format for vision - map to proper structure
					content = rawContent.map((part: unknown) => {
						if (typeof part === 'object' && part !== null) {
							const p = part as Record<string, unknown>;
							if (p.type === 'text') {
								return { type: 'text' as const, text: String(p.text || '') };
							} else if (p.type === 'image_url' || p.type === 'image' || p.image_url) {
								// Handle various image URL formats
								const imageUrl = (p.image_url || p.image || p) as Record<string, unknown>;
								const url = String(imageUrl?.url || p.url || p.imageUrl || p.image_data || '');
								return {
									type: 'image_url' as const,
									image_url: {
										url,
										detail: (imageUrl?.detail as 'auto' | 'low' | 'high') || 'auto',
									},
								};
							}
						}
						// Fallback to text
						return { type: 'text' as const, text: String(part) };
					});
				} else {
					// Regular array content - stringify
					console.warn(`⚠️ Complex content detected, stringifying:`, rawContent);
					content = JSON.stringify(rawContent);
				}
			} else if (rawContent === null || rawContent === undefined) {
				content = '';
			} else {
				console.warn(`⚠️ Non-string content detected, stringifying:`, typeof rawContent);
				content = JSON.stringify(rawContent);
			}

			return {
				role,
				content,
			};
		});

		if (this.options.systemMessage && this.options.systemMessage.trim()) {
			const hasSystemMessage = copilotMessages.some((msg) => msg.role === 'system');
			if (!hasSystemMessage) {
				copilotMessages.unshift({
					role: 'system',
					content: this.options.systemMessage,
				});
				console.log(`🔧 Added system message from options`);
			}
		}

		const validMessages = copilotMessages.filter((msg) => {
			// Check if content is empty (handle both string and array)
			const isEmpty = Array.isArray(msg.content) 
				? msg.content.length === 0 
				: (!msg.content || (typeof msg.content === 'string' && msg.content.trim() === ''));
			
			if (isEmpty) {
				console.warn(`⚠️ Filtering out empty message with role: ${msg.role}`);
				return false;
			}
			return true;
		});

		if (validMessages.length === 0) {
			throw new Error('No valid messages after filtering empty content');
		}

		const requestBody: Record<string, unknown> = {
			model: this.model,
			messages: validMessages,
			temperature: this.temperature,
			max_tokens: this.maxTokens,
			top_p: this.topP,
			stream: this.options.enableStreaming || false,
		};

		// If this request contains images and the selected model doesn't support vision,
		// optionally switch to a configured vision-capable fallback model.
		if (hasVisionContent) {
			const baseModelInfo = GitHubCopilotModelsManager.getModelByValue(this.model);
			const baseSupportsVision = !!(baseModelInfo as any)?.capabilities?.supports?.vision;

			if (!baseSupportsVision) {
				if ((this.options as IOptions).enableVisionFallback) {
					const fallbackRaw = (this.options as IOptions).visionFallbackModel;
					const fallbackModel = fallbackRaw === '__manual__' ? (this.options as IOptions).visionFallbackCustomModel : fallbackRaw;
					if (!fallbackModel || fallbackModel.trim() === '') {
						throw new Error('Vision fallback enabled but no fallback model was selected or provided');
					}
					requestBody.model = fallbackModel;
					console.log(`👁️ Using vision fallback model ${fallbackModel} for image processing`);
				} else {
					throw new Error('Selected model does not support vision; enable Vision Fallback and pick a fallback model to process images.');
				}
			}
		}

		if (this.options.tools && (JSON.parse(this.options.tools) as unknown[]).length > 0) {
			requestBody.tools = JSON.parse(this.options.tools);
			requestBody.tool_choice = this.options.tool_choice || 'auto';
			console.log(`🔧 Request includes ${(requestBody.tools as unknown[]).length} tools`);
		}

		const startTime = Date.now();

		// Check if vision should be enabled (auto-detected OR manually enabled)
		const shouldUseVision = hasVisionContent || this.options.enableVision === true;

		// Log vision request if detected or enabled
		if (shouldUseVision) {
			console.log(`👁️ Sending vision request with Copilot-Vision-Request header (auto=${hasVisionContent}, manual=${this.options.enableVision})`);
		}

		try {
			// If there is vision content, upload external image URLs or data URLs to the Files endpoint
			if (hasVisionContent) {
				console.log('👁️ Preparing image uploads for vision content...');
				for (const msg of requestBody.messages as any[]) {
					if (!msg?.content || !Array.isArray(msg.content)) continue;
					for (const part of msg.content) {
						if (part?.type === 'image_url' && part.image_url && part.image_url.url) {
							const url = String(part.image_url.url || '');
							try {
								let buffer: Buffer | null = null;
								let mime = 'application/octet-stream';
								let filename = `upload-${Date.now()}.bin`;
								if (url.startsWith('data:image/')) {
									// data URL
									const match = url.match(/^data:(image\/[^;]+);base64,(.*)$/);
									if (match) {
										mime = match[1];
										const base64 = match[2];
										buffer = Buffer.from(base64, 'base64');
										filename = `image-${Date.now()}.${mime.split('/').pop()}`;
									}
								} else if (url.startsWith('http://') || url.startsWith('https://')) {
									// Download external image
									const res = await fetch(url);
									if (!res.ok) throw new Error(`Failed to download image: ${res.status}`);
									mime = res.headers.get('content-type') || mime;
									const arrayBuffer = await res.arrayBuffer();
									buffer = Buffer.from(arrayBuffer);
									// try to derive extension
									const ext = (mime.split('/')[1] || 'png').split('+')[0];
									filename = `image-${Date.now()}.${ext}`;
								} else {
									// Unhandled URL format, skip
									continue;
								}
								if (buffer) {
									try {
										const uploadResult = await import('../../shared/utils/GitHubCopilotApiUtils').then(m => m.uploadFileToCopilot(this.context as unknown as import('n8n-workflow').IExecuteFunctions, buffer as Buffer, filename, mime));
										// Prefer 'url' field if available
										const newUrl = uploadResult?.url || uploadResult?.file_url || uploadResult?.id ? (uploadResult.url || `copilot-file://${uploadResult.id}`) : null;
										if (newUrl) {
											part.image_url.url = newUrl;
											console.log(`👁️ Uploaded image and replaced URL with ${newUrl}`);
										} else {
											console.warn('⚠️ File upload succeeded but no URL/id returned by API', uploadResult);
										}
									} catch (err) {
										console.error('❌ Image upload failed:', err instanceof Error ? err.message : String(err));
										throw err;
									}
								}
							} catch (err) {
								console.error('❌ Preparing/uploading image failed:', err instanceof Error ? err.message : String(err));
								throw err;
							}
						}
					}
				}
			}

			const response = await makeGitHubCopilotRequest(
				this.context as unknown as import('n8n-workflow').IExecuteFunctions,
				GITHUB_COPILOT_API.ENDPOINTS.CHAT_COMPLETIONS,
				requestBody,
				shouldUseVision, // Pass vision flag for proper headers
			);

			const endTime = Date.now();
			const latency = endTime - startTime;
			console.log(`⏱️ GitHub Copilot API call completed in ${latency}ms`);

			if (!response.choices || response.choices.length === 0) {
				throw new Error('GitHub Copilot API returned no choices in response');
			}

			const choice = response.choices[0];
			if (!choice.message) {
				throw new Error('GitHub Copilot API returned choice without message');
			}

			const langchainMessage = new AIMessage({
				content: choice.message.content || '',
			});

			console.log(
				`📝 Response: role=${choice.message.role}, content_length=${choice.message.content?.length || 0}, finish_reason=${choice.finish_reason}`,
			);

			const generation: ChatGeneration = {
				text: choice.message.content || '',
				generationInfo: {
					finish_reason: choice.finish_reason,
				},
				message: langchainMessage,
			};

			return {
				generations: [generation],
				llmOutput: {
					tokenUsage: response.usage,
				},
			};
		} catch (error) {
			const endTime = Date.now();
			const latency = endTime - startTime;
			console.error(`❌ GitHub Copilot API call failed after ${latency}ms:`, error);
			throw new Error(
				`GitHub Copilot API error: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}
}

export class GitHubCopilotChatModel implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'GitHub Copilot Chat Model',
		name: 'gitHubCopilotChatModel',
		icon: 'file:../../shared/icons/copilot.svg',
		group: ['transform'],
		version: 1,
		description:
			'GitHub Copilot chat model for AI workflows with full support for tools and function calling - access GPT-5, Claude, Gemini and more using your Copilot subscription',
		defaults: {
			name: 'GitHub Copilot Chat Model',
		},
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Language Models', 'Root Nodes'],
				'Language Models': ['Chat Models (Recommended)'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://docs.github.com/copilot/using-github-copilot/using-github-copilot-chat',
					},
				],
			},
		},
		// eslint-disable-next-line n8n-nodes-base/node-class-description-inputs-wrong-regular-node
		inputs: [],
		// eslint-disable-next-line n8n-nodes-base/node-class-description-outputs-wrong
		outputs: ['ai_languageModel'] as unknown as INodeTypeDescription['outputs'],
		outputNames: ['Model'],
		credentials: [
			{
				name: 'githubCopilotApi',
				required: true,
			},
		],
		properties: [
			...CHAT_MODEL_PROPERTIES,
			{
				displayName: 'Options',
				name: 'options',
				placeholder: 'Add Option',
				description: 'Additional options for the GitHub Copilot model',
				type: 'collection',
				default: {},
				options: [
					{
						displayName: 'Temperature',
						name: 'temperature',
						default: 0.7,
						typeOptions: { maxValue: 2, minValue: 0, numberPrecision: 1 },
						description:
							'Controls randomness in output. Lower values make responses more focused.',
						type: 'number',
					},
					{
						displayName: 'Maximum Number of Tokens',
						name: 'maxTokens',
						default: 1000,
						description: 'The maximum number of tokens to generate',
						type: 'number',
						typeOptions: {
							maxValue: 32768,
						},
					},
					{
						displayName: 'Top P',
						name: 'topP',
						default: 1,
						typeOptions: { maxValue: 1, minValue: 0, numberPrecision: 2 },
						description: 'Controls diversity of output by nucleus sampling',
						type: 'number',
					},
					{
						displayName: 'Enable Streaming',
						name: 'enableStreaming',
						type: 'boolean',
						default: false,
						description:
							'Enable streaming responses for real-time output (experimental)',
					},
					{
						displayName: 'System Message',
						name: 'systemMessage',
						type: 'string',
						default: '',
						description: 'System message to set the behavior of the assistant',
						typeOptions: {
							rows: 3,
						},
					},
					{
						displayName: 'Auto Retry on 403 Error',
						name: 'enableRetry',
						type: 'boolean',
						default: true,
						description:
							'Automatically retry requests when hitting TPM (Transactions Per Minute) quota limits (HTTP 403)',
					},
					{
						displayName: 'Request Timeout (seconds)',
						name: 'timeout',
						type: 'number',
						default: 120,
						description: 'Maximum time to wait for API response (in seconds)',
						typeOptions: {
							minValue: 10,
							maxValue: 300,
						},
					},
					{
						displayName: 'Tools (Function Calling)',
						name: 'tools',
						type: 'string',
						default: '',
						description:
							'Optional: Array of tools/functions available to the model (OpenAI format). Leave empty if not using function calling.',
						hint: "JSON array of tool definitions in OpenAI format. Leave this field empty if you don't need function calling.",
						typeOptions: {
							rows: 6,
						},
					},
					{
						displayName: 'Tool Choice',
						name: 'tool_choice',
						type: 'options',
						options: [
							{
								name: 'Auto',
								value: 'auto',
								description: 'Let the model decide when to use tools',
							},
							{
								name: 'Required',
								value: 'required',
								description: 'Force the model to use at least one tool',
							},
							{
								name: 'None',
								value: 'none',
								description: 'Disable tool usage',
							},
						],
						default: 'auto',
						description: 'Control how the model uses tools',
						displayOptions: {
							show: {
								tools: ['/.+/'],
							},
						},
					},
					{
						displayName: 'Enable Vision (Image Processing)',
						name: 'enableVision',
						type: 'boolean',
						default: false,
						description: 'Enable vision capabilities for processing images. Required when sending images via chat. Only works with vision-capable models (GPT-4o, GPT-5, Claude, etc.). Note: This is auto-enabled for models that support vision.',
					},
					{
						displayName: 'Enable Vision Fallback',
						name: 'enableVisionFallback',
						type: 'boolean',
						default: false,
						description: 'When the primary model does not support vision, automatically use a vision-capable fallback model to process images. Enable this if you want to send images but your primary model does not support vision.',
					},
					{
						displayName: 'Vision Fallback Model',
						name: 'visionFallbackModel',
						type: 'options',
						typeOptions: {
							loadOptionsMethod: 'getVisionFallbackModels',
						},
						default: '',
						description: 'Select a vision-capable model to use when processing images with a non-vision primary model',
						displayOptions: {
							show: {
								enableVisionFallback: [true],
							},
						},
					},
					{
						displayName: 'Custom Vision Model',
						name: 'visionFallbackCustomModel',
						type: 'string',
						default: '',
						placeholder: 'gpt-4o, claude-sonnet-4, gemini-2.0-flash, etc.',
						description: 'Enter the model name manually for vision fallback',
						hint: 'Enter the exact model ID for vision processing (e.g., gpt-4o, claude-sonnet-4)',
						displayOptions: {
							show: {
								enableVisionFallback: [true],
								visionFallbackModel: ['__manual__'],
							},
						},
					},
				],
			},
		],
	};

	methods = {
		loadOptions: {
			async getAvailableModels(this: import('n8n-workflow').ILoadOptionsFunctions) {
				return await loadAvailableModels.call(this);
			},
			async getVisionFallbackModels(this: import('n8n-workflow').ILoadOptionsFunctions) {
				return await loadAvailableVisionModels.call(this);
			},
		},
	
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		let model = this.getNodeParameter('model', itemIndex) as string;

		if (model === '__manual__') {
			const customModel = this.getNodeParameter('customModel', itemIndex) as string;
			if (!customModel || customModel.trim() === '') {
				throw new Error(
					"Custom model name is required when selecting '✏️ Enter Custom Model Name'",
				);
			}
			model = customModel;
			console.log(`✏️ Using manually entered model: ${model}`);
		} else {
			console.log(`✅ Using model from list: ${model}`);
		}

		const options = this.getNodeParameter('options', itemIndex, {}) as IOptions;
		const modelInfo = GitHubCopilotModelsManager.getModelByValue(model);
		const credentials = (await this.getCredentials('githubCopilotApi')) as { token: string };
		const token = credentials.token;

		if (!token) {
			console.error('❌ Available credential properties:', Object.keys(credentials));
			throw new Error(
				'GitHub Copilot: No token found in credentials. Available properties: ' +
					Object.keys(credentials).join(', '),
			);
		}

		const tokenPrefix =
			token.substring(0, Math.min(4, token.indexOf('_') + 1)) || token.substring(0, 4);
		const tokenSuffix = token.substring(Math.max(0, token.length - 5));
		console.log(
			`🔍 GitHub Copilot ChatModel OAuth2 Debug: Using token ${tokenPrefix}...${tokenSuffix}`,
		);

		if (
			!token.startsWith('gho_') &&
			!token.startsWith('ghu_') &&
			!token.startsWith('github_pat_')
		) {
			console.warn(
				`⚠️ Unexpected token format: ${tokenPrefix}...${tokenSuffix}. Trying API call anyway.`,
			);
		}

		// Trust the model ID if it's provided (either from list or manual)
		// Fallback only if model is empty or undefined
		const safeModel = model || DEFAULT_MODELS.GENERAL;

		// Get model info for capabilities, fallback to general model info if not found in static list
		const safeModelInfo =
			modelInfo || GitHubCopilotModelsManager.getModelByValue(DEFAULT_MODELS.GENERAL);

		const minVSCodeVersion = getMinVSCodeVersion(safeModel);
		const additionalHeaders = getAdditionalHeaders(safeModel);

		console.log(`🔧 Model: ${safeModel} requires VS Code version: ${minVSCodeVersion}`);

		// Auto-enable vision if model supports vision
		if ((safeModelInfo as any)?.capabilities?.supports?.vision) {
			options.enableVision = true;
			console.log(`👁️ Model ${safeModel} supports vision - enabling vision automatically`);
		}

		let parsedTools: object[] = [];
		if (options.tools && options.tools.trim()) {
			try {
				const parsed = JSON.parse(options.tools);
				if (Array.isArray(parsed) && parsed.length > 0) {
					parsedTools = parsed;
					console.log(`🔧 Parsed ${parsedTools.length} tools for function calling`);
				} else {
					console.log(`⚠️ Tools field parsed but not a valid array`);
				}
			} catch (error) {
				console.log(
					`⚠️ Failed to parse tools JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
				);
			}
		}

		const modelConfig: IModelConfig = {
			model: safeModel,
			temperature: options.temperature || 0.7,
			maxTokens: Math.min(
				options.maxTokens || 1000,
				safeModelInfo?.capabilities.maxOutputTokens || 4096,
			),
			topP: options.topP || 1,
			maxRetries: options.enableRetry !== false ? options.maxRetries || 3 : 0,
			...(parsedTools.length > 0 && {
				tools: parsedTools,
				tool_choice: options.tool_choice || 'auto',
			}),
			configuration: {
				baseURL: GITHUB_COPILOT_API.BASE_URL,
				apiKey: token,
				defaultHeaders: {
					'User-Agent': 'GitHubCopilotChat/0.35.0',
					'Accept': 'application/json',
					'Editor-Version': `vscode/${minVSCodeVersion}`,
					'Editor-Plugin-Version': 'copilot-chat/0.35.0',
					'X-Request-Id': `n8n-chatmodel-${Date.now()}-${Math.random().toString(36).substring(7)}`,
					// CRITICAL: These headers are REQUIRED for premium/new models (Raptor Mini, Gemini 3, etc.)
					// Without these, you'll get 403 Forbidden errors
					'X-GitHub-Api-Version': '2025-05-01',
					'X-Interaction-Type': 'copilot-chat',
					'OpenAI-Intent': 'conversation-panel',
					'Copilot-Integration-Id': 'vscode-chat',
					...additionalHeaders,
					...(options.enableVision &&
						safeModelInfo?.capabilities.vision && {
							'Copilot-Vision-Request': 'true',
							'Copilot-Media-Request': 'true',
						}),
				},
			},
		};

		const chatModel = new GitHubCopilotChatOpenAI(this, options, modelConfig);

		return {
			response: chatModel,
		};
	}
}
