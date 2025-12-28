export type FileProcessingMode = 'direct' | 'chunking' | 'summarize' | 'auto';
export interface FileOptimizationOptions {
    mode: FileProcessingMode;
    model: string;
    fileSize: number;
    maxContextUsage?: number;
    minRelevance?: number;
}
export interface OptimizationResult {
    mode: 'direct' | 'chunking' | 'summarize';
    reason: string;
    estimatedTokens: number;
    maxAllowedTokens: number;
    fitsInContext: boolean;
}
export declare function estimateFileTokens(fileSize: number, isBase64?: boolean): number;
export declare function selectFileProcessingMode(options: FileOptimizationOptions): OptimizationResult;
export declare function getOptimalChunkSettings(model: string, maxContextUsage?: number): {
    maxChunks: number;
    maxTokensPerChunk: number;
    totalMaxTokens: number;
};
export declare function compressText(text: string): string;
export declare function truncateToTokenLimit(text: string, maxTokens: number, addEllipsis?: boolean): {
    content: string;
    truncated: boolean;
    originalTokens: number;
    finalTokens: number;
};
export declare function getFileSizeCategory(sizeBytes: number): string;
export declare function formatTokenCount(tokens: number): string;
export declare function calculateSavings(originalTokens: number, optimizedTokens: number): {
    savedTokens: number;
    savingsPercent: number;
    savingsRatio: string;
};
