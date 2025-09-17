import {
    INodeType,
    INodeTypeDescription,
    NodeConnectionType,
    ISupplyDataFunctions,
    SupplyData,
} from 'n8n-workflow';

import { ChatOpenAI } from '@langchain/openai';
import { GitHubCopilotModelsManager, DEFAULT_MODELS } from '../../shared/models/GitHubCopilotModels';

export class GitHubCopilotChatModel implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'GitHub Copilot Chat Model',
        name: 'gitHubCopilotChatModel',
        icon: 'file:copilot.svg',
        group: ['transform'],
        version: 1,
        description: 'GitHub Copilot chat model for AI workflows - access GPT-5, Claude, Gemini and more using your Copilot subscription',
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
        outputs: [NodeConnectionType.AiLanguageModel],
        outputNames: ['Model'],
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
                default: DEFAULT_MODELS.GENERAL,
                description: 'The GitHub Copilot model to use',
                options: GitHubCopilotModelsManager.toN8nOptions(),
            },
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
                        displayName: 'Enable Vision',
                        name: 'enableVision',
                        type: 'boolean',
                        default: true,
                        description: 'Whether to enable image processing capabilities',
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
                ],
            },
        ],
    };

    async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
        const model = this.getNodeParameter('model', itemIndex) as string;
        const options = this.getNodeParameter('options', itemIndex, {}) as {
            temperature?: number;
            maxTokens?: number;
            topP?: number;
            enableVision?: boolean;
            systemMessage?: string;
        };

        // Get model information from centralized manager
        const modelInfo = GitHubCopilotModelsManager.getModelByValue(model);
        
        // Get OAuth2 credentials (same as ChatAPI node)
        const credentials = await this.getCredentials('githubCopilotApi') as Record<string, unknown>;
        
        // OAuth2 credentials might have different property names
        const token = (
            credentials.accessToken || 
            credentials.access_token || 
            (credentials.oauthTokenData as Record<string, unknown>)?.access_token ||
            credentials.token
        ) as string;
        
        if (!token) {
            console.error('❌ Available OAuth2 credential properties:', Object.keys(credentials));
            throw new Error('GitHub Copilot: No access token found in OAuth2 credentials. Available properties: ' + Object.keys(credentials).join(', '));
        }

        // Debug: Show token info for troubleshooting
        const tokenPrefix = token.substring(0, Math.min(4, token.indexOf('_') + 1)) || token.substring(0, 4);
        const tokenSuffix = token.substring(Math.max(0, token.length - 5));
        console.log(`🔍 GitHub Copilot ChatModel OAuth2 Debug: Using token ${tokenPrefix}...${tokenSuffix}`);
        
        // Note: GitHub Copilot accepts different token formats
        if (!token.startsWith('gho_') && !token.startsWith('ghu_') && !token.startsWith('github_pat_')) {
            console.warn(`⚠️ Unexpected token format: ${tokenPrefix}...${tokenSuffix}. Trying API call anyway.`);
        }
        
        // Fallback to gpt-4o-mini if model not found or use a safe default
        const safeModel = modelInfo ? model : DEFAULT_MODELS.GENERAL;
        const safeModelInfo = modelInfo || GitHubCopilotModelsManager.getModelByValue(DEFAULT_MODELS.GENERAL);
        
        // Configure model based on capabilities
        const modelConfig = {
            // Don't use apiKey directly, use configuration instead
            model: safeModel,
            temperature: options.temperature || 0.7,
            maxTokens: Math.min(options.maxTokens || 1000, safeModelInfo?.capabilities.maxOutputTokens || 4096),
            topP: options.topP || 1,
            configuration: {
                baseURL: 'https://api.githubcopilot.com',
                apiKey: token,  // Use validated token
                defaultHeaders: {
                    'User-Agent': 'GitHubCopilotChat/1.0.0 n8n/3.10.1',
                    'Accept': 'application/json',
                    'Editor-Version': 'vscode/1.85.0',
                    'Editor-Plugin-Version': 'copilot-chat/0.12.0',
                    'X-Request-Id': `n8n-chatmodel-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                    ...(options.enableVision && safeModelInfo?.capabilities.vision && {
                        'Copilot-Vision-Request': 'true',
                        'Copilot-Media-Request': 'true'
                    }),
                },
            }
            // Remove tool_choice configuration - let n8n handle it when tools are provided
        };

        // Create a customized ChatOpenAI instance for GitHub Copilot
        const chatModel = new ChatOpenAI(modelConfig);

        return {
            response: chatModel,
        };
    }
}