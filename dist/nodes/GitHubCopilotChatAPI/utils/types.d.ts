import { IExecuteFunctions } from 'n8n-workflow';
import { CopilotResponse } from '../../../shared/utils/GitHubCopilotApiUtils';
export { CopilotResponse };
export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string | Array<ChatMessageContent>;
    type?: 'file';
}
export interface ChatMessageContent {
    type: string;
    text?: string;
    image_url?: {
        url: string;
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
