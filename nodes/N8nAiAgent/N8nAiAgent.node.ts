import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
    NodeConnectionType,
    IDataObject,
    NodeOperationError,
} from 'n8n-workflow';

import {
    ChatMessage,
    ChatMessageContent,
} from '../GitHubCopilotChatAPI/utils';
import { nodeProperties } from './nodeProperties';
import { processMediaFile } from '../GitHubCopilotChatAPI/utils/mediaDetection';

export class N8nAiAgent implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'N8N AI Agent',
        name: 'n8nAiAgent',
        icon: 'file:n8n-ai.svg',
        group: ['AI'],
        version: 1,
        subtitle: '={{$parameter["operation"] + ": " + $parameter["model"]}}',
        description: 'Connect to N8N AI Agent service for advanced AI capabilities with tool calling and memory',
        defaults: {
            name: 'N8N AI Agent',
        },
        inputs: [NodeConnectionType.Main],
        outputs: [NodeConnectionType.Main],
        credentials: [
            {
                name: 'n8nApi',
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
                    // Get basic parameters
                    const message = this.getNodeParameter('message', i) as string;
                    const includeMedia = this.getNodeParameter('includeMedia', i, false) as boolean;

                    // Build messages array
                    const messages: ChatMessage[] = [];

                    // System message (optional)
                    const systemMessage = this.getNodeParameter('systemMessage', i, '') as string;
                    if (systemMessage) {
                        messages.push({
                            role: 'system',
                            content: systemMessage,
                        });
                    }

                    // Process user message with media if included
                    const messageContent: ChatMessageContent[] = [
                        {
                            type: 'text',
                            text: message,
                        },
                    ];

                    if (includeMedia) {
                        const mediaSource = this.getNodeParameter('mediaSource', i) as 'manual' | 'url' | 'binary';
                        const processedMedia = await processMediaFile(
                            this,
                            i,
                            mediaSource,
                            this.getNodeParameter('mediaFile', i, '') as string,
                            this.getNodeParameter('mediaUrl', i, '') as string,
                            this.getNodeParameter('mediaProperty', i, '') as string,
                        );

                        if (processedMedia && processedMedia.dataUrl) {
                            messageContent.push({
                                type: 'image_url',
                                image_url: {
                                    url: processedMedia.dataUrl,
                                },
                            });
                        }
                    }

                    messages.push({
                        role: 'user',
                        content: messageContent,
                    });

                    // Get conversation history if enabled
                    const includeHistory = this.getNodeParameter('includeHistory', i, false) as boolean;
                    if (includeHistory) {
                        const historyMessages = this.getNodeParameter('conversationHistory', i, []) as ChatMessage[];
                        messages.splice(-1, 0, ...historyMessages);
                    }

                    // Get advanced options
                    const advancedOptions: IDataObject = {};
                    const maxTokens = this.getNodeParameter('maxTokens', i, 1000) as number;
                    const temperature = this.getNodeParameter('temperature', i, 0.7) as number;
                    const enableTools = this.getNodeParameter('enableTools', i, false) as boolean;

                    if (maxTokens > 0) {
                        advancedOptions.max_tokens = maxTokens;
                    }
                    advancedOptions.temperature = temperature;

                    // Add tools if enabled
                    if (enableTools) {
                        const toolsConfig = this.getNodeParameter('toolsConfig', i, {}) as IDataObject;
                        if (toolsConfig.tools && Array.isArray(toolsConfig.tools)) {
                            advancedOptions.tools = toolsConfig.tools;
                        }
                    }

                    // Prepare request body
                    const requestBody: IDataObject = {
                        model,
                        messages,
                        stream: false,
                        ...advancedOptions,
                    };

                    // Make API request to N8N AI Agent
                    const response = await makeN8nAiAgentRequest(this, '/chat', requestBody, includeMedia);

                    // Extract result
                    const result: IDataObject = {
                        message: response.response || response.message || '',
                        model,
                        operation,
                        usage: response.usage || null,
                        tool_calls: response.tool_calls || null,
                        memory: response.memory || null,
                        finish_reason: response.finish_reason || 'completed',
                    };

                    returnData.push({
                        json: result,
                        pairedItem: { item: i },
                    });

                } else if (operation === 'tools') {
                    // Tool calling operation
                    const toolName = this.getNodeParameter('toolName', i) as string;
                    const toolArguments = this.getNodeParameter('toolArguments', i, {}) as IDataObject;
                    const context = this.getNodeParameter('context', i, '') as string;

                    const requestBody: IDataObject = {
                        tool: toolName,
                        arguments: toolArguments,
                        context,
                        model,
                    };

                    const response = await makeN8nAiAgentRequest(this, '/tools', requestBody, false);

                    const result: IDataObject = {
                        tool_name: toolName,
                        result: response.result || response.response,
                        execution_time: response.execution_time || null,
                        operation,
                        model,
                    };

                    returnData.push({
                        json: result,
                        pairedItem: { item: i },
                    });

                } else if (operation === 'memory') {
                    // Memory management operation
                    const memoryAction = this.getNodeParameter('memoryAction', i) as string;
                    const sessionId = this.getNodeParameter('sessionId', i, '') as string;

                    const requestBody: IDataObject = {
                        action: memoryAction,
                        session_id: sessionId,
                    };

                    if (memoryAction === 'store') {
                        const memoryData = this.getNodeParameter('memoryData', i) as IDataObject;
                        requestBody.data = memoryData;
                    }

                    const response = await makeN8nAiAgentRequest(this, '/memory', requestBody, false);

                    const result: IDataObject = {
                        action: memoryAction,
                        session_id: sessionId,
                        data: response.data || response.memory,
                        operation,
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

async function makeN8nAiAgentRequest(
    context: IExecuteFunctions,
    endpoint: string,
    requestBody: IDataObject,
    hasMedia: boolean,
): Promise<IDataObject> {
    const credentials = await context.getCredentials('n8nApi');
    
    // Use N8N API base URL or default to localhost
    const baseUrl = credentials.baseUrl as string || 'http://localhost:5678';
    const apiKey = credentials.apiKey as string;

    if (!apiKey) {
        throw new NodeOperationError(context.getNode(), 'N8N API key is required');
    }

    const options = {
        method: 'POST' as const,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'User-Agent': 'N8nAiAgentNode/1.0',
            ...(hasMedia && { 'AI-Vision-Request': 'true' }),
        },
        body: JSON.stringify(requestBody),
        uri: `${baseUrl}/api/v1/ai-agent${endpoint}`,
        json: true,
    };

    try {
        const response = await context.helpers.request(options);
        return response as IDataObject;
    } catch (error: unknown) {
        // Type guard to check if error has statusCode property
        const apiError = error as { statusCode?: number; message?: string };
        
        if (apiError.statusCode === 401) {
            throw new NodeOperationError(context.getNode(), 'Invalid N8N API key');
        } else if (apiError.statusCode === 404) {
            throw new NodeOperationError(context.getNode(), 'N8N AI Agent endpoint not found. Make sure AI Agent is enabled in your N8N instance.');
        } else {
            throw new NodeOperationError(context.getNode(), `N8N AI Agent API error: ${apiError.message || String(error)}`);
        }
    }
}