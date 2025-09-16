import { INodeProperties } from 'n8n-workflow';

export const nodeProperties: INodeProperties[] = [
    // Operation selector
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        options: [
            {
                name: 'Chat',
                value: 'chat',
                description: 'Send a chat message to N8N AI Agent',
                action: 'Send a chat message',
            },
            {
                name: 'Use Tools',
                value: 'tools',
                description: 'Execute specific tools through AI Agent',
                action: 'Execute tools',
            },
            {
                name: 'Memory',
                value: 'memory',
                description: 'Manage AI Agent memory/context',
                action: 'Manage memory',
            },
        ],
        default: 'chat',
    },

    // Model selector (for all operations)
    {
        displayName: 'AI Model',
        name: 'model',
        type: 'options',
        options: [
            {
                name: 'GPT-4 Turbo',
                value: 'gpt-4-turbo',
                description: 'OpenAI GPT-4 Turbo - Latest and most capable',
            },
            {
                name: 'GPT-4',
                value: 'gpt-4',
                description: 'OpenAI GPT-4 - High quality reasoning',
            },
            {
                name: 'GPT-3.5 Turbo',
                value: 'gpt-3.5-turbo',
                description: 'OpenAI GPT-3.5 Turbo - Fast and efficient',
            },
            {
                name: 'Claude 3 Opus',
                value: 'claude-3-opus',
                description: 'Anthropic Claude 3 Opus - Superior reasoning',
            },
            {
                name: 'Claude 3 Sonnet',
                value: 'claude-3-sonnet',
                description: 'Anthropic Claude 3 Sonnet - Balanced performance',
            },
            {
                name: 'Claude 3 Haiku',
                value: 'claude-3-haiku',
                description: 'Anthropic Claude 3 Haiku - Fast responses',
            },
            {
                name: 'Gemini Pro',
                value: 'gemini-pro',
                description: 'Google Gemini Pro - Multimodal capabilities',
            },
        ],
        default: 'gpt-4-turbo',
        description: 'Select the AI model to use',
    },

    // === CHAT OPERATION ===
    {
        displayName: 'Message',
        name: 'message',
        type: 'string',
        typeOptions: {
            rows: 3,
        },
        displayOptions: {
            show: {
                operation: ['chat'],
            },
        },
        default: '',
        placeholder: 'Enter your message here...',
        description: 'The message to send to the AI Agent',
        required: true,
    },

    {
        displayName: 'System Message',
        name: 'systemMessage',
        type: 'string',
        typeOptions: {
            rows: 2,
        },
        displayOptions: {
            show: {
                operation: ['chat'],
            },
        },
        default: '',
        placeholder: 'You are a helpful AI assistant...',
        description: 'System prompt to set the AI behavior and context',
    },

    {
        displayName: 'Include Media',
        name: 'includeMedia',
        type: 'boolean',
        displayOptions: {
            show: {
                operation: ['chat'],
            },
        },
        default: false,
        description: 'Whether to include images in the chat message',
    },

    {
        displayName: 'Media Source',
        name: 'mediaSource',
        type: 'options',
        options: [
            {
                name: 'Upload File',
                value: 'manual',
                description: 'Upload an image file directly',
            },
            {
                name: 'From URL',
                value: 'url',
                description: 'Use an image from URL',
            },
            {
                name: 'From Binary Data',
                value: 'binary',
                description: 'Use image from previous node binary data',
            },
        ],
        displayOptions: {
            show: {
                operation: ['chat'],
                includeMedia: [true],
            },
        },
        default: 'manual',
        description: 'Source of the media file',
    },

    {
        displayName: 'Image File',
        name: 'mediaFile',
        type: 'string',
        displayOptions: {
            show: {
                operation: ['chat'],
                includeMedia: [true],
                mediaSource: ['manual'],
            },
        },
        default: '',
        placeholder: 'Paste base64 image data...',
        description: 'Base64 encoded image data',
    },

    {
        displayName: 'Image URL',
        name: 'mediaUrl',
        type: 'string',
        displayOptions: {
            show: {
                operation: ['chat'],
                includeMedia: [true],
                mediaSource: ['url'],
            },
        },
        default: '',
        placeholder: 'https://example.com/image.jpg',
        description: 'URL of the image to analyze',
    },

    {
        displayName: 'Binary Property',
        name: 'mediaProperty',
        type: 'string',
        displayOptions: {
            show: {
                operation: ['chat'],
                includeMedia: [true],
                mediaSource: ['binary'],
            },
        },
        default: 'data',
        placeholder: 'data',
        description: 'Name of the binary property containing the image',
    },

    {
        displayName: 'Include Conversation History',
        name: 'includeHistory',
        type: 'boolean',
        displayOptions: {
            show: {
                operation: ['chat'],
            },
        },
        default: false,
        description: 'Include previous messages for context',
    },

    {
        displayName: 'Conversation History',
        name: 'conversationHistory',
        type: 'json',
        typeOptions: {
            rows: 4,
        },
        displayOptions: {
            show: {
                operation: ['chat'],
                includeHistory: [true],
            },
        },
        default: '[]',
        placeholder: '[{"role": "user", "content": "Hello"}, {"role": "assistant", "content": "Hi there!"}]',
        description: 'Previous messages in OpenAI chat format',
    },

    {
        displayName: 'Enable Tools',
        name: 'enableTools',
        type: 'boolean',
        displayOptions: {
            show: {
                operation: ['chat'],
            },
        },
        default: false,
        description: 'Allow AI to use tools and function calling',
    },

    {
        displayName: 'Tools Configuration',
        name: 'toolsConfig',
        type: 'json',
        typeOptions: {
            rows: 6,
        },
        displayOptions: {
            show: {
                operation: ['chat'],
                enableTools: [true],
            },
        },
        default: '{"tools": []}',
        placeholder: '{"tools": [{"type": "function", "function": {"name": "get_weather", "description": "Get weather info"}}]}',
        description: 'Tools available to the AI Agent',
    },

    // === TOOLS OPERATION ===
    {
        displayName: 'Tool Name',
        name: 'toolName',
        type: 'string',
        displayOptions: {
            show: {
                operation: ['tools'],
            },
        },
        default: '',
        placeholder: 'get_weather',
        description: 'Name of the tool to execute',
        required: true,
    },

    {
        displayName: 'Tool Arguments',
        name: 'toolArguments',
        type: 'json',
        typeOptions: {
            rows: 3,
        },
        displayOptions: {
            show: {
                operation: ['tools'],
            },
        },
        default: '{}',
        placeholder: '{"location": "São Paulo", "units": "celsius"}',
        description: 'Arguments to pass to the tool',
    },

    {
        displayName: 'Context',
        name: 'context',
        type: 'string',
        typeOptions: {
            rows: 2,
        },
        displayOptions: {
            show: {
                operation: ['tools'],
            },
        },
        default: '',
        placeholder: 'User is asking about weather in their city...',
        description: 'Context for tool execution',
    },

    // === MEMORY OPERATION ===
    {
        displayName: 'Memory Action',
        name: 'memoryAction',
        type: 'options',
        options: [
            {
                name: 'Store',
                value: 'store',
                description: 'Store data in AI Agent memory',
            },
            {
                name: 'Retrieve',
                value: 'retrieve',
                description: 'Retrieve data from AI Agent memory',
            },
            {
                name: 'Clear',
                value: 'clear',
                description: 'Clear AI Agent memory',
            },
        ],
        displayOptions: {
            show: {
                operation: ['memory'],
            },
        },
        default: 'retrieve',
        description: 'Action to perform on AI Agent memory',
    },

    {
        displayName: 'Session ID',
        name: 'sessionId',
        type: 'string',
        displayOptions: {
            show: {
                operation: ['memory'],
            },
        },
        default: '',
        placeholder: 'user-123',
        description: 'Unique session identifier for memory isolation',
    },

    {
        displayName: 'Memory Data',
        name: 'memoryData',
        type: 'json',
        typeOptions: {
            rows: 3,
        },
        displayOptions: {
            show: {
                operation: ['memory'],
                memoryAction: ['store'],
            },
        },
        default: '{}',
        placeholder: '{"user_preferences": {"language": "pt-BR", "timezone": "America/Sao_Paulo"}}',
        description: 'Data to store in memory',
    },

    // === ADVANCED OPTIONS ===
    {
        displayName: 'Advanced Options',
        name: 'advancedOptions',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        displayOptions: {
            show: {
                operation: ['chat'],
            },
        },
        options: [
            {
                displayName: 'Max Tokens',
                name: 'maxTokens',
                type: 'number',
                default: 1000,
                description: 'Maximum number of tokens to generate (0 for model default)',
                typeOptions: {
                    minValue: 0,
                    maxValue: 4000,
                },
            },
            {
                displayName: 'Temperature',
                name: 'temperature',
                type: 'number',
                default: 0.7,
                description: 'Controls randomness (0.0 = deterministic, 1.0 = very random)',
                typeOptions: {
                    minValue: 0,
                    maxValue: 1,
                    numberPrecision: 2,
                },
            },
            {
                displayName: 'Top P',
                name: 'topP',
                type: 'number',
                default: 1,
                description: 'Controls diversity via nucleus sampling',
                typeOptions: {
                    minValue: 0.01,
                    maxValue: 1,
                    numberPrecision: 2,
                },
            },
            {
                displayName: 'Frequency Penalty',
                name: 'frequencyPenalty',
                type: 'number',
                default: 0,
                description: 'Reduces repetition of words',
                typeOptions: {
                    minValue: -2,
                    maxValue: 2,
                    numberPrecision: 2,
                },
            },
            {
                displayName: 'Presence Penalty',
                name: 'presencePenalty',
                type: 'number',
                default: 0,
                description: 'Encourages new topics',
                typeOptions: {
                    minValue: -2,
                    maxValue: 2,
                    numberPrecision: 2,
                },
            },
        ],
    },
];