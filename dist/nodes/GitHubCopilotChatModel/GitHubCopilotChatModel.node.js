"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHubCopilotChatModel = void 0;
const openai_1 = require("@langchain/openai");
const messages_1 = require("@langchain/core/messages");
const GitHubCopilotModels_1 = require("../../shared/models/GitHubCopilotModels");
const GitHubCopilotEndpoints_1 = require("../../shared/utils/GitHubCopilotEndpoints");
const DynamicModelLoader_1 = require("../../shared/models/DynamicModelLoader");
const ModelProperties_1 = require("../../shared/properties/ModelProperties");
const ModelVersionRequirements_1 = require("../../shared/models/ModelVersionRequirements");
const GitHubCopilotApiUtils_1 = require("../../shared/utils/GitHubCopilotApiUtils");
class GitHubCopilotChatOpenAI extends openai_1.ChatOpenAI {
    constructor(context, options, config) {
        super(config);
        this.context = context;
        this.options = options;
    }
    invocationParams(options) {
        const params = super.invocationParams(options);
        params.model = this.model;
        return params;
    }
    async _generate(messages, options) {
        var _a;
        if (!messages || messages.length === 0) {
            throw new Error('No messages provided for generation');
        }
        let hasVisionContent = false;
        let copilotMessages = messages.map((msg) => {
            let role;
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
            let content = '';
            const rawContent = msg.content;
            if (typeof rawContent === 'string') {
                if (rawContent.includes('data:image/') || rawContent.match(/\[.*image.*\]/i)) {
                    hasVisionContent = true;
                    console.log(`👁️ Vision content detected in string message (data URL or image reference)`);
                }
                content = rawContent;
            }
            else if (Array.isArray(rawContent)) {
                const hasImageContent = rawContent.some((part) => {
                    if (typeof part === 'object' && part !== null) {
                        const p = part;
                        if (p.type === 'image_url' || p.type === 'image' || p.image_url !== undefined) {
                            return true;
                        }
                        if (typeof p.url === 'string' && p.url.startsWith('data:image/')) {
                            return true;
                        }
                        if (p.image || p.imageUrl || p.image_data) {
                            return true;
                        }
                    }
                    return false;
                });
                if (hasImageContent) {
                    hasVisionContent = true;
                    console.log(`👁️ Vision content detected in array message`);
                    content = rawContent.map((part) => {
                        if (typeof part === 'object' && part !== null) {
                            const p = part;
                            if (p.type === 'text') {
                                return { type: 'text', text: String(p.text || '') };
                            }
                            else if (p.type === 'image_url' || p.type === 'image' || p.image_url) {
                                const imageUrl = (p.image_url || p.image || p);
                                const url = String((imageUrl === null || imageUrl === void 0 ? void 0 : imageUrl.url) || p.url || p.imageUrl || p.image_data || '');
                                return {
                                    type: 'image_url',
                                    image_url: {
                                        url,
                                        detail: (imageUrl === null || imageUrl === void 0 ? void 0 : imageUrl.detail) || 'auto',
                                    },
                                };
                            }
                        }
                        return { type: 'text', text: String(part) };
                    });
                }
                else {
                    console.warn(`⚠️ Complex content detected, stringifying:`, rawContent);
                    content = JSON.stringify(rawContent);
                }
            }
            else if (rawContent === null || rawContent === undefined) {
                content = '';
            }
            else {
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
        const requestBody = {
            model: this.model,
            messages: validMessages,
            temperature: this.temperature,
            max_tokens: this.maxTokens,
            top_p: this.topP,
            stream: this.options.enableStreaming || false,
        };
        if (this.options.tools && JSON.parse(this.options.tools).length > 0) {
            requestBody.tools = JSON.parse(this.options.tools);
            requestBody.tool_choice = this.options.tool_choice || 'auto';
            console.log(`🔧 Request includes ${requestBody.tools.length} tools`);
        }
        const startTime = Date.now();
        const shouldUseVision = hasVisionContent || this.options.enableVision === true;
        if (shouldUseVision) {
            console.log(`👁️ Sending vision request with Copilot-Vision-Request header (auto=${hasVisionContent}, manual=${this.options.enableVision})`);
        }
        try {
            const response = await (0, GitHubCopilotApiUtils_1.makeGitHubCopilotRequest)(this.context, GitHubCopilotEndpoints_1.GITHUB_COPILOT_API.ENDPOINTS.CHAT_COMPLETIONS, requestBody, shouldUseVision);
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
            const langchainMessage = new messages_1.AIMessage({
                content: choice.message.content || '',
            });
            console.log(`📝 Response: role=${choice.message.role}, content_length=${((_a = choice.message.content) === null || _a === void 0 ? void 0 : _a.length) || 0}, finish_reason=${choice.finish_reason}`);
            const generation = {
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
        }
        catch (error) {
            const endTime = Date.now();
            const latency = endTime - startTime;
            console.error(`❌ GitHub Copilot API call failed after ${latency}ms:`, error);
            throw new Error(`GitHub Copilot API error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
class GitHubCopilotChatModel {
    constructor() {
        this.description = {
            displayName: 'GitHub Copilot Chat Model',
            name: 'gitHubCopilotChatModel',
            icon: 'file:../../shared/icons/copilot.svg',
            group: ['transform'],
            version: 1,
            description: 'GitHub Copilot chat model for AI workflows with full support for tools and function calling - access GPT-5, Claude, Gemini and more using your Copilot subscription',
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
                ...ModelProperties_1.CHAT_MODEL_PROPERTIES,
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
                            description: 'Automatically retry requests when hitting TPM (Transactions Per Minute) quota limits (HTTP 403)',
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
                            description: 'Optional: Array of tools/functions available to the model (OpenAI format). Leave empty if not using function calling.',
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
                            description: 'Enable vision capabilities for processing images. Required when sending images via chat. Only works with vision-capable models (GPT-4o, GPT-5, Claude, etc.).',
                        },
                    ],
                },
            ],
        };
        this.methods = {
            loadOptions: {
                async getAvailableModels() {
                    return await DynamicModelLoader_1.loadAvailableModels.call(this);
                },
            },
        };
    }
    async supplyData(itemIndex) {
        let model = this.getNodeParameter('model', itemIndex);
        if (model === '__manual__') {
            const customModel = this.getNodeParameter('customModel', itemIndex);
            if (!customModel || customModel.trim() === '') {
                throw new Error("Custom model name is required when selecting '✏️ Enter Custom Model Name'");
            }
            model = customModel;
            console.log(`✏️ Using manually entered model: ${model}`);
        }
        else {
            console.log(`✅ Using model from list: ${model}`);
        }
        const options = this.getNodeParameter('options', itemIndex, {});
        const modelInfo = GitHubCopilotModels_1.GitHubCopilotModelsManager.getModelByValue(model);
        const credentials = (await this.getCredentials('githubCopilotApi'));
        const token = credentials.token;
        if (!token) {
            console.error('❌ Available credential properties:', Object.keys(credentials));
            throw new Error('GitHub Copilot: No token found in credentials. Available properties: ' +
                Object.keys(credentials).join(', '));
        }
        const tokenPrefix = token.substring(0, Math.min(4, token.indexOf('_') + 1)) || token.substring(0, 4);
        const tokenSuffix = token.substring(Math.max(0, token.length - 5));
        console.log(`🔍 GitHub Copilot ChatModel OAuth2 Debug: Using token ${tokenPrefix}...${tokenSuffix}`);
        if (!token.startsWith('gho_') &&
            !token.startsWith('ghu_') &&
            !token.startsWith('github_pat_')) {
            console.warn(`⚠️ Unexpected token format: ${tokenPrefix}...${tokenSuffix}. Trying API call anyway.`);
        }
        const safeModel = modelInfo ? model : GitHubCopilotModels_1.DEFAULT_MODELS.GENERAL;
        const safeModelInfo = modelInfo || GitHubCopilotModels_1.GitHubCopilotModelsManager.getModelByValue(GitHubCopilotModels_1.DEFAULT_MODELS.GENERAL);
        const minVSCodeVersion = (0, ModelVersionRequirements_1.getMinVSCodeVersion)(safeModel);
        const additionalHeaders = (0, ModelVersionRequirements_1.getAdditionalHeaders)(safeModel);
        console.log(`🔧 Model: ${safeModel} requires VS Code version: ${minVSCodeVersion}`);
        let parsedTools = [];
        if (options.tools && options.tools.trim()) {
            try {
                const parsed = JSON.parse(options.tools);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    parsedTools = parsed;
                    console.log(`🔧 Parsed ${parsedTools.length} tools for function calling`);
                }
                else {
                    console.log(`⚠️ Tools field parsed but not a valid array`);
                }
            }
            catch (error) {
                console.log(`⚠️ Failed to parse tools JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
        const modelConfig = {
            model: safeModel,
            temperature: options.temperature || 0.7,
            maxTokens: Math.min(options.maxTokens || 1000, (safeModelInfo === null || safeModelInfo === void 0 ? void 0 : safeModelInfo.capabilities.maxOutputTokens) || 4096),
            topP: options.topP || 1,
            maxRetries: options.enableRetry !== false ? options.maxRetries || 3 : 0,
            ...(parsedTools.length > 0 && {
                tools: parsedTools,
                tool_choice: options.tool_choice || 'auto',
            }),
            configuration: {
                baseURL: GitHubCopilotEndpoints_1.GITHUB_COPILOT_API.BASE_URL,
                apiKey: token,
                defaultHeaders: {
                    'User-Agent': 'GitHubCopilotChat/1.0.0 n8n/3.10.1',
                    Accept: 'application/json',
                    'Editor-Version': `vscode/${minVSCodeVersion}`,
                    'Editor-Plugin-Version': 'copilot-chat/0.12.0',
                    'X-Request-Id': `n8n-chatmodel-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                    ...additionalHeaders,
                    ...(options.enableVision &&
                        (safeModelInfo === null || safeModelInfo === void 0 ? void 0 : safeModelInfo.capabilities.vision) && {
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
exports.GitHubCopilotChatModel = GitHubCopilotChatModel;
