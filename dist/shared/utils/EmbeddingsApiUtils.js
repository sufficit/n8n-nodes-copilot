"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeEmbeddingsRequest = executeEmbeddingsRequest;
exports.executeEmbeddingsRequestSimple = executeEmbeddingsRequestSimple;
const GitHubCopilotEndpoints_1 = require("./GitHubCopilotEndpoints");
async function executeEmbeddingsRequest(oauthToken, requestBody, enableRetry = true, maxRetries = 3) {
    let lastError = null;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(GitHubCopilotEndpoints_1.GitHubCopilotEndpoints.getEmbeddingsUrl(), {
                method: "POST",
                headers: GitHubCopilotEndpoints_1.GitHubCopilotEndpoints.getEmbeddingsHeaders(oauthToken),
                body: JSON.stringify(requestBody),
            });
            if (!response.ok) {
                const errorText = await response.text();
                if (GitHubCopilotEndpoints_1.GitHubCopilotEndpoints.isTpmQuotaError(response.status) &&
                    enableRetry &&
                    attempt < maxRetries) {
                    const delay = GitHubCopilotEndpoints_1.GitHubCopilotEndpoints.getRetryDelay(attempt + 1);
                    console.log(`Embeddings attempt ${attempt + 1} failed with ${response.status}, retrying in ${delay}ms...`);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                    continue;
                }
                throw new Error(`Embeddings API Error ${response.status}: ${errorText}`);
            }
            const data = (await response.json());
            return data;
        }
        catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            if (attempt < maxRetries && enableRetry) {
                const delay = GitHubCopilotEndpoints_1.GitHubCopilotEndpoints.getRetryDelay(attempt + 1);
                console.log(`Embeddings attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
                await new Promise((resolve) => setTimeout(resolve, delay));
                continue;
            }
            throw lastError;
        }
    }
    throw lastError || new Error("Maximum retry attempts exceeded for embeddings request");
}
async function executeEmbeddingsRequestSimple(oauthToken, requestBody) {
    const response = await fetch(GitHubCopilotEndpoints_1.GitHubCopilotEndpoints.getEmbeddingsUrl(), {
        method: "POST",
        headers: GitHubCopilotEndpoints_1.GitHubCopilotEndpoints.getEmbeddingsHeaders(oauthToken),
        body: JSON.stringify(requestBody),
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Embeddings API Error ${response.status}: ${errorText}`);
    }
    return (await response.json());
}
