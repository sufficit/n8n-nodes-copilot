import { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { CopilotResponse } from '../../../shared/utils/GitHubCopilotApiUtils';
export { CopilotResponse };
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
export interface FileProcessOptions {
    context: IExecuteFunctions;
    itemIndex: number;
    source: 'manual' | 'url' | 'binary';
    filePath?: string;
    url?: string;
    binaryProperty?: string;
}
export interface ProcessedFileResult {
    data: string;
    mimeType: string;
    filename: string;
    size: number;
    estimatedTokens: number;
}
export interface OptimizationOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    maxSizeKB?: number;
}
export interface ModelCapabilities {
    supportsImages: boolean;
    supportsAudio: boolean;
    maxContextTokens: number;
    description: string;
}
export interface ModelValidationResult {
    isValid: boolean;
    errorMessage?: string;
    warnings?: string[];
}
