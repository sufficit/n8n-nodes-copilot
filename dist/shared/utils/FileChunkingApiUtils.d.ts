export interface ChunkRequest {
    content: string;
    embed: boolean;
    qos: 'Batch' | 'Online';
}
export interface Chunk {
    content: string;
    embedding?: number[];
    start: number;
    end: number;
    metadata?: Record<string, unknown>;
}
export interface ChunkResponse {
    chunks: Chunk[];
    total: number;
    contentLength: number;
}
export declare function chunkFile(token: string, fileContent: string, embeddings?: boolean, qos?: 'Batch' | 'Online'): Promise<ChunkResponse>;
export declare function selectRelevantChunks(chunks: Chunk[], queryEmbedding: number[], maxTokens?: number, minRelevance?: number): string;
export declare function selectTopChunks(chunks: Chunk[], maxTokens?: number): string;
export declare function estimateTokens(text: string): number;
export declare function getQueryEmbedding(token: string, query: string): Promise<number[]>;
