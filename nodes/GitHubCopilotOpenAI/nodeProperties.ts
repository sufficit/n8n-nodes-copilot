import { INodeProperties } from 'n8n-workflow';
import { DEFAULT_MODELS } from '../../shared/models/GitHubCopilotModels';
import { CHAT_MODEL_PROPERTIES } from '../../shared/properties/ModelProperties';

export const nodeProperties: INodeProperties[] = [
	// Model properties (shared across nodes)
	...CHAT_MODEL_PROPERTIES,
	{
		displayName: 'Messages Input Mode',
		name: 'messagesInputMode',
		type: 'options',
		options: [
			{
				name: 'Manual (UI)',
				value: 'manual',
				description: 'Enter messages one by one using the UI',
			},
			{
				name: 'JSON (Programmatic)',
				value: 'json',
				description: 'Provide messages as JSON array',
			},
		],
		default: 'manual',
		description: 'How to provide the messages for the conversation',
	},
	{
		displayName: 'Messages (JSON)',
		name: 'messagesJson',
		type: 'json',
		default: `[
  {
    "role": "system",
    "content": "You are a helpful assistant."
  },
  {
    "role": "user",
    "content": "Hello!"
  }
]`,
		placeholder: 'Enter messages as JSON array',
		description: 'Array of messages in OpenAI format: [{"role": "user", "content": "..."}]',
		displayOptions: {
			show: {
				messagesInputMode: ['json'],
			},
		},
	},
	{
		displayName: 'Messages',
		name: 'messages',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
			sortable: true,
		},
		default: {
			message: [
				{
					role: 'user',
					content: '',
				},
			],
		},
		displayOptions: {
			show: {
				messagesInputMode: ['manual'],
			},
		},
		options: [
			{
				name: 'message',
				displayName: 'Message',
				values: [
					{
						displayName: 'Role',
						name: 'role',
						type: 'options',
						options: [
							{
								name: 'System',
								value: 'system',
								description: 'System message to set the behavior of the AI',
							},
							{
								name: 'User',
								value: 'user',
								description: 'Message from the user',
							},
							{
								name: 'Assistant',
								value: 'assistant',
								description: 'Previous response from the AI assistant',
							},
						],
						default: 'user',
					},
					{
						displayName: 'Content',
						name: 'content',
						type: 'string',
						typeOptions: {
							rows: 3,
						},
						default: '',
						placeholder: 'Enter message content...',
						description: 'The content of the message',
					},
					{
						displayName: 'Type',
						name: 'type',
						type: 'options',
						options: [
							{
								name: 'Text',
								value: 'text',
								description: 'Regular text message',
							},
							{
								name: 'File',
								value: 'file',
								description: 'File attachment (use content as data URL or base64)',
							},
						],
						default: 'text',
						description: 'The type of message content (optional)',
					},
				],
			},
		],
		description: 'Array of messages for the conversation',
	},
	// Advanced Options
	{
		displayName: 'Advanced Options',
		name: 'advancedOptions',
		type: 'collection',
		placeholder: 'Add Advanced Option',
		default: {},
		options: [
			{
				displayName: 'Response Format',
				name: 'response_format',
				type: 'options',
				options: [
					{
						name: 'Text',
						value: 'text',
						description: 'Return response as plain text',
					},
					{
						name: 'JSON Object',
						value: 'json_object',
						description: 'Return response as JSON object',
					},
				],
				default: 'text',
				description: 'The format of the response',
			},
			{
				displayName: 'Temperature',
				name: 'temperature',
				type: 'number',
				typeOptions: {
					minValue: 0,
					maxValue: 2,
					numberPrecision: 2,
				},
				default: 1,
				description:
					'Controls randomness in the response. Lower values make responses more focused and deterministic.',
			},
			{
				displayName: 'Max Tokens',
				name: 'max_tokens',
				type: 'number',
				typeOptions: {
					minValue: 1,
					maxValue: 16384,
				},
				default: 4096,
				placeholder: '4096',
				description: 'Maximum number of tokens to generate in the response',
				hint: 'Default: 4096 tokens. Increase for longer responses, decrease for shorter ones.',
			},
			{
				displayName: 'Top P',
				name: 'top_p',
				type: 'number',
				typeOptions: {
					minValue: 0,
					maxValue: 1,
					numberPrecision: 2,
				},
				default: 1,
				description: 'Controls diversity via nucleus sampling',
			},
			{
				displayName: 'Frequency Penalty',
				name: 'frequency_penalty',
				type: 'number',
				typeOptions: {
					minValue: -2,
					maxValue: 2,
					numberPrecision: 2,
				},
				default: 0,
				description: 'Penalty for repeated tokens based on their frequency',
			},
			{
				displayName: 'Presence Penalty',
				name: 'presence_penalty',
				type: 'number',
				typeOptions: {
					minValue: -2,
					maxValue: 2,
					numberPrecision: 2,
				},
				default: 0,
				description: 'Penalty for repeated tokens based on their presence',
			},
			{
				displayName: 'Stop Sequences',
				name: 'stop',
				type: 'string',
				default: '',
				placeholder: '["\\n", "Human:", "AI:"]',
				description: 'JSON array of strings where the API will stop generating tokens',
			},
			{
				displayName: 'Stream',
				name: 'stream',
				type: 'boolean',
				default: false,
				description: 'Whether to stream the response',
			},
			{
				displayName: 'Seed',
				name: 'seed',
				type: 'number',
				default: 0,
				placeholder: '12345',
				description: 'Seed for deterministic sampling (0 = disabled)',
			},
			{
				displayName: 'User ID',
				name: 'user',
				type: 'string',
				default: '',
				placeholder: 'user-123',
				description: 'Unique identifier for the end-user',
			},
			{
				displayName: 'Tools (Function Calling)',
				name: 'tools',
				type: 'string',
				default: '',
				typeOptions: {
					rows: 10,
				},
				placeholder: `[
  {
    "type": "function",
    "function": {
      "name": "get_weather",
      "description": "Get current weather",
      "parameters": {
        "type": "object",
        "properties": {
          "location": {
            "type": "string",
            "description": "City name"
          }
        },
        "required": ["location"]
      }
    }
  }
]`,
				description:
					'Optional: Array of tools/functions available to the model (OpenAI format). Leave empty if not using function calling.',
				hint: "JSON array of tool definitions in OpenAI format. Leave this field empty if you don't need function calling.",
			},
			{
				displayName: 'Tool Choice',
				name: 'tool_choice',
				type: 'options',
				options: [
					{
						name: 'Auto',
						value: 'auto',
						description: 'Let the model decide whether to call functions',
					},
					{
						name: 'None',
						value: 'none',
						description: 'Force the model to not call any functions',
					},
					{
						name: 'Required',
						value: 'required',
						description: 'Force the model to call at least one function',
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
				displayName: 'Enable Retry',
				name: 'enableRetry',
				type: 'boolean',
				default: true,
				description: 'Whether to retry failed requests',
			},
			{
				displayName: 'Max Retries',
				name: 'maxRetries',
				type: 'number',
				default: 3,
				description: 'Maximum number of retries for failed requests',
				displayOptions: {
					show: {
						enableRetry: [true],
					},
				},
			},
			{
				displayName: 'Retry Delay (ms)',
				name: 'retryDelay',
				type: 'number',
				default: 1000,
				description: 'Delay between retries in milliseconds',
				displayOptions: {
					show: {
						enableRetry: [true],
					},
				},
			},
			{
				displayName: 'Request Timeout (ms)',
				name: 'timeout',
				type: 'number',
				default: 60000,
				description: 'Request timeout in milliseconds',
			},
			{
				displayName: 'Debug Mode',
				name: 'debugMode',
				type: 'boolean',
				default: false,
				description: 'Enable debug logging',
			},
		],
	},
];
