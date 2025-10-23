/**
 * Embeddings API Utilities
 * 
 * Shared functions for making embeddings API requests.
 * Used by both GitHubCopilotEmbeddings node and GitHubCopilotTest node.
 */

import { GitHubCopilotEndpoints, GITHUB_COPILOT_API } from "./GitHubCopilotEndpoints";

/**
 * Embedding Response from GitHub Copilot API
 */
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

/**
 * Embedding Request Body
 */
export interface EmbeddingRequest {
  model: string;
  input: string[];
  dimensions?: number;
  encoding_format?: "float" | "base64";
  user?: string;
}

/**
 * Execute embeddings request with retry logic
 * 
 * @param oauthToken - OAuth token for authentication
 * @param requestBody - Embeddings request body
 * @param enableRetry - Whether to enable retry on TPM quota errors
 * @param maxRetries - Maximum number of retry attempts
 * @returns Embedding response
 */
export async function executeEmbeddingsRequest(
  oauthToken: string,
  requestBody: EmbeddingRequest,
  enableRetry = true,
  maxRetries = 3,
): Promise<EmbeddingResponse> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(
        GitHubCopilotEndpoints.getEmbeddingsUrl(),
        {
          method: "POST",
          headers: GitHubCopilotEndpoints.getEmbeddingsHeaders(oauthToken),
          body: JSON.stringify(requestBody),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();

        // Check if it's a retryable error (TPM quota)
        if (
          GitHubCopilotEndpoints.isTpmQuotaError(response.status) &&
          enableRetry &&
          attempt < maxRetries
        ) {
          const delay = GitHubCopilotEndpoints.getRetryDelay(attempt + 1);
          console.log(
            `Embeddings attempt ${attempt + 1} failed with ${response.status}, retrying in ${delay}ms...`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        throw new Error(
          `Embeddings API Error ${response.status}: ${errorText}`,
        );
      }

      const data = (await response.json()) as EmbeddingResponse;
      return data;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries && enableRetry) {
        const delay = GitHubCopilotEndpoints.getRetryDelay(attempt + 1);
        console.log(`Embeddings attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      throw lastError;
    }
  }

  throw lastError || new Error("Maximum retry attempts exceeded for embeddings request");
}

/**
 * Simple embeddings request without retry logic
 * 
 * @param oauthToken - OAuth token for authentication
 * @param requestBody - Embeddings request body
 * @returns Embedding response
 */
export async function executeEmbeddingsRequestSimple(
  oauthToken: string,
  requestBody: EmbeddingRequest,
): Promise<EmbeddingResponse> {
  const response = await fetch(
    GitHubCopilotEndpoints.getEmbeddingsUrl(),
    {
      method: "POST",
      headers: GitHubCopilotEndpoints.getEmbeddingsHeaders(oauthToken),
      body: JSON.stringify(requestBody),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Embeddings API Error ${response.status}: ${errorText}`,
    );
  }

  return (await response.json()) as EmbeddingResponse;
}
