import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
    NodeConnectionType,
    IDataObject,
} from 'n8n-workflow';

import {
    ChatMessage,
    ChatMessageContent,
    makeApiRequest,
    CopilotResponse,
} from './utils';
import { nodeProperties } from './nodeProperties';
import { processMediaFile } from './utils/mediaDetection';
import { GitHubCopilotModelsManager } from '../../shared/models/GitHubCopilotModels';
import { GITHUB_COPILOT_API } from '../../shared/utils/GitHubCopilotEndpoints';

export class GitHubCopilotChatAPI implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'GitHub Copilot Chat API',
        name: 'gitHubCopilotChatAPI',
        icon: 'file:../../shared/icons/copilot.svg',
        group: ['AI'],
        version: 1,
        subtitle: '={{$parameter["operation"] + ": " + $parameter["model"]}}',
        description: 'Use official GitHub Copilot Chat API with your subscription - access GPT-5, Claude, Gemini and more',
        defaults: {
            name: 'GitHub Copilot Chat API',
        },
        inputs: [NodeConnectionType.Main],
        outputs: [NodeConnectionType.Main],
        credentials: [
            {
                name: 'githubCopilotApi',
                required: true,
            },
        ],
        properties: nodeProperties,
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        const returnData: INodeExecutionData[] = [];

        for (let i = 0; i < items.length; i++) {
            try {
                const operation = this.getNodeParameter('operation', i) as string;
                const model = this.getNodeParameter('model', i) as string;

                if (operation === 'chat') {
                    const userMessage = this.getNodeParameter('message', i) as string;
                    const systemMessage = this.getNodeParameter('systemMessage', i, '') as string;
                    const advancedOptions = this.getNodeParameter('advancedOptions', i, {}) as IDataObject;
                    
                    // Get retry options
                    const enableRetry = advancedOptions.enableRetry !== false;
                    const maxRetries = (advancedOptions.maxRetries as number) || 3;
                    
                    const includeMedia = this.getNodeParameter('includeMedia', i, false) as boolean;

                    // Get model capabilities from centralized manager
                    const modelInfo = GitHubCopilotModelsManager.getModelByValue(model);

                    // Validate model capabilities before processing (only if media is included)
                    if (includeMedia) {
                        if (!modelInfo?.capabilities.vision && !modelInfo?.capabilities.multimodal) {
                            throw new Error(`Model ${model} does not support vision/image processing. Please select a model with vision capabilities.`);
                        }
                    }

                    // Build messages array
                    const messages: ChatMessage[] = [];

                    // Add system message if provided
                    if (systemMessage) {
                        messages.push({
                            role: 'system',
                            content: systemMessage,
                        });
                    }

                    // Prepare user message content
                    let userContent: string | Array<ChatMessageContent> = userMessage;

                    // Handle multimodal content (unified media handling)
                    if (includeMedia) {
                        const mediaSource = this.getNodeParameter('mediaSource', i) as string;
                        const mediaFile = this.getNodeParameter('mediaFile', i, '') as string;
                        const mediaUrl = this.getNodeParameter('mediaUrl', i, '') as string;
                        const mediaBinaryProperty = this.getNodeParameter('mediaBinaryProperty', i, '') as string;

                        const contentArray: Array<ChatMessageContent> = [];

                        // Add text content
                        if (userMessage.trim()) {
                            contentArray.push({
                                type: 'text',
                                text: userMessage,
                            });
                        }

                        // Process media file and auto-detect type
                        try {
                            const mediaResult = await processMediaFile(
                                this,
                                i,
                                mediaSource as 'manual' | 'url' | 'binary',
                                mediaFile,
                                mediaUrl,
                                mediaBinaryProperty
                            );

                            if (mediaResult.type === 'image' && mediaResult.dataUrl) {
                                // Handle as image
                                contentArray.push({
                                    type: 'image_url',
                                    image_url: {
                                        url: mediaResult.dataUrl,
                                    },
                                });
                            } else {
                                // Unknown or error
                                contentArray.push({
                                    type: 'text',
                                    text: `[Image processing failed: ${mediaResult.description}]`,
                                });
                            }
                        } catch (error) {
                            contentArray.push({
                                type: 'text',
                                text: `[Media processing error: ${error instanceof Error ? error.message : 'Unknown error'}]`,
                            });
                        }

                        userContent = contentArray;
                    }

                    // Add user message
                    messages.push({
                        role: 'user',
                        content: userContent,
                    });

                    // Prepare request body
                    const requestBody: Record<string, unknown> = {
                        model,
                        messages,
                        stream: false,
                        ...advancedOptions,
                    };

                    // Make API request with retry logic
                    const hasMedia = includeMedia;
                    let response: CopilotResponse | null = null;
                    let attempt = 1;
                    
                    while (attempt <= maxRetries + 1) {
                        try {
                            response = await makeApiRequest(this, GITHUB_COPILOT_API.ENDPOINTS.CHAT_COMPLETIONS, requestBody, hasMedia);
                            break; // Success, exit retry loop
                        } catch (error: unknown) {
                            const isLastAttempt = attempt >= maxRetries + 1;
                            const errorObj = error as { status?: number; message?: string };
                            const is403Error = errorObj.status === 403 || errorObj.message?.includes('403');
                            
                            if (is403Error && enableRetry && !isLastAttempt) {
                                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000); // Exponential backoff, max 30s
                                console.log(`GitHub Copilot API attempt ${attempt} failed with 403, retrying in ${delay}ms...`);
                                await new Promise(resolve => setTimeout(resolve, delay));
                                attempt++;
                                continue;
                            }
                            
                            // If not retryable or last attempt, throw the error
                            throw error;
                        }
                    }
                    
                    if (!response) {
                        throw new Error('Failed to get response from GitHub Copilot API after all retry attempts');
                    }

                    // Extract result
                    const result: IDataObject = {
                        message: response.choices[0]?.message?.content || '',
                        model,
                        operation,
                        usage: response.usage || null,
                        finish_reason: response.choices[0]?.finish_reason || 'unknown',
                    };

                    returnData.push({
                        json: result,
                        pairedItem: { item: i },
                    });
                }

            } catch (error) {
                if (this.continueOnFail()) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    returnData.push({
                        json: { 
                            error: errorMessage,
                            operation: this.getNodeParameter('operation', i),
                            model: this.getNodeParameter('model', i),
                        } as IDataObject,
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