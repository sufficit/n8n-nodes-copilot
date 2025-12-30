"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chunkFile = chunkFile;
exports.selectRelevantChunks = selectRelevantChunks;
exports.selectTopChunks = selectTopChunks;
exports.estimateTokens = estimateTokens;
exports.getQueryEmbedding = getQueryEmbedding;
const GitHubCopilotEndpoints_1 = require("./GitHubCopilotEndpoints");
async function chunkFile(token, fileContent, embeddings = true, qos = 'Online') {
    const url = 'https://api.githubcopilot.com/chunks';
    const headers = GitHubCopilotEndpoints_1.GitHubCopilotEndpoints.getAuthHeaders(token, true);
    const requestBody = {
        content: fileContent,
        embed: embeddings,
        qos,
    };
    console.log(`🔪 Chunking file (${fileContent.length} chars, embed=${embeddings}, qos=${qos})`);
    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Chunking API error: ${response.status} ${response.statusText}. ${errorText}`);
    }
    const data = (await response.json());
    console.log(`✅ Chunked into ${data.chunks.length} chunks`);
    return data;
}
function cosineSimilarity(a, b) {
    if (a.length !== b.length) {
        throw new Error('Vectors must have same length');
    }
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
function selectRelevantChunks(chunks, queryEmbedding, maxTokens = 10000, minRelevance = 0.5) {
    if (!chunks.length) {
        return '';
    }
    const rankedChunks = chunks
        .filter((chunk) => chunk.embedding)
        .map((chunk) => ({
        chunk,
        relevance: cosineSimilarity(chunk.embedding, queryEmbedding),
    }))
        .filter((item) => item.relevance >= minRelevance)
        .sort((a, b) => b.relevance - a.relevance);
    const selectedChunks = [];
    let totalTokens = 0;
    for (const item of rankedChunks) {
        const chunkTokens = Math.ceil(item.chunk.content.length / 4);
        if (totalTokens + chunkTokens > maxTokens) {
            break;
        }
        selectedChunks.push(item.chunk.content);
        totalTokens += chunkTokens;
        console.log(`  ✓ Selected chunk (relevance: ${item.relevance.toFixed(3)}, tokens: ~${chunkTokens})`);
    }
    console.log(`📊 Selected ${selectedChunks.length}/${rankedChunks.length} chunks (~${totalTokens} tokens)`);
    return selectedChunks.join('\n\n---\n\n');
}
function selectTopChunks(chunks, maxTokens = 10000) {
    const selectedChunks = [];
    let totalTokens = 0;
    for (const chunk of chunks) {
        const chunkTokens = Math.ceil(chunk.content.length / 4);
        if (totalTokens + chunkTokens > maxTokens) {
            break;
        }
        selectedChunks.push(chunk.content);
        totalTokens += chunkTokens;
    }
    console.log(`📊 Selected ${selectedChunks.length}/${chunks.length} chunks (~${totalTokens} tokens)`);
    return selectedChunks.join('\n\n---\n\n');
}
function estimateTokens(text) {
    return Math.ceil(text.length / 4);
}
async function getQueryEmbedding(token, query) {
    const url = 'https://api.githubcopilot.com/embeddings';
    const headers = GitHubCopilotEndpoints_1.GitHubCopilotEndpoints.getEmbeddingsHeaders(token);
    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            input: [query],
            model: 'text-embedding-3-small',
        }),
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Embeddings API error: ${response.status} ${response.statusText}. ${errorText}`);
    }
    const data = (await response.json());
    return data.data[0].embedding;
}
