"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapOpenAIModelToCopilot = mapOpenAIModelToCopilot;
exports.convertOpenAIMessagesToCopilot = convertOpenAIMessagesToCopilot;
exports.convertCopilotResponseToOpenAI = convertCopilotResponseToOpenAI;
exports.parseOpenAIRequest = parseOpenAIRequest;
exports.debugLog = debugLog;
function mapOpenAIModelToCopilot(openaiModel) {
    const modelMappings = {
        'gpt-4': 'gpt-4o',
        'gpt-4o': 'gpt-4o',
        'gpt-4o-mini': 'gpt-4o-mini',
        'gpt-4-turbo': 'gpt-4o',
        'gpt-3.5-turbo': 'gpt-4o-mini',
        'claude-3-5-sonnet': 'claude-3.5-sonnet',
        'claude-3-haiku': 'claude-3-haiku',
        'claude-3-opus': 'claude-3-opus',
        'gemini-1.5-pro': 'gemini-1.5-pro',
        'gemini-1.5-flash': 'gemini-1.5-flash',
        'o1-preview': 'o1-preview',
        'o1-mini': 'o1-mini',
    };
    return modelMappings[openaiModel] || 'gpt-4o';
}
function convertOpenAIMessagesToCopilot(messages) {
    let systemMessage = '';
    const userMessages = [];
    const assistantMessages = [];
    for (const msg of messages) {
        switch (msg.role) {
            case 'system':
                systemMessage += (systemMessage ? '\n\n' : '') + msg.content;
                break;
            case 'user':
                userMessages.push(msg.content);
                break;
            case 'assistant':
                assistantMessages.push(msg.content);
                break;
        }
    }
    let conversationContext = '';
    const maxLength = Math.max(userMessages.length, assistantMessages.length);
    for (let i = 0; i < maxLength - 1; i++) {
        if (i < userMessages.length - 1) {
            conversationContext += `User: ${userMessages[i]}\n`;
        }
        if (i < assistantMessages.length) {
            conversationContext += `Assistant: ${assistantMessages[i]}\n`;
        }
    }
    const finalUserMessage = userMessages[userMessages.length - 1] || '';
    const message = conversationContext
        ? `${conversationContext}\nUser: ${finalUserMessage}`
        : finalUserMessage;
    return {
        message,
        system_message: systemMessage || undefined,
    };
}
function convertCopilotResponseToOpenAI(copilotResponse, model) {
    const timestamp = Math.floor(Date.now() / 1000);
    return {
        id: `chatcmpl-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
        object: 'chat.completion',
        created: timestamp,
        model: model,
        choices: [
            {
                index: 0,
                message: {
                    role: 'assistant',
                    content: copilotResponse.message,
                    tool_calls: copilotResponse.tool_calls,
                },
                finish_reason: mapFinishReason(copilotResponse.finish_reason),
            },
        ],
        usage: {
            prompt_tokens: copilotResponse.usage.prompt_tokens,
            completion_tokens: copilotResponse.usage.completion_tokens,
            total_tokens: copilotResponse.usage.total_tokens,
        },
    };
}
function mapFinishReason(copilotReason) {
    switch (copilotReason) {
        case 'stop':
        case 'end_turn':
            return 'stop';
        case 'max_tokens':
        case 'length':
            return 'length';
        case 'tool_calls':
        case 'function_call':
            return 'tool_calls';
        case 'content_filter':
        case 'safety':
            return 'content_filter';
        default:
            return 'stop';
    }
}
function parseOpenAIRequest(context, itemIndex) {
    const model = context.getNodeParameter('model', itemIndex, 'gpt-4o');
    const messagesParam = context.getNodeParameter('messages', itemIndex, {
        message: [],
    });
    const tools = context.getNodeParameter('tools', itemIndex, '');
    const toolChoice = context.getNodeParameter('tool_choice', itemIndex, 'auto');
    const responseFormat = context.getNodeParameter('response_format', itemIndex, 'text');
    const temperature = context.getNodeParameter('temperature', itemIndex, 1);
    const maxTokens = context.getNodeParameter('max_tokens', itemIndex, '');
    const topP = context.getNodeParameter('top_p', itemIndex, 1);
    const frequencyPenalty = context.getNodeParameter('frequency_penalty', itemIndex, 0);
    const presencePenalty = context.getNodeParameter('presence_penalty', itemIndex, 0);
    const stop = context.getNodeParameter('stop', itemIndex, '');
    const stream = context.getNodeParameter('stream', itemIndex, false);
    const seed = context.getNodeParameter('seed', itemIndex, '');
    const user = context.getNodeParameter('user', itemIndex, '');
    const messages = [];
    if (messagesParam.message && Array.isArray(messagesParam.message)) {
        for (const msg of messagesParam.message) {
            messages.push({
                role: msg.role,
                content: msg.content,
            });
        }
    }
    const request = {
        model,
        messages,
        temperature,
        top_p: topP,
        frequency_penalty: frequencyPenalty,
        presence_penalty: presencePenalty,
        stream,
    };
    if (tools) {
        try {
            request.tools = JSON.parse(tools);
            request.tool_choice = toolChoice;
        }
        catch (error) {
            throw new Error(`Invalid tools JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    if (responseFormat !== 'text') {
        request.response_format = { type: responseFormat };
    }
    if (maxTokens) {
        request.max_tokens = maxTokens;
    }
    if (stop) {
        try {
            request.stop = JSON.parse(stop);
        }
        catch {
            request.stop = stop;
        }
    }
    if (seed) {
        request.seed = seed;
    }
    if (user) {
        request.user = user;
    }
    return request;
}
function debugLog(context, itemIndex, message, data) {
    const advancedOptions = context.getNodeParameter('advancedOptions', itemIndex, {});
    if (advancedOptions.debugMode) {
        console.log(`[GitHub Copilot OpenAI Debug] ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
}
