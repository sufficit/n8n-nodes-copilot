import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
    NodeConnectionType,
    IDataObject,
} from 'n8n-workflow';

interface GitHubCopilotModel {
    id: string;
    name: string;
    display_name: string;
    model_picker_enabled?: boolean;
    capabilities?: string[];
}

interface GitHubCopilotModelsResponse {
    data: GitHubCopilotModel[];
}

async function listAvailableModels(token: string): Promise<IDataObject> {
    try {
        const response = await fetch('https://api.githubcopilot.com/models', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error ${response.status}: ${errorText}`);
        }

        const data = await response.json() as GitHubCopilotModelsResponse;

        // Filter enabled models and create summary
        const enabledModels = data.data?.filter((model: GitHubCopilotModel) => model.model_picker_enabled !== false) || [];
        
        // Group models by provider
        const modelsByProvider: { [key: string]: IDataObject[] } = {};
        enabledModels.forEach((model: GitHubCopilotModel) => {
            const provider = model.name.split('/')[0] || 'unknown';
            if (!modelsByProvider[provider]) {
                modelsByProvider[provider] = [];
            }
            modelsByProvider[provider].push({
                id: model.id,
                name: model.name,
                displayName: model.display_name,
                capabilities: model.capabilities || [],
            });
        });

        const summary: IDataObject = {
            success: true,
            timestamp: new Date().toISOString(),
            totalModels: data.data?.length || 0,
            enabledModels: enabledModels.length,
            modelsByProvider,
            models: enabledModels.map((model: GitHubCopilotModel) => ({
                id: model.id,
                name: model.name,
                displayName: model.display_name,
                capabilities: model.capabilities || [],
            })),
        };

        return summary;

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return {
            success: false,
            timestamp: new Date().toISOString(),
            error: errorMessage,
            details: 'Failed to fetch models from GitHub Copilot API',
        };
    }
}

export class GitHubCopilotTest implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'GitHub Copilot Test',
        name: 'gitHubCopilotTest',
        icon: 'file:../../shared/icons/copilot.svg',
        group: ['AI'],
        version: 1,
        subtitle: '={{$parameter["testFunction"]}}',
        description: 'Test GitHub Copilot API credentials with predefined functions',
        defaults: {
            name: 'GitHub Copilot Test',
        },
        inputs: [NodeConnectionType.Main],
        outputs: [NodeConnectionType.Main],
        credentials: [
            {
                name: 'githubCopilotApi',
                required: true,
            },
        ],
        properties: [
            {
                displayName: 'Test Function',
                name: 'testFunction',
                type: 'options',
                noDataExpression: true,
                options: [
                    {
                        name: 'List Available Models',
                        value: 'listModels',
                        description: 'Get all models available for your GitHub Copilot subscription',
                    },
                ],
                default: 'listModels',
                description: 'Select the test function to execute',
            },
        ],
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        const returnData: INodeExecutionData[] = [];

        for (let i = 0; i < items.length; i++) {
            try {
                const testFunction = this.getNodeParameter('testFunction', i) as string;
                const credentials = await this.getCredentials('githubCopilotApi', i);

                if (!credentials?.token) {
                    throw new Error('GitHub Copilot API credentials are required');
                }

                const token = credentials.token as string;

                // Validate token format
                if (!token.startsWith('gho_')) {
                    throw new Error('Invalid token format. GitHub Copilot API requires tokens starting with "gho_"');
                }

                let result: IDataObject = {};

                switch (testFunction) {
                    case 'listModels':
                        result = await listAvailableModels(token);
                        break;
                    default:
                        throw new Error(`Unknown test function: ${testFunction}`);
                }

                returnData.push({
                    json: result,
                    pairedItem: { item: i },
                });

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                if (this.continueOnFail()) {
                    returnData.push({
                        json: {
                            error: errorMessage,
                            testFunction: this.getNodeParameter('testFunction', i),
                        },
                        pairedItem: { item: i },
                    });
                } else {
                    throw error;
                }
            }
        }

        return [returnData];
    }
}