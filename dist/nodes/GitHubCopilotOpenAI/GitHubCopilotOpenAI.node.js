"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHubCopilotOpenAI = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const nodeProperties_1 = require("./nodeProperties");
const utils_1 = require("../GitHubCopilotChatAPI/utils");
const GitHubCopilotEndpoints_1 = require("../../shared/utils/GitHubCopilotEndpoints");
const DynamicModelLoader_1 = require("../../shared/models/DynamicModelLoader");
class GitHubCopilotOpenAI {
    constructor() {
        this.description = {
            displayName: 'GitHub Copilot OpenAI',
            name: 'gitHubCopilotOpenAI',
            icon: 'file:../../shared/icons/copilot.svg',
            group: ['transform'],
            version: 1,
            subtitle: '={{$parameter["model"]}}',
            description: 'OpenAI-compatible GitHub Copilot Chat API with full support for messages, tools, and all OpenAI parameters',
            defaults: {
                name: 'GitHub Copilot OpenAI',
            },
            inputs: ['main'],
            outputs: ['main'],
            credentials: [
                {
                    name: 'githubCopilotApi',
                    required: true,
                },
            ],
            properties: nodeProperties_1.nodeProperties,
        };
        this.methods = {
            loadOptions: {
                async getAvailableModels() {
                    return await DynamicModelLoader_1.loadAvailableModels.call(this);
                },
            },
        };
    }
    async execute() {
        var _a, _b, _c, _d, _e, _f;
        const items = this.getInputData();
        const returnData = [];
        for (let i = 0; i < items.length; i++) {
            try {
                const modelSource = this.getNodeParameter('modelSource', i, 'fromList');
                let model;
                if (modelSource === 'custom') {
                    model = this.getNodeParameter('customModel', i);
                    if (!model || model.trim() === '') {
                        throw new Error("Custom model name is required when using 'Custom (Manual Entry)' mode");
                    }
                    console.log(`🔧 Using custom model: ${model}`);
                }
                else {
                    const selectedModel = this.getNodeParameter('model', i);
                    if (selectedModel === '__manual__') {
                        model = this.getNodeParameter('customModel', i);
                        if (!model || model.trim() === '') {
                            throw new Error("Custom model name is required when selecting '✏️ Enter Custom Model Name'");
                        }
                        console.log(`✏️ Using manually entered model: ${model}`);
                    }
                    else {
                        model = selectedModel;
                        console.log(`📋 Using model from list: ${model}`);
                    }
                }
                const messagesInputMode = this.getNodeParameter('messagesInputMode', i, 'manual');
                let messages = [];
                let requestBodyFromJson = undefined;
                if (messagesInputMode === 'json') {
                    const messagesJson = this.getNodeParameter('messagesJson', i, '[]');
                    try {
                        let parsed;
                        if (typeof messagesJson === 'object') {
                            parsed = messagesJson;
                            console.log('📥 Received messages as direct object/array (no parsing needed)');
                        }
                        else {
                            parsed = JSON.parse(messagesJson);
                            console.log('📥 Parsed messages from JSON string');
                        }
                        if (Array.isArray(parsed)) {
                            messages = parsed;
                        }
                        else if (parsed.messages && Array.isArray(parsed.messages)) {
                            messages = parsed.messages;
                            requestBodyFromJson = parsed;
                            console.log('📥 Full OpenAI request body received:', JSON.stringify(parsed, null, 2));
                        }
                        else {
                            messages = parsed;
                        }
                    }
                    catch (error) {
                        throw new Error(`Failed to parse messages JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    }
                }
                else {
                    const messagesParam = this.getNodeParameter('messages', i, {
                        message: [],
                    });
                    console.log('📥 Manual mode - messagesParam:', JSON.stringify(messagesParam, null, 2));
                    if (messagesParam.message && Array.isArray(messagesParam.message)) {
                        for (const msg of messagesParam.message) {
                            const message = {
                                role: msg.role,
                                content: msg.content,
                            };
                            if (msg.type && (msg.type === 'text' || msg.type === 'image_url')) {
                                message.type = msg.type;
                            }
                            messages.push(message);
                        }
                    }
                    console.log('📥 Manual mode - parsed messages:', JSON.stringify(messages, null, 2));
                }
                if (messages.length === 0) {
                    messages.push({
                        role: 'user',
                        content: 'Hello! How can you help me?',
                    });
                }
                for (let msgIndex = 0; msgIndex < messages.length; msgIndex++) {
                    const msg = messages[msgIndex];
                    if (Array.isArray(msg.content)) {
                        for (const contentItem of msg.content) {
                            if (contentItem.type === 'file') {
                                throw new n8n_workflow_1.NodeOperationError(this.getNode(), `❌ GitHub Copilot API Error: File attachments cannot be used inside 'content' array.\n\n` +
                                    `📋 INCORRECT FORMAT (OpenAI style - doesn't work):\n` +
                                    `{\n` +
                                    `  "role": "user",\n` +
                                    `  "content": [\n` +
                                    `    {"type": "text", "text": "Analyze this"},\n` +
                                    `    {"type": "file", "file": "data:..."}  ❌ WRONG\n` +
                                    `  ]\n` +
                                    `}\n\n` +
                                    `✅ CORRECT FORMAT (GitHub Copilot - message level):\n` +
                                    `[\n` +
                                    `  {"role": "user", "content": "Analyze this file"},\n` +
                                    `  {"role": "user", "content": "data:image/png;base64,...", "type": "file"}  ✅ CORRECT\n` +
                                    `]\n\n` +
                                    `💡 Solution: Use separate messages with 'type' property at message level, not inside content array.`, { itemIndex: i });
                            }
                        }
                    }
                }
                console.log('📤 Final messages being sent to API:', JSON.stringify(messages, null, 2));
                const advancedOptions = this.getNodeParameter('advancedOptions', i, {});
                let parsedTools = [];
                const tools = advancedOptions.tools;
                if (tools) {
                    try {
                        if (typeof tools === 'object' && Array.isArray(tools) && tools.length > 0) {
                            parsedTools = tools;
                            console.log('📥 Received tools as direct array (no parsing needed)');
                        }
                        else if (typeof tools === 'string' && tools.trim()) {
                            const parsed = JSON.parse(tools);
                            if (Array.isArray(parsed) && parsed.length > 0) {
                                parsedTools = parsed;
                                console.log('📥 Parsed tools from JSON string');
                            }
                            else {
                                console.log('📥 Tools string parsed but empty or not an array');
                            }
                        }
                        else {
                            console.log('📥 Tools field present but empty or invalid');
                        }
                    }
                    catch (error) {
                        console.log('⚠️ Failed to parse tools, ignoring:', error instanceof Error ? error.message : 'Unknown error');
                    }
                }
                else {
                    console.log('📥 No tools specified');
                }
                let max_tokens = advancedOptions.max_tokens || 4096;
                if (!max_tokens || max_tokens <= 0 || isNaN(max_tokens)) {
                    max_tokens = 4096;
                    console.log('⚠️ Invalid max_tokens value, using default: 4096');
                }
                const temperature = (_a = advancedOptions.temperature) !== null && _a !== void 0 ? _a : 1;
                const top_p = (_b = advancedOptions.top_p) !== null && _b !== void 0 ? _b : 1;
                const frequency_penalty = (_c = advancedOptions.frequency_penalty) !== null && _c !== void 0 ? _c : 0;
                const presence_penalty = (_d = advancedOptions.presence_penalty) !== null && _d !== void 0 ? _d : 0;
                const seed = advancedOptions.seed || 0;
                const stream = (_e = advancedOptions.stream) !== null && _e !== void 0 ? _e : false;
                const user = advancedOptions.user || undefined;
                const stop = advancedOptions.stop || undefined;
                const response_format_ui = advancedOptions.response_format || 'text';
                let response_format = undefined;
                if (requestBodyFromJson === null || requestBodyFromJson === void 0 ? void 0 : requestBodyFromJson.response_format) {
                    response_format = requestBodyFromJson.response_format;
                    console.log('📋 response_format from JSON request body:', JSON.stringify(response_format));
                }
                else if (response_format_ui && response_format_ui !== 'text') {
                    response_format = { type: response_format_ui };
                    console.log('📋 response_format from UI field:', JSON.stringify(response_format));
                }
                else if (advancedOptions.response_format &&
                    typeof advancedOptions.response_format === 'string') {
                    try {
                        response_format = JSON.parse(advancedOptions.response_format);
                        console.log('📋 response_format from advancedOptions:', JSON.stringify(response_format));
                    }
                    catch {
                        console.log('⚠️ Failed to parse response_format from advancedOptions');
                    }
                }
                if (response_format) {
                    console.log('✅ Final response_format:', JSON.stringify(response_format));
                    console.log('🔍 response_format.type:', response_format.type);
                }
                else {
                    console.log('ℹ️ No response_format specified - using default text format');
                }
                const modelMapping = {
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
                const copilotModel = modelMapping[model] || model;
                const requestBody = {
                    model: copilotModel,
                    messages,
                    stream,
                    temperature,
                    max_tokens,
                };
                if (top_p !== 1) {
                    requestBody.top_p = top_p;
                }
                if (frequency_penalty !== 0) {
                    requestBody.frequency_penalty = frequency_penalty;
                }
                if (presence_penalty !== 0) {
                    requestBody.presence_penalty = presence_penalty;
                }
                if (user) {
                    requestBody.user = user;
                }
                if (stop) {
                    try {
                        requestBody.stop = JSON.parse(stop);
                    }
                    catch {
                        requestBody.stop = stop;
                    }
                }
                if (parsedTools.length > 0) {
                    requestBody.tools = parsedTools;
                    const tool_choice = advancedOptions.tool_choice || 'auto';
                    if (tool_choice !== 'auto') {
                        requestBody.tool_choice = tool_choice;
                    }
                }
                if (response_format) {
                    requestBody.response_format = response_format;
                }
                if (seed > 0) {
                    requestBody.seed = seed;
                }
                console.log('🚀 Sending request to GitHub Copilot API:');
                console.log('  Model:', copilotModel);
                console.log('  Messages count:', messages.length);
                console.log('  Request body:', JSON.stringify(requestBody, null, 2));
                const response = await (0, utils_1.makeApiRequest)(this, GitHubCopilotEndpoints_1.GITHUB_COPILOT_API.ENDPOINTS.CHAT_COMPLETIONS, requestBody, false);
                const retriesUsed = ((_f = response._retryMetadata) === null || _f === void 0 ? void 0 : _f.retries) || 0;
                if (retriesUsed > 0) {
                    console.log(`ℹ️ Request completed with ${retriesUsed} retry(ies)`);
                }
                const cleanJsonFromMarkdown = (content) => {
                    if (!content || typeof content !== 'string') {
                        return content;
                    }
                    try {
                        const trimmed = content.trim();
                        console.log('🧹 cleanJsonFromMarkdown - Input length:', trimmed.length);
                        const jsonBlockRegex = /^```(?:json)?\s*\n([\s\S]*?)\n```\s*$/;
                        const match = trimmed.match(jsonBlockRegex);
                        if (match && match[1]) {
                            const extracted = match[1].trim();
                            console.log('✅ cleanJsonFromMarkdown - Extracted from markdown block');
                            return extracted;
                        }
                        console.log('ℹ️ cleanJsonFromMarkdown - No markdown block found, returning as is');
                        return trimmed;
                    }
                    catch (error) {
                        console.error('❌ cleanJsonFromMarkdown - Error:', error);
                        return content;
                    }
                };
                console.log('🔨 Building OpenAI response...');
                console.log('🔍 response_format check:', (response_format === null || response_format === void 0 ? void 0 : response_format.type) === 'json_object' ? 'WILL CLEAN MARKDOWN' : 'WILL KEEP AS IS');
                const openAIResponse = {
                    id: response.id || `chatcmpl-${Date.now()}`,
                    object: response.object || 'chat.completion',
                    created: response.created || Math.floor(Date.now() / 1000),
                    model: model,
                    choices: response.choices.map((choice, choiceIndex) => {
                        var _a;
                        console.log(`\n📝 Processing choice ${choiceIndex}:`);
                        console.log('  - role:', choice.message.role);
                        console.log('  - content type:', typeof choice.message.content);
                        console.log('  - content length:', ((_a = choice.message.content) === null || _a === void 0 ? void 0 : _a.length) || 0);
                        console.log('  - has tool_calls:', !!choice.message.tool_calls);
                        let processedContent = choice.message.content;
                        if (choice.message.content !== null && choice.message.content !== undefined) {
                            if ((response_format === null || response_format === void 0 ? void 0 : response_format.type) === 'json_object') {
                                console.log('  🧹 Applying cleanJsonFromMarkdown (keeping as string)...');
                                processedContent = cleanJsonFromMarkdown(choice.message.content);
                                console.log('  ✅ Processed content type:', typeof processedContent);
                            }
                            else {
                                console.log('  ℹ️ Keeping content as is');
                            }
                        }
                        const choiceObj = {
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
                        if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
                            choiceObj.message.tool_calls = choice.message.tool_calls;
                        }
                        return choiceObj;
                    }),
                    usage: response.usage || {
                        prompt_tokens: 0,
                        completion_tokens: 0,
                        total_tokens: 0,
                    },
                };
                if (response.system_fingerprint) {
                    openAIResponse.system_fingerprint = response.system_fingerprint;
                }
                returnData.push({
                    json: openAIResponse,
                    pairedItem: { item: i },
                });
            }
            catch (error) {
                if (this.continueOnFail()) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    const errorString = JSON.stringify(error);
                    console.error('❌ Error occurred:', errorMessage);
                    console.error('❌ Error details:', errorString);
                    let cleanMessage = errorMessage;
                    cleanMessage = cleanMessage.replace(/\[Token used: [^\]]+\]/g, '').trim();
                    cleanMessage = cleanMessage.replace(/\[Attempt: \d+\/\d+\]/g, '').trim();
                    cleanMessage = cleanMessage.replace(/^GitHub Copilot API error:\s*/i, '').trim();
                    cleanMessage = cleanMessage.replace(/\s+/g, ' ').trim();
                    console.log('🧹 Cleaned error message:', cleanMessage);
                    let apiError = null;
                    try {
                        if (error && typeof error === 'object' && 'cause' in error) {
                            const cause = error.cause;
                            if (cause && cause.error) {
                                apiError = cause.error;
                            }
                        }
                        if (!apiError && errorString.includes('{') && errorString.includes('}')) {
                            const jsonMatch = errorString.match(/\{[^{}]*"error"[^{}]*\}/);
                            if (jsonMatch) {
                                apiError = JSON.parse(jsonMatch[0]);
                            }
                        }
                    }
                    catch (parseError) {
                        console.error('Failed to parse API error:', parseError);
                    }
                    const lowerMessage = cleanMessage.toLowerCase();
                    const is400Error = lowerMessage.includes('400') ||
                        lowerMessage.includes('bad request') ||
                        (apiError && apiError.error && apiError.error.code === 'invalid_request_body');
                    if (is400Error) {
                        console.log('🚫 400 Bad Request detected - throwing non-retryable error');
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Bad Request (400): ${cleanMessage}`, {
                            itemIndex: i,
                            description: 'The request was malformed or contains invalid parameters. Retrying will not help.',
                        });
                    }
                    let errorType = 'invalid_request_error';
                    let errorCode = null;
                    let errorParam = null;
                    let finalMessage = cleanMessage;
                    if (apiError && apiError.error) {
                        finalMessage = apiError.error.message || cleanMessage;
                        errorType = apiError.error.type || errorType;
                        errorCode = apiError.error.code || null;
                        errorParam = apiError.error.param || null;
                        console.log('✅ Using GitHub Copilot API error details');
                    }
                    else {
                        if (lowerMessage.includes('403') || lowerMessage.includes('forbidden')) {
                            errorType = 'invalid_request_error';
                            errorCode = 'insufficient_quota';
                            if (lowerMessage.includes('access') && lowerMessage.includes('forbidden')) {
                                finalMessage =
                                    'You exceeded your current quota, please check your plan and billing details.';
                            }
                            else {
                                finalMessage = cleanMessage;
                            }
                        }
                        else if (lowerMessage.includes('max') && lowerMessage.includes('token')) {
                            errorType = 'invalid_request_error';
                            errorCode = 'context_length_exceeded';
                            errorParam = 'max_tokens';
                            finalMessage =
                                "This model's maximum context length is exceeded. Please reduce the length of the messages or completion.";
                        }
                        else if (lowerMessage.includes('401') || lowerMessage.includes('unauthorized')) {
                            errorType = 'invalid_request_error';
                            errorCode = 'invalid_api_key';
                            finalMessage =
                                'Incorrect API key provided. You can find your API key at https://platform.openai.com/account/api-keys.';
                        }
                        else if (lowerMessage.includes('429') || lowerMessage.includes('rate limit')) {
                            errorType = 'rate_limit_error';
                            errorCode = 'rate_limit_exceeded';
                            finalMessage = 'Rate limit reached. Please wait before making more requests.';
                        }
                        else if (lowerMessage.includes('timeout')) {
                            errorType = 'api_error';
                            errorCode = 'timeout';
                            finalMessage = 'Request timeout. Please try again.';
                        }
                        else {
                            errorType = 'api_error';
                            errorCode = 'internal_error';
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
                }
                else {
                    throw error;
                }
            }
        }
        return [returnData];
    }
}
exports.GitHubCopilotOpenAI = GitHubCopilotOpenAI;
