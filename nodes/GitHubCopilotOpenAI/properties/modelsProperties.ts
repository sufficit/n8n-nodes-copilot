import { INodeProperties } from 'n8n-workflow';

export const MODELS_PROPERTIES: INodeProperties[] = [
	{
		displayName: 'Filter',
		name: 'modelsFilter',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'All Models',
				value: 'all',
				description: 'Return all models, including disabled ones',
			},
			{
				name: 'Enabled Models',
				value: 'enabled',
				description: 'Only models with model_picker_enabled = true (default Copilot UI set)',
			},
			{
				name: 'Chat Models Only',
				value: 'chat',
				description: 'Enabled chat models (excludes embeddings)',
			},
			{
				name: 'Embedding Models Only',
				value: 'embeddings',
				description: 'Only embedding models (text-embedding-*)',
			},
		],
		default: 'enabled',
		description: 'Which subset of models to return',
	},
];
