import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
    NodeConnectionType,
    IDataObject,
} from 'n8n-workflow';

import { GITHUB_COPILOT_API, GitHubCopilotEndpoints } from '../../shared/utils/GitHubCopilotEndpoints';

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

async function listAvailableModels(token: string, enableRetry = true, maxRetries = 3): Promise<IDataObject> {
    const retryInfo = {
        attempts: 1,
        retries: [] as Array<{ attempt: number; error: string; delay: number; timestamp: string }>,
        totalDelay: 0,
    };

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
        try {
            const response = await fetch(GitHubCopilotEndpoints.getModelsUrl(), {
                method: 'GET',
                headers: GitHubCopilotEndpoints.getAuthHeaders(token),
            });

            if (!response.ok) {
                const errorText = await response.text();
                
                // Check if it's a 403 error and retry is enabled
                if (GitHubCopilotEndpoints.isTpmQuotaError(response.status) && enableRetry && attempt <= maxRetries) {
                    const delay = GitHubCopilotEndpoints.getRetryDelay(attempt);
                    
                    retryInfo.retries.push({
                        attempt: attempt,
                        error: `HTTP ${response.status}: ${errorText}`,
                        delay: delay,
                        timestamp: new Date().toISOString(),
                    });
                    retryInfo.totalDelay += delay;
                    retryInfo.attempts = attempt + 1;

                    console.log(`Attempt ${attempt} failed with 403, retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
                
                throw new Error(`API Error ${response.status}: ${errorText}`);
            }

            const data = await response.json() as GitHubCopilotModelsResponse;

            // Return ALL models from API - no filtering for test module
            // User decides what to do with the data
            const summary: IDataObject = {
                success: true,
                timestamp: new Date().toISOString(),
                retryInfo: {
                    totalAttempts: retryInfo.attempts,
                    totalRetries: retryInfo.retries.length,
                    totalDelay: retryInfo.totalDelay,
                    retryDetails: retryInfo.retries,
                    retryEnabled: enableRetry,
                    maxRetries: maxRetries,
                },
                // Return the complete API response
                ...data,
            };

            return summary;

        } catch (error) {
            // If it's the last attempt or retry is disabled, return error
            if (attempt >= maxRetries + 1 || !enableRetry) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                return {
                    success: false,
                    timestamp: new Date().toISOString(),
                    error: errorMessage,
                    details: 'Failed to fetch models from GitHub Copilot API',
                    retryInfo: {
                        totalAttempts: retryInfo.attempts,
                        totalRetries: retryInfo.retries.length,
                        totalDelay: retryInfo.totalDelay,
                        retryDetails: retryInfo.retries,
                        retryEnabled: enableRetry,
                        maxRetries: maxRetries,
                    },
                };
            }
        }
    }

    // This should never be reached, but just in case
    return {
        success: false,
        timestamp: new Date().toISOString(),
        error: 'Maximum retry attempts exceeded',
        details: 'Failed to fetch models after all retry attempts',
        retryInfo: {
            totalAttempts: retryInfo.attempts,
            totalRetries: retryInfo.retries.length,
            totalDelay: retryInfo.totalDelay,
            retryDetails: retryInfo.retries,
            retryEnabled: enableRetry,
            maxRetries: maxRetries,
        },
    };
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
            {
                displayName: 'Auto Retry on 403 Error',
                name: 'enableRetry',
                type: 'boolean',
                default: true,
                description: 'Automatically retry requests when hitting TPM (Transactions Per Minute) quota limits (HTTP 403)',
            },
            {
                displayName: 'Max Retry Attempts',
                name: 'maxRetries',
                type: 'number',
                default: 3,
                description: 'Maximum number of retry attempts for 403 errors',
                displayOptions: {
                    show: {
                        enableRetry: [true],
                    },
                },
            },
        ],
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        const returnData: INodeExecutionData[] = [];

        for (let i = 0; i < items.length; i++) {
            try {
                const testFunction = this.getNodeParameter('testFunction', i) as string;
                const enableRetry = this.getNodeParameter('enableRetry', i) as boolean;
                const maxRetries = this.getNodeParameter('maxRetries', i) as number;
                const credentials = await this.getCredentials('githubCopilotApi', i);

                if (!credentials?.token) {
                    throw new Error(GITHUB_COPILOT_API.ERRORS.CREDENTIALS_REQUIRED);
                }

                const token = credentials.token as string;

                // Validate token format
                if (!GitHubCopilotEndpoints.validateToken(token)) {
                    throw new Error(GITHUB_COPILOT_API.ERRORS.INVALID_TOKEN);
                }

                let result: IDataObject = {};

                switch (testFunction) {
                    case 'listModels':
                        result = await listAvailableModels(token, enableRetry, maxRetries);
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