import { GitHubCopilotEndpoints } from './GitHubCopilotEndpoints';

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

/**
 * Chunk a file using GitHub Copilot API
 */
export async function chunkFile(
	token: string,
	fileContent: string,
	embeddings = true,
	qos: 'Batch' | 'Online' = 'Online',
): Promise<ChunkResponse> {
	const url = 'https://api.githubcopilot.com/chunks';
	const headers = GitHubCopilotEndpoints.getAuthHeaders(token, true);

	const requestBody: ChunkRequest = {
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

	const data = (await response.json()) as ChunkResponse;
	console.log(`✅ Chunked into ${data.chunks.length} chunks`);

	return data;
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
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

/**
 * Select the most relevant chunks based on query embedding
 */
export function selectRelevantChunks(
	chunks: Chunk[],
	queryEmbedding: number[],
	maxTokens = 10000,
	minRelevance = 0.5,
): string {
	if (!chunks.length) {
		return '';
	}

	const rankedChunks = chunks
		.filter((chunk) => chunk.embedding)
		.map((chunk) => ({
			chunk,
			relevance: cosineSimilarity(chunk.embedding!, queryEmbedding),
		}))
		.filter((item) => item.relevance >= minRelevance)
		.sort((a, b) => b.relevance - a.relevance);

	const selectedChunks: string[] = [];
	let totalTokens = 0;

	for (const item of rankedChunks) {
		const chunkTokens = Math.ceil(item.chunk.content.length / 4);
		if (totalTokens + chunkTokens > maxTokens) {
			break;
		}
		selectedChunks.push(item.chunk.content);
		totalTokens += chunkTokens;
		console.log(
			`  ✓ Selected chunk (relevance: ${item.relevance.toFixed(3)}, tokens: ~${chunkTokens})`,
		);
	}

	console.log(
		`📊 Selected ${selectedChunks.length}/${rankedChunks.length} chunks (~${totalTokens} tokens)`,
	);

	return selectedChunks.join('\n\n---\n\n');
}

/**
 * Select top chunks by order (without relevance ranking)
 */
export function selectTopChunks(chunks: Chunk[], maxTokens = 10000): string {
	const selectedChunks: string[] = [];
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

/**
 * Estimate token count for text
 */
export function estimateTokens(text: string): number {
	return Math.ceil(text.length / 4);
}

/**
 * Get embedding for a query string
 */
export async function getQueryEmbedding(token: string, query: string): Promise<number[]> {
	const url = 'https://api.githubcopilot.com/embeddings';
	const headers = GitHubCopilotEndpoints.getEmbeddingsHeaders(token);

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

	const data = (await response.json()) as { data: Array<{ embedding: number[] }> };
	return data.data[0].embedding;
}
