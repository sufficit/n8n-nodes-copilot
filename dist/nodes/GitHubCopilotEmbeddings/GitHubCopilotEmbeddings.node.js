"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHubCopilotEmbeddings = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const OAuthTokenManager_1 = require("../../shared/utils/OAuthTokenManager");
const GitHubCopilotEndpoints_1 = require("../../shared/utils/GitHubCopilotEndpoints");
const DynamicModelLoader_1 = require("../../shared/models/DynamicModelLoader");
const EmbeddingsApiUtils_1 = require("../../shared/utils/EmbeddingsApiUtils");
class GitHubCopilotEmbeddings {
    constructor() {
        this.description = {
            displayName: 'GitHub Copilot Embeddings',
            name: 'gitHubCopilotEmbeddings',
            icon: 'file:../../shared/icons/copilot.svg',
            group: ['transform'],
            version: 1,
            subtitle: '={{$parameter["model"]}}',
            description: 'Generate text embeddings using GitHub Copilot API',
            defaults: {
                name: 'GitHub Copilot Embeddings',
            },
            inputs: ['main'],
            outputs: ['main'],
            credentials: [
                {
                    name: 'githubCopilotApi',
                    required: true,
                },
            ],
            properties: [
                {
                    displayName: 'Model',
                    name: 'model',
                    type: 'options',
                    typeOptions: {
                        loadOptionsMethod: 'getAvailableEmbeddingModels',
                    },
                    options: [
                        {
                            name: 'Text Embedding 3 Small',
                            value: 'text-embedding-3-small',
                            description: "OpenAI's text-embedding-3-small model (recommended)",
                        },
                        {
                            name: 'Text Embedding Ada 002',
                            value: 'text-embedding-ada-002',
                            description: 'Legacy embedding model',
                        },
                        {
                            name: 'Text Embedding 3 Small (Inference)',
                            value: 'text-embedding-3-small-inference',
                            description: 'Optimized inference variant',
                        },
                    ],
                    default: 'text-embedding-3-small',
                    description: 'The embedding model to use. Models are auto-discovered from your GitHub Copilot subscription.',
                },
                {
                    displayName: 'Custom Model Name',
                    name: 'customModel',
                    type: 'string',
                    default: '',
                    required: true,
                    placeholder: 'e.g., text-embedding-3-large',
                    description: 'Enter the exact model name to use',
                    displayOptions: {
                        show: {
                            model: ['__manual__'],
                        },
                    },
                },
                {
                    displayName: 'Input Mode',
                    name: 'inputMode',
                    type: 'options',
                    options: [
                        {
                            name: 'Single Text',
                            value: 'single',
                            description: 'Embed a single text string',
                        },
                        {
                            name: 'Batch (Array)',
                            value: 'batch',
                            description: 'Embed multiple texts in a single request (more efficient)',
                        },
                        {
                            name: 'From Field',
                            value: 'field',
                            description: 'Embed text from a specific field in each input item',
                        },
                    ],
                    default: 'single',
                    description: 'How to provide the text input',
                },
                {
                    displayName: 'Text',
                    name: 'text',
                    type: 'string',
                    typeOptions: {
                        rows: 4,
                    },
                    default: '',
                    required: true,
                    placeholder: 'Enter text to embed',
                    description: 'The text to generate embeddings for',
                    displayOptions: {
                        show: {
                            inputMode: ['single'],
                        },
                    },
                },
                {
                    displayName: 'Texts',
                    name: 'texts',
                    type: 'string',
                    typeOptions: {
                        rows: 8,
                    },
                    default: '',
                    required: true,
                    placeholder: '["Text 1", "Text 2", "Text 3"]',
                    description: 'JSON array of texts to embed in a single request (more efficient than multiple calls)',
                    displayOptions: {
                        show: {
                            inputMode: ['batch'],
                        },
                    },
                },
                {
                    displayName: 'Field Name',
                    name: 'fieldName',
                    type: 'string',
                    default: 'text',
                    required: true,
                    placeholder: 'text',
                    description: 'Name of the field containing the text to embed',
                    displayOptions: {
                        show: {
                            inputMode: ['field'],
                        },
                    },
                },
                {
                    displayName: 'Options',
                    name: 'options',
                    type: 'collection',
                    placeholder: 'Add Option',
                    default: {},
                    options: [
                        {
                            displayName: 'Dimensions',
                            name: 'dimensions',
                            type: 'number',
                            default: 1536,
                            description: 'The number of dimensions for the embedding. Only supported by text-embedding-3-small.',
                            typeOptions: {
                                minValue: 1,
                                maxValue: 1536,
                            },
                            placeholder: '1536',
                            hint: 'Common values: 512, 768, 1024, 1536',
                        },
                        {
                            displayName: 'Encoding Format',
                            name: 'encoding_format',
                            type: 'options',
                            options: [
                                {
                                    name: 'Float',
                                    value: 'float',
                                    description: 'Standard floating point format (default)',
                                },
                                {
                                    name: 'Base64',
                                    value: 'base64',
                                    description: 'Base64-encoded format (more compact)',
                                },
                            ],
                            default: 'float',
                            description: 'The format to return the embeddings in',
                        },
                        {
                            displayName: 'Enable Retry',
                            name: 'enableRetry',
                            type: 'boolean',
                            default: true,
                            description: 'Whether to retry on TPM quota errors (403)',
                        },
                        {
                            displayName: 'Max Retries',
                            name: 'maxRetries',
                            type: 'number',
                            default: 3,
                            description: 'Maximum number of retry attempts',
                            displayOptions: {
                                show: {
                                    enableRetry: [true],
                                },
                            },
                        },
                    ],
                },
            ],
        };
        this.methods = {
            loadOptions: {
                async getAvailableEmbeddingModels() {
                    return await DynamicModelLoader_1.loadAvailableEmbeddingModels.call(this);
                },
            },
        };
    }
    async execute() {
        const items = this.getInputData();
        const returnData = [];
        for (let i = 0; i < items.length; i++) {
            try {
                const selectedModel = this.getNodeParameter('model', i);
                let model;
                if (selectedModel === '__manual__') {
                    model = this.getNodeParameter('customModel', i);
                    if (!model || model.trim() === '') {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), "Custom model name is required when selecting '✏️ Enter Custom Model Name'");
                    }
                    console.log(`✏️ Using manually entered embedding model: ${model}`);
                }
                else {
                    model = selectedModel;
                    console.log(`✅ Using embedding model from list: ${model}`);
                }
                const inputMode = this.getNodeParameter('inputMode', i);
                const options = this.getNodeParameter('options', i, {});
                const credentials = await this.getCredentials('githubCopilotApi', i);
                const githubToken = credentials.token;
                if (!githubToken) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'GitHub token is required');
                }
                if (!GitHubCopilotEndpoints_1.GitHubCopilotEndpoints.validateToken(githubToken)) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), "Invalid GitHub token format. Token must start with 'gho_' or 'github_pat_'");
                }
                const oauthToken = await OAuthTokenManager_1.OAuthTokenManager.getValidOAuthToken(githubToken);
                const enableRetry = options.enableRetry !== false;
                const maxRetries = options.maxRetries || 3;
                let input;
                switch (inputMode) {
                    case 'single':
                        input = this.getNodeParameter('text', i);
                        if (!input || input.trim() === '') {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Text input cannot be empty');
                        }
                        input = [input];
                        break;
                    case 'batch':
                        const textsStr = this.getNodeParameter('texts', i);
                        try {
                            const parsed = JSON.parse(textsStr);
                            if (!Array.isArray(parsed)) {
                                throw new Error('Input must be a JSON array');
                            }
                            input = parsed;
                        }
                        catch (error) {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Invalid JSON array: ${error instanceof Error ? error.message : 'Unknown error'}`);
                        }
                        break;
                    case 'field':
                        const fieldName = this.getNodeParameter('fieldName', i);
                        const fieldValue = items[i].json[fieldName];
                        if (!fieldValue) {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Field '${fieldName}' not found in input data`);
                        }
                        input = [String(fieldValue)];
                        break;
                    default:
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Unknown input mode: ${inputMode}`);
                }
                const requestBody = {
                    model,
                    input: input,
                };
                if (options.dimensions) {
                    requestBody.dimensions = options.dimensions;
                }
                if (options.encoding_format) {
                    requestBody.encoding_format = options.encoding_format;
                }
                const result = await (0, EmbeddingsApiUtils_1.executeEmbeddingsRequest)(oauthToken, requestBody, enableRetry, maxRetries);
                const openAIResponse = {
                    object: 'list',
                    data: result.data.map((item) => ({
                        object: 'embedding',
                        index: item.index,
                        embedding: item.embedding,
                    })),
                    model: result.model,
                    usage: result.usage,
                };
                returnData.push({
                    json: openAIResponse,
                    pairedItem: { item: i },
                });
            }
            catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({
                        json: {
                            error: error instanceof Error ? error.message : 'Unknown error occurred',
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
exports.GitHubCopilotEmbeddings = GitHubCopilotEmbeddings;
