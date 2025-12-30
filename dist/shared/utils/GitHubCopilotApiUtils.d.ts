import { IExecuteFunctions } from "n8n-workflow";
export interface CopilotResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Array<{
        index: number;
        message: {
            role: string;
            content: string;
            tool_calls?: Array<{
                id: string;
                type: string;
                function: {
                    name: string;
                    arguments: string;
                };
            }>;
            [key: string]: unknown;
        };
        finish_reason: string;
    }>;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
    _retryMetadata?: {
        attempts: number;
        retries: number;
        succeeded: boolean;
    };
}
export interface RetryConfig {
    maxRetries?: number;
    baseDelay?: number;
    retryOn403?: boolean;
}
export declare function makeGitHubCopilotRequest(context: IExecuteFunctions, endpoint: string, body: Record<string, unknown>, hasMedia?: boolean, retryConfig?: RetryConfig): Promise<CopilotResponse>;
export declare function uploadFileToCopilot(context: IExecuteFunctions, buffer: Buffer, filename: string, mimeType?: string): Promise<any>;
export declare function downloadFileFromUrl(url: string): Promise<Buffer>;
export declare function getFileFromBinary(context: IExecuteFunctions, itemIndex: number, propertyName: string): Promise<Buffer>;
export declare function getImageMimeType(filename: string): string;
export declare function getAudioMimeType(filename: string): string;
export declare function validateFileSize(buffer: Buffer, maxSizeKB?: number): void;
export declare function estimateTokens(base64String: string): number;
export declare function validateTokenLimit(estimatedTokens: number, maxTokens?: number): {
    valid: boolean;
    message?: string;
};
export declare function truncateToTokenLimit(content: string, maxTokens?: number): {
    content: string;
    truncated: boolean;
    originalTokens: number;
    finalTokens: number;
};
