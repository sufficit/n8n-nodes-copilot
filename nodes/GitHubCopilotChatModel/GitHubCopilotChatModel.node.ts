import {
	INodeType,
	INodeTypeDescription,
	ISupplyDataFunctions,
	SupplyData,
	ILoadOptionsFunctions,
	INodePropertyOptions,
} from 'n8n-workflow';

import { ChatOpenAI } from '@langchain/openai';
import {
	GitHubCopilotModelsManager,
	DEFAULT_MODELS,
} from '../../shared/models/GitHubCopilotModels';
import { GITHUB_COPILOT_API } from '../../shared/utils/GitHubCopilotEndpoints';
import { loadAvailableModels } from '../../shared/models/DynamicModelLoader';
import { CHAT_MODEL_PROPERTIES } from '../../shared/properties/ModelProperties';
import {
	getMinVSCodeVersion,
	getAdditionalHeaders,
} from '../../shared/models/ModelVersionRequirements';
import { makeGitHubCopilotRequest } from '../../shared/utils/GitHubCopilotApiUtils';

// Custom ChatOpenAI-compatible class that uses GitHub Copilot API with proper retry and OAuth
class GitHubCopilotChatOpenAI extends ChatOpenAI {
	private context: ISupplyDataFunctions;
	private options: any;

	constructor(context: ISupplyDataFunctions, options: any, config: any) {
		super(config);
		this.context = context;
		this.options = options;
	}

	// Override invocationParams to ensure proper parameter handling
	invocationParams(options?: any) {
		const params = super.invocationParams(options);
		// Ensure model is properly set
		params.model = this.model;
		return params;
	}

	async _generate(messages: any[], options?: any): Promise<any> {
		// Validate input messages
		if (!messages || messages.length === 0) {
			throw new Error('No messages provided for generation');
		}

		// Convert LangChain messages to GitHub Copilot format
		let copilotMessages = messages.map((msg) => {
			// Map LangChain message types to OpenAI-compatible roles
			let role: string;
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
					role = 'user'; // fallback
			}

			// Handle different content types properly
			let content: any = msg.content;
			if (typeof content === 'string') {
				// String content - use as is
			} else if (Array.isArray(content)) {
				// Multimodal content (images, etc.) - GitHub Copilot expects specific format
				// For now, stringify but log warning
				console.warn(`⚠️ Complex content detected, stringifying:`, content);
				content = JSON.stringify(content);
			} else if (content === null || content === undefined) {
				content = '';
			} else {
				// Other complex objects
				console.warn(`⚠️ Non-string content detected, stringifying:`, typeof content);
				content = JSON.stringify(content);
			}

			return {
				role,
				content,
			};
		});

		// Add system message from options if provided and not already present
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

		// Validate message content
		const validMessages = copilotMessages.filter((msg) => {
			if (!msg.content || msg.content.trim() === '') {
				console.warn(`⚠️ Filtering out empty message with role: ${msg.role}`);
				return false;
			}
			return true;
		});

		if (validMessages.length === 0) {
			throw new Error('No valid messages after filtering empty content');
		}

		// Build request body
		const requestBody: any = {
			model: (this as any).modelName || this.model,
			messages: validMessages,
			temperature: this.temperature,
			max_tokens: this.maxTokens,
			top_p: this.topP,
			stream: this.options.enableStreaming || false, // Support streaming if enabled
		};

		// Add tools if configured
		if (this.options.tools && this.options.tools.length > 0) {
			requestBody.tools = this.options.tools;
			requestBody.tool_choice = this.options.tool_choice || 'auto';
			console.log(`🔧 Request includes ${this.options.tools.length} tools`);
		}

		const startTime = Date.now();

		try {
			// Use our robust API request function with retry logic
			const response = await makeGitHubCopilotRequest(
				this.context as any, // Cast to avoid type issues
				GITHUB_COPILOT_API.ENDPOINTS.CHAT_COMPLETIONS,
				requestBody,
				false, // hasMedia
			);

			const endTime = Date.now();
			const latency = endTime - startTime;
			console.log(`⏱️ GitHub Copilot API call completed in ${latency}ms`);

			// Validate response structure
			if (!response.choices || response.choices.length === 0) {
				throw new Error('GitHub Copilot API returned no choices in response');
			}

			const choice = response.choices[0];
			if (!choice.message) {
				throw new Error('GitHub Copilot API returned choice without message');
			}

			// Convert GitHub Copilot response to LangChain format
			const langchainMessage = {
				_getType: () => choice.message.role,
				content: choice.message.content || '',
				tool_calls: choice.message.tool_calls,
			};

			// Log response details for debugging
			console.log(
				`📝 Response: role=${choice.message.role}, content_length=${choice.message.content?.length || 0}, finish_reason=${choice.finish_reason}`,
			);

			return {
				generations: [
					{
						text: choice.message.content || '',
						generationInfo: {
							finish_reason: choice.finish_reason,
						},
						message: langchainMessage,
					},
				],
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
		inputs: [],
		outputs: ['ai_languageModel'],
		outputNames: ['Model'],
		credentials: [
			{
				name: 'githubCopilotApi',
				required: true,
			},
		],
		properties: [
			// Model properties (shared across nodes)
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
						description: 'Controls randomness in output. Lower values make responses more focused.',
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
						description: 'Enable streaming responses for real-time output (experimental)',
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
				],
			},
		],
	};

	methods = {
		loadOptions: {
			async getAvailableModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				return await loadAvailableModels.call(this);
			},
		},
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		let model = this.getNodeParameter('model', itemIndex) as string;

		// Check if user selected manual entry
		if (model === '__manual__') {
			// User selected "✏️ Enter Custom Model Name" from dropdown
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

		const options = this.getNodeParameter('options', itemIndex, {}) as {
			temperature?: number;
			maxTokens?: number;
			topP?: number;
			enableVision?: boolean;
			systemMessage?: string;
			enableRetry?: boolean;
			maxRetries?: number;
			tools?: string;
			tool_choice?: string;
		};

		// Get model information from centralized manager
		const modelInfo = GitHubCopilotModelsManager.getModelByValue(model);

		// Get credentials
		const credentials = (await this.getCredentials('githubCopilotApi')) as Record<string, unknown>;

		// Get token from credential
		const token = credentials.token as string;

		if (!token) {
			console.error('❌ Available credential properties:', Object.keys(credentials));
			throw new Error(
				'GitHub Copilot: No token found in credentials. Available properties: ' +
					Object.keys(credentials).join(', '),
			);
		}

		// Debug: Show token info for troubleshooting
		const tokenPrefix =
			token.substring(0, Math.min(4, token.indexOf('_') + 1)) || token.substring(0, 4);
		const tokenSuffix = token.substring(Math.max(0, token.length - 5));
		console.log(
			`🔍 GitHub Copilot ChatModel OAuth2 Debug: Using token ${tokenPrefix}...${tokenSuffix}`,
		);

		// Note: GitHub Copilot accepts different token formats
		if (
			!token.startsWith('gho_') &&
			!token.startsWith('ghu_') &&
			!token.startsWith('github_pat_')
		) {
			console.warn(
				`⚠️ Unexpected token format: ${tokenPrefix}...${tokenSuffix}. Trying API call anyway.`,
			);
		}

		// Fallback to gpt-4o-mini if model not found or use a safe default
		const safeModel = modelInfo ? model : DEFAULT_MODELS.GENERAL;
		const safeModelInfo =
			modelInfo || GitHubCopilotModelsManager.getModelByValue(DEFAULT_MODELS.GENERAL);

		// Get model-specific version requirements
		const minVSCodeVersion = getMinVSCodeVersion(safeModel);
		const additionalHeaders = getAdditionalHeaders(safeModel);

		console.log(`🔧 Model: ${safeModel} requires VS Code version: ${minVSCodeVersion}`);

		// Parse tools if provided
		let parsedTools: Array<Record<string, unknown>> = [];
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

		// Configure model based on capabilities
		const modelConfig = {
			// Don't use apiKey directly, use configuration instead
			model: safeModel,
			temperature: options.temperature || 0.7,
			maxTokens: Math.min(
				options.maxTokens || 1000,
				safeModelInfo?.capabilities.maxOutputTokens || 4096,
			),
			topP: options.topP || 1,
			maxRetries: options.enableRetry !== false ? options.maxRetries || 3 : 0,
			// Add tools support
			...(parsedTools.length > 0 && {
				tools: parsedTools,
				tool_choice: options.tool_choice || 'auto',
			}),
			configuration: {
				baseURL: GITHUB_COPILOT_API.BASE_URL,
				apiKey: token, // Use validated token
				defaultHeaders: {
					'User-Agent': 'GitHubCopilotChat/1.0.0 n8n/3.10.1',
					Accept: 'application/json',
					'Editor-Version': `vscode/${minVSCodeVersion}`,
					'Editor-Plugin-Version': 'copilot-chat/0.12.0',
					'X-Request-Id': `n8n-chatmodel-${Date.now()}-${Math.random().toString(36).substring(7)}`,
					...additionalHeaders,
					...(options.enableVision &&
						safeModelInfo?.capabilities.vision && {
							'Copilot-Vision-Request': 'true',
							'Copilot-Media-Request': 'true',
						}),
				},
			},
		};

		// Create a customized ChatOpenAI instance for GitHub Copilot
		const chatModel = new GitHubCopilotChatOpenAI(this, options, modelConfig);

		return {
			response: chatModel,
		};
	}
}
