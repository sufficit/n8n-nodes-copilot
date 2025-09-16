import { IExecuteFunctions } from 'n8n-workflow';

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string | Array<ChatMessageContent>;
}

export interface ChatMessageContent {
    type: string;
    text?: string;
    image_url?: { url: string };
    // Note: GitHub Copilot API doesn't support input_audio type
    // Audio must be handled as text or converted to other formats
}

export interface CopilotResponse {
    choices: Array<{
        message: {
            content: string;
        };
        finish_reason: string;
    }>;
    usage?: {
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