import { IDataObject, IExecuteFunctions } from 'n8n-workflow';
export interface OpenAIMessage {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string;
    name?: string;
    tool_calls?: ToolCall[];
    tool_call_id?: string;
}
export interface ToolCall {
    id: string;
    type: 'function';
    function: {
        name: string;
        arguments: string;
    };
}
export interface OpenAITool {
    type: 'function';
    function: {
        name: string;
        description: string;
        parameters: IDataObject;
    };
}
export interface OpenAIRequest {
    model: string;
    messages: OpenAIMessage[];
    tools?: OpenAITool[];
    tool_choice?: 'auto' | 'none' | 'required' | {
        type: 'function';
        function: {
            name: string;
        };
    };
    response_format?: {
        type: 'text' | 'json_object';
    };
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
    stop?: string | string[];
    stream?: boolean;
    seed?: number;
    user?: string;
}
export interface OpenAIResponse {
    id: string;
    object: 'chat.completion';
    created: number;
    model: string;
    choices: Array<{
        index: number;
        message: {
            role: 'assistant';
            content: string | null;
            tool_calls?: ToolCall[];
        };
        finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter';
    }>;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}
export interface CopilotRequest {
    model: string;
    message: string;
    system_message?: string;
    temperature?: number;
    max_tokens?: number;
    tools?: OpenAITool[];
    tool_choice?: string;
}
export interface CopilotResponse {
    message: string;
    model: string;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
    finish_reason: string;
    tool_calls?: ToolCall[];
}
export declare function mapOpenAIModelToCopilot(openaiModel: string): string;
export declare function convertOpenAIMessagesToCopilot(messages: OpenAIMessage[]): {
    message: string;
    system_message?: string;
};
export declare function convertCopilotResponseToOpenAI(copilotResponse: CopilotResponse, model: string): OpenAIResponse;
export declare function parseOpenAIRequest(context: IExecuteFunctions, itemIndex: number): OpenAIRequest;
export declare function debugLog(context: IExecuteFunctions, itemIndex: number, message: string, data?: unknown): void;
