"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHubCopilotPGVector = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const OAuthTokenManager_1 = require("../../shared/utils/OAuthTokenManager");
const GitHubCopilotEndpoints_1 = require("../../shared/utils/GitHubCopilotEndpoints");
const DynamicModelLoader_1 = require("../../shared/models/DynamicModelLoader");
const EmbeddingsApiUtils_1 = require("../../shared/utils/EmbeddingsApiUtils");
class GitHubCopilotPGVector {
    constructor() {
        this.description = {
            displayName: 'GitHub Copilot PGVector',
            name: 'gitHubCopilotPGVector',
            icon: 'file:../../shared/icons/copilot.svg',
            group: ['transform'],
            version: 1,
            subtitle: '={{$parameter["operation"]}}',
            description: 'GitHub Copilot Embeddings for Postgres PGVector Store',
            defaults: {
                name: 'GitHub Copilot PGVector',
            },
            inputs: ['main'],
            outputs: ['main'],
            credentials: [
                {
                    name: 'githubCopilotApi',
                    required: true,
                },
                {
                    name: 'postgres',
                    required: true,
                },
            ],
            properties: [
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    options: [
                        {
                            name: 'Insert Documents',
                            value: 'insert',
                            description: 'Insert documents with embeddings into PGVector',
                            action: 'Insert documents into PGVector',
                        },
                        {
                            name: 'Search Similar',
                            value: 'search',
                            description: 'Search for similar documents using vector similarity',
                            action: 'Search similar documents',
                        },
                        {
                            name: 'Create Table',
                            value: 'createTable',
                            description: 'Create PGVector table with embeddings column',
                            action: 'Create PGVector table',
                        },
                    ],
                    default: 'insert',
                },
                {
                    displayName: 'Embedding Model',
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
                    ],
                    default: 'text-embedding-3-small',
                    description: 'Embedding model to use',
                },
                {
                    displayName: 'Table Name',
                    name: 'tableName',
                    type: 'string',
                    default: 'documents',
                    required: true,
                    placeholder: 'documents',
                    description: 'Name of the PGVector table',
                    displayOptions: {
                        show: {
                            operation: ['insert', 'search', 'createTable'],
                        },
                    },
                },
                {
                    displayName: 'Text Field',
                    name: 'textField',
                    type: 'string',
                    default: 'text',
                    required: true,
                    placeholder: 'text',
                    description: 'Field name containing the text to embed',
                    displayOptions: {
                        show: {
                            operation: ['insert'],
                        },
                    },
                },
                {
                    displayName: 'Metadata Fields',
                    name: 'metadataFields',
                    type: 'string',
                    default: '',
                    placeholder: 'title,author,date',
                    description: 'Comma-separated list of metadata fields to store (optional)',
                    displayOptions: {
                        show: {
                            operation: ['insert'],
                        },
                    },
                },
                {
                    displayName: 'Query Text',
                    name: 'queryText',
                    type: 'string',
                    default: '',
                    required: true,
                    placeholder: 'Search query text',
                    description: 'Text to search for similar documents',
                    displayOptions: {
                        show: {
                            operation: ['search'],
                        },
                    },
                },
                {
                    displayName: 'Limit',
                    name: 'limit',
                    type: 'number',
                    default: 10,
                    description: 'Maximum number of results to return',
                    displayOptions: {
                        show: {
                            operation: ['search'],
                        },
                    },
                },
                {
                    displayName: 'Distance Threshold',
                    name: 'distanceThreshold',
                    type: 'number',
                    default: 1.0,
                    description: 'Maximum cosine distance for results (0-2, lower is more similar)',
                    displayOptions: {
                        show: {
                            operation: ['search'],
                        },
                    },
                    typeOptions: {
                        minValue: 0,
                        maxValue: 2,
                        numberPrecision: 2,
                    },
                },
                {
                    displayName: 'Vector Dimensions',
                    name: 'vectorDimensions',
                    type: 'number',
                    default: 1536,
                    description: 'Number of dimensions for the embedding vector',
                    displayOptions: {
                        show: {
                            operation: ['createTable'],
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
                            description: 'The number of dimensions for the embedding (text-embedding-3-small supports 512-1536)',
                            typeOptions: {
                                minValue: 1,
                                maxValue: 1536,
                            },
                        },
                        {
                            displayName: 'Embedding Column Name',
                            name: 'embeddingColumn',
                            type: 'string',
                            default: 'embedding',
                            description: 'Name of the column storing embeddings',
                        },
                        {
                            displayName: 'ID Column Name',
                            name: 'idColumn',
                            type: 'string',
                            default: 'id',
                            description: 'Name of the ID column',
                        },
                        {
                            displayName: 'Text Column Name',
                            name: 'textColumn',
                            type: 'string',
                            default: 'content',
                            description: 'Name of the column storing text content',
                        },
                        {
                            displayName: 'Batch Size',
                            name: 'batchSize',
                            type: 'number',
                            default: 10,
                            description: 'Number of documents to process in each batch',
                            typeOptions: {
                                minValue: 1,
                                maxValue: 100,
                            },
                        },
                        {
                            displayName: 'Enable Retry',
                            name: 'enableRetry',
                            type: 'boolean',
                            default: true,
                            description: 'Whether to retry on TPM quota errors (403)',
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
        const operation = this.getNodeParameter('operation', 0);
        const postgresCredentials = await this.getCredentials('postgres', 0);
        const githubCredentials = await this.getCredentials('githubCopilotApi', 0);
        const githubToken = githubCredentials.token;
        if (!GitHubCopilotEndpoints_1.GitHubCopilotEndpoints.validateToken(githubToken)) {
            throw new n8n_workflow_1.NodeOperationError(this.getNode(), "Invalid GitHub token format. Token must start with 'gho_' or 'github_pat_'");
        }
        const oauthToken = await OAuthTokenManager_1.OAuthTokenManager.getValidOAuthToken(githubToken);
        const tableName = this.getNodeParameter('tableName', 0);
        const model = this.getNodeParameter('model', 0);
        const options = this.getNodeParameter('options', 0, {});
        const { Client } = require('pg');
        const pgClient = new Client({
            host: postgresCredentials.host,
            port: postgresCredentials.port,
            user: postgresCredentials.user,
            password: postgresCredentials.password,
            database: postgresCredentials.database,
        });
        try {
            await pgClient.connect();
            switch (operation) {
                case 'createTable': {
                    const vectorDimensions = this.getNodeParameter('vectorDimensions', 0);
                    const embeddingColumn = options.embeddingColumn || 'embedding';
                    const idColumn = options.idColumn || 'id';
                    const textColumn = options.textColumn || 'content';
                    await pgClient.query('CREATE EXTENSION IF NOT EXISTS vector');
                    const createTableQuery = `
						CREATE TABLE IF NOT EXISTS ${tableName} (
							${idColumn} SERIAL PRIMARY KEY,
							${textColumn} TEXT NOT NULL,
							metadata JSONB,
							${embeddingColumn} vector(${vectorDimensions}),
							created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
						);
						
						CREATE INDEX IF NOT EXISTS ${tableName}_${embeddingColumn}_idx 
						ON ${tableName} USING ivfflat (${embeddingColumn} vector_cosine_ops)
						WITH (lists = 100);
					`;
                    await pgClient.query(createTableQuery);
                    returnData.push({
                        json: {
                            success: true,
                            message: `Table ${tableName} created with ${vectorDimensions} dimensions`,
                            table: tableName,
                            dimensions: vectorDimensions,
                        },
                    });
                    break;
                }
                case 'insert': {
                    const textField = this.getNodeParameter('textField', 0);
                    const metadataFieldsStr = this.getNodeParameter('metadataFields', 0, '');
                    const metadataFields = metadataFieldsStr
                        ? metadataFieldsStr.split(',').map((f) => f.trim())
                        : [];
                    const batchSize = options.batchSize || 10;
                    const embeddingColumn = options.embeddingColumn || 'embedding';
                    const textColumn = options.textColumn || 'content';
                    const dimensions = options.dimensions;
                    for (let i = 0; i < items.length; i += batchSize) {
                        const batch = items.slice(i, Math.min(i + batchSize, items.length));
                        const texts = batch.map((item) => String(item.json[textField]));
                        const requestBody = {
                            model,
                            input: texts,
                        };
                        if (dimensions) {
                            requestBody.dimensions = dimensions;
                        }
                        const embeddingResponse = await (0, EmbeddingsApiUtils_1.executeEmbeddingsRequest)(oauthToken, requestBody, options.enableRetry !== false, 3);
                        for (let j = 0; j < batch.length; j++) {
                            const item = batch[j];
                            const embedding = embeddingResponse.data[j].embedding;
                            const text = texts[j];
                            const metadata = {};
                            metadataFields.forEach((field) => {
                                if (item.json[field] !== undefined) {
                                    metadata[field] = item.json[field];
                                }
                            });
                            const insertQuery = `
								INSERT INTO ${tableName} (${textColumn}, metadata, ${embeddingColumn})
								VALUES ($1, $2, $3)
								RETURNING *
							`;
                            const result = await pgClient.query(insertQuery, [
                                text,
                                JSON.stringify(metadata),
                                `[${embedding.join(',')}]`,
                            ]);
                            returnData.push({
                                json: {
                                    success: true,
                                    id: result.rows[0].id,
                                    text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
                                    dimensions: embedding.length,
                                },
                                pairedItem: { item: i + j },
                            });
                        }
                    }
                    break;
                }
                case 'search': {
                    const queryText = this.getNodeParameter('queryText', 0);
                    const limit = this.getNodeParameter('limit', 0);
                    const distanceThreshold = this.getNodeParameter('distanceThreshold', 0);
                    const embeddingColumn = options.embeddingColumn || 'embedding';
                    const textColumn = options.textColumn || 'content';
                    const dimensions = options.dimensions;
                    const requestBody = {
                        model,
                        input: [queryText],
                    };
                    if (dimensions) {
                        requestBody.dimensions = dimensions;
                    }
                    const embeddingResponse = await (0, EmbeddingsApiUtils_1.executeEmbeddingsRequest)(oauthToken, requestBody, options.enableRetry !== false, 3);
                    const queryEmbedding = embeddingResponse.data[0].embedding;
                    const searchQuery = `
						SELECT 
							*,
							(${embeddingColumn} <=> $1::vector) as distance
						FROM ${tableName}
						WHERE (${embeddingColumn} <=> $1::vector) < $2
						ORDER BY ${embeddingColumn} <=> $1::vector
						LIMIT $3
					`;
                    const searchResult = await pgClient.query(searchQuery, [
                        `[${queryEmbedding.join(',')}]`,
                        distanceThreshold,
                        limit,
                    ]);
                    searchResult.rows.forEach((row) => {
                        returnData.push({
                            json: {
                                id: row.id,
                                text: row[textColumn],
                                metadata: row.metadata,
                                distance: row.distance,
                                similarity: 1 - row.distance / 2,
                            },
                        });
                    });
                    break;
                }
            }
        }
        catch (error) {
            if (this.continueOnFail()) {
                returnData.push({
                    json: {
                        error: error instanceof Error ? error.message : 'Unknown error occurred',
                    },
                });
            }
            else {
                throw error;
            }
        }
        finally {
            await pgClient.end();
        }
        return [returnData];
    }
}
exports.GitHubCopilotPGVector = GitHubCopilotPGVector;
