export interface EmbeddingResponse {
    object: string;
    data: Array<{
        object: string;
        index: number;
        embedding: number[];
    }>;
    model: string;
    usage: {
        prompt_tokens: number;
        total_tokens: number;
    };
}
export interface EmbeddingRequest {
    model: string;
    input: string[];
    dimensions?: number;
    encoding_format?: "float" | "base64";
    user?: string;
}
export declare function executeEmbeddingsRequest(oauthToken: string, requestBody: EmbeddingRequest, enableRetry?: boolean, maxRetries?: number): Promise<EmbeddingResponse>;
export declare function executeEmbeddingsRequestSimple(oauthToken: string, requestBody: EmbeddingRequest): Promise<EmbeddingResponse>;
