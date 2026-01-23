import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
	NodeOperationError,
	ILoadOptionsFunctions,
	INodePropertyOptions,
} from 'n8n-workflow';

import { OAuthTokenManager } from '../../shared/utils/OAuthTokenManager';
import { GitHubCopilotEndpoints } from '../../shared/utils/GitHubCopilotEndpoints';
import { loadAvailableEmbeddingModels } from '../../shared/models/DynamicModelLoader';
import {
	executeEmbeddingsRequest,
	EmbeddingResponse,
	EmbeddingRequest,
} from '../../shared/utils/EmbeddingsApiUtils';

/**
 * GitHub Copilot PGVector Node
 *
 * Compatible with n8n Postgres PGVector Store.
 * Uses GitHub Copilot embeddings models for vector generation.
 */
export class GitHubCopilotPGVector implements INodeType {
	description: INodeTypeDescription = {
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
			// Model selection
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
			// Insert operation fields
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
			// Search operation fields
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
			// Create table operation
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
			// Options
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
						description:
							'The number of dimensions for the embedding (text-embedding-3-small supports 512-1536)',
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

	methods = {
		loadOptions: {
			async getAvailableEmbeddingModels(
				this: ILoadOptionsFunctions,
			): Promise<INodePropertyOptions[]> {
				return await loadAvailableEmbeddingModels.call(this);
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0) as string;

		// Get credentials
		const postgresCredentials = await this.getCredentials('postgres', 0);
		const githubCredentials = await this.getCredentials('githubCopilotApi', 0);
		const githubToken = githubCredentials.token as string;

		if (!GitHubCopilotEndpoints.validateToken(githubToken)) {
			throw new NodeOperationError(
				this.getNode(),
				"Invalid GitHub token format. Token must start with 'gho_' or 'github_pat_'",
			);
		}

		// Generate OAuth token
		const oauthToken = await OAuthTokenManager.getValidOAuthToken(githubToken);

		// Get common parameters
		const tableName = this.getNodeParameter('tableName', 0) as string;
		const model = this.getNodeParameter('model', 0) as string;
		const options = this.getNodeParameter('options', 0, {}) as IDataObject;

		// Get PostgreSQL client
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
					const vectorDimensions = this.getNodeParameter('vectorDimensions', 0) as number;
					const embeddingColumn = (options.embeddingColumn as string) || 'embedding';
					const idColumn = (options.idColumn as string) || 'id';
					const textColumn = (options.textColumn as string) || 'content';

					// Create table with PGVector extension
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
					const textField = this.getNodeParameter('textField', 0) as string;
					const metadataFieldsStr = this.getNodeParameter('metadataFields', 0, '') as string;
					const metadataFields = metadataFieldsStr
						? metadataFieldsStr.split(',').map((f) => f.trim())
						: [];
					const batchSize = (options.batchSize as number) || 10;
					const embeddingColumn = (options.embeddingColumn as string) || 'embedding';
					const textColumn = (options.textColumn as string) || 'content';
					const dimensions = options.dimensions as number | undefined;

					// Process items in batches
					for (let i = 0; i < items.length; i += batchSize) {
						const batch = items.slice(i, Math.min(i + batchSize, items.length));
						const texts = batch.map((item) => String(item.json[textField]));

						// Generate embeddings
						const requestBody: EmbeddingRequest = {
							model,
							input: texts,
						};

						if (dimensions) {
							requestBody.dimensions = dimensions;
						}

						const embeddingResponse = await executeEmbeddingsRequest(
							oauthToken,
							requestBody,
							(options.enableRetry as boolean) !== false,
							3,
						);

						// Insert into database
						for (let j = 0; j < batch.length; j++) {
							const item = batch[j];
							const embedding = embeddingResponse.data[j].embedding;
							const text = texts[j];

							// Build metadata object
							const metadata: IDataObject = {};
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
					const queryText = this.getNodeParameter('queryText', 0) as string;
					const limit = this.getNodeParameter('limit', 0) as number;
					const distanceThreshold = this.getNodeParameter('distanceThreshold', 0) as number;
					const embeddingColumn = (options.embeddingColumn as string) || 'embedding';
					const textColumn = (options.textColumn as string) || 'content';
					const dimensions = options.dimensions as number | undefined;

					// Generate query embedding
					const requestBody: EmbeddingRequest = {
						model,
						input: [queryText],
					};

					if (dimensions) {
						requestBody.dimensions = dimensions;
					}

					const embeddingResponse = await executeEmbeddingsRequest(
						oauthToken,
						requestBody,
						(options.enableRetry as boolean) !== false,
						3,
					);

					const queryEmbedding = embeddingResponse.data[0].embedding;

					// Search for similar documents
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

					searchResult.rows.forEach((row: any) => {
						returnData.push({
							json: {
								id: row.id,
								text: row[textColumn],
								metadata: row.metadata,
								distance: row.distance,
								similarity: 1 - row.distance / 2, // Convert distance to similarity (0-1)
							},
						});
					});
					break;
				}
			}
		} catch (error) {
			if (this.continueOnFail()) {
				returnData.push({
					json: {
						error: error instanceof Error ? error.message : 'Unknown error occurred',
					},
				});
			} else {
				throw error;
			}
		} finally {
			await pgClient.end();
		}

		return [returnData];
	}
}
