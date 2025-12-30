"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHubCopilotChatAPI = void 0;
const utils_1 = require("./utils");
const nodeProperties_1 = require("./nodeProperties");
const mediaDetection_1 = require("./utils/mediaDetection");
const GitHubCopilotModels_1 = require("../../shared/models/GitHubCopilotModels");
const DynamicModelsManager_1 = require("../../shared/utils/DynamicModelsManager");
const GitHubCopilotEndpoints_1 = require("../../shared/utils/GitHubCopilotEndpoints");
const DynamicModelLoader_1 = require("../../shared/models/DynamicModelLoader");
class GitHubCopilotChatAPI {
    constructor() {
        this.description = {
            displayName: 'GitHub Copilot Chat API',
            name: 'gitHubCopilotChatAPI',
            icon: 'file:../../shared/icons/copilot.svg',
            group: ['transform'],
            version: 1,
            subtitle: '={{$parameter["operation"] + ": " + $parameter["model"]}}',
            description: 'Use official GitHub Copilot Chat API with your subscription - access GPT-5, Claude, Gemini and more',
            defaults: {
                name: 'GitHub Copilot Chat API',
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
                async getVisionFallbackModels() {
                    return await DynamicModelLoader_1.loadAvailableVisionModels.call(this);
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
                const operation = this.getNodeParameter('operation', i);
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
                        console.log(`✅ Using model from list: ${model}`);
                    }
                }
                if (operation === 'chat') {
                    const userMessage = this.getNodeParameter('message', i);
                    const systemMessage = this.getNodeParameter('systemMessage', i, '');
                    const advancedOptions = this.getNodeParameter('advancedOptions', i, {});
                    const enableRetry = advancedOptions.enableRetry !== false;
                    const maxRetries = advancedOptions.maxRetries || 3;
                    const includeMedia = this.getNodeParameter('includeMedia', i, false);
                    const credentials = await this.getCredentials('githubCopilotApi');
                    const oauthToken = credentials.oauthToken;
                    let supportsVision = DynamicModelsManager_1.DynamicModelsManager.modelSupportsVision(oauthToken, model);
                    if (supportsVision === null) {
                        const modelInfo = GitHubCopilotModels_1.GitHubCopilotModelsManager.getModelByValue(model);
                        supportsVision = !!(((_a = modelInfo === null || modelInfo === void 0 ? void 0 : modelInfo.capabilities) === null || _a === void 0 ? void 0 : _a.vision) || ((_b = modelInfo === null || modelInfo === void 0 ? void 0 : modelInfo.capabilities) === null || _b === void 0 ? void 0 : _b.multimodal));
                        console.log(`👁️ Vision check for model ${model}: using static list, supportsVision=${supportsVision}`);
                    }
                    else {
                        console.log(`👁️ Vision check for model ${model}: using API cache, supportsVision=${supportsVision}`);
                    }
                    let effectiveModel = model;
                    if (includeMedia && !supportsVision) {
                        const enableVisionFallback = advancedOptions.enableVisionFallback || false;
                        if (enableVisionFallback) {
                            const fallbackModelRaw = advancedOptions.visionFallbackModel;
                            const fallbackModel = fallbackModelRaw === '__manual__'
                                ? advancedOptions.visionFallbackCustomModel
                                : fallbackModelRaw;
                            if (!fallbackModel || fallbackModel.trim() === '') {
                                throw new Error('Vision fallback enabled but no fallback model was selected or provided. Please select a vision-capable model in Advanced Options.');
                            }
                            effectiveModel = fallbackModel;
                            console.log(`👁️ Model ${model} does not support vision - using fallback model: ${effectiveModel}`);
                        }
                        else {
                            throw new Error(`Model ${model} does not support vision/image processing. Enable "Vision Fallback" in Advanced Options and select a vision-capable model, or choose a model with vision capabilities.`);
                        }
                    }
                    const messages = [];
                    if (systemMessage) {
                        messages.push({
                            role: 'system',
                            content: systemMessage,
                        });
                    }
                    if (includeMedia) {
                        const mediaSource = this.getNodeParameter('mediaSource', i);
                        const mediaFile = this.getNodeParameter('mediaFile', i, '');
                        const mediaUrl = this.getNodeParameter('mediaUrl', i, '');
                        const mediaBinaryProperty = this.getNodeParameter('mediaBinaryProperty', i, '');
                        if (userMessage.trim()) {
                            messages.push({
                                role: 'user',
                                content: userMessage,
                            });
                        }
                        try {
                            const mediaResult = await (0, mediaDetection_1.processMediaFile)(this, i, mediaSource, mediaFile, mediaUrl, mediaBinaryProperty);
                            if (mediaResult.type === 'image' && mediaResult.dataUrl) {
                                messages.push({
                                    role: 'user',
                                    content: mediaResult.dataUrl,
                                    type: 'file',
                                });
                            }
                            else {
                                messages.push({
                                    role: 'user',
                                    content: `[Image processing failed: ${mediaResult.description}]`,
                                });
                            }
                        }
                        catch (error) {
                            messages.push({
                                role: 'user',
                                content: `[Media processing error: ${error instanceof Error ? error.message : 'Unknown error'}]`,
                            });
                        }
                    }
                    else {
                        messages.push({
                            role: 'user',
                            content: userMessage,
                        });
                    }
                    const requestBody = {
                        model: effectiveModel,
                        messages,
                        stream: false,
                        ...advancedOptions,
                    };
                    delete requestBody.enableVisionFallback;
                    delete requestBody.visionFallbackModel;
                    delete requestBody.visionFallbackCustomModel;
                    const hasMedia = includeMedia;
                    let response = null;
                    let attempt = 1;
                    const totalAttempts = maxRetries + 1;
                    let retriesUsed = 0;
                    while (attempt <= totalAttempts) {
                        try {
                            response = await (0, utils_1.makeApiRequest)(this, GitHubCopilotEndpoints_1.GITHUB_COPILOT_API.ENDPOINTS.CHAT_COMPLETIONS, requestBody, hasMedia);
                            retriesUsed = attempt - 1;
                            break;
                        }
                        catch (error) {
                            const isLastAttempt = attempt >= totalAttempts;
                            const errorObj = error;
                            const is403Error = errorObj.status === 403 || ((_c = errorObj.message) === null || _c === void 0 ? void 0 : _c.includes('403'));
                            if (is403Error && enableRetry && !isLastAttempt) {
                                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
                                console.log(`GitHub Copilot API attempt ${attempt}/${totalAttempts} failed with 403, retrying in ${delay}ms...`);
                                await new Promise((resolve) => setTimeout(resolve, delay));
                                attempt++;
                                continue;
                            }
                            retriesUsed = attempt - 1;
                            throw error;
                        }
                    }
                    if (!response) {
                        throw new Error(`Failed to get response from GitHub Copilot API after ${totalAttempts} attempts (${retriesUsed} retries)`);
                    }
                    const result = {
                        message: ((_e = (_d = response.choices[0]) === null || _d === void 0 ? void 0 : _d.message) === null || _e === void 0 ? void 0 : _e.content) || '',
                        model: effectiveModel,
                        originalModel: effectiveModel !== model ? model : undefined,
                        usedVisionFallback: effectiveModel !== model,
                        operation,
                        usage: response.usage || null,
                        finish_reason: ((_f = response.choices[0]) === null || _f === void 0 ? void 0 : _f.finish_reason) || 'unknown',
                        retries: retriesUsed,
                    };
                    returnData.push({
                        json: result,
                        pairedItem: { item: i },
                    });
                }
            }
            catch (error) {
                if (this.continueOnFail()) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    returnData.push({
                        json: {
                            error: errorMessage,
                            operation: this.getNodeParameter('operation', i),
                            model: this.getNodeParameter('model', i),
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
exports.GitHubCopilotChatAPI = GitHubCopilotChatAPI;
