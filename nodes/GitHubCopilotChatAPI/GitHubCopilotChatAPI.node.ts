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
} from './utils';
import { nodeProperties } from './nodeProperties';
import { processMediaFile } from './utils/mediaDetection';
import { GitHubCopilotModelsManager } from '../../shared/models/GitHubCopilotModels';

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

                    // Make API request with vision support if media is included
                    const hasMedia = includeMedia;
                    const response = await makeApiRequest(this, '/chat/completions', requestBody, hasMedia);

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