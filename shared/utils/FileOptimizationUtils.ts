import { estimateTokens } from './FileChunkingApiUtils';

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

/**
 * Estimate tokens for a file based on size
 */
export function estimateFileTokens(fileSize: number, isBase64 = true): number {
	const encodedSize = isBase64 ? fileSize * 1.33 : fileSize;
	return Math.ceil(encodedSize / 4);
}

/**
 * Select the optimal file processing mode based on file size and model constraints
 */
export function selectFileProcessingMode(options: FileOptimizationOptions): OptimizationResult {
	const { model, fileSize, mode, maxContextUsage = 0.5 } = options;

	const maxContextTokens = 128000;
	const maxAllowedTokens = Math.floor(maxContextTokens * maxContextUsage);
	const estimatedTokens = estimateFileTokens(fileSize, true);
	const fitsInContext = estimatedTokens <= maxAllowedTokens;

	console.log(`📊 File Optimization Analysis:`);
	console.log(`  File size: ${(fileSize / 1024).toFixed(2)} KB`);
	console.log(`  Estimated tokens: ${estimatedTokens.toLocaleString()}`);
	console.log(`  Max allowed (${(maxContextUsage * 100).toFixed(0)}%): ${maxAllowedTokens.toLocaleString()}`);
	console.log(`  Model context: ${maxContextTokens.toLocaleString()} tokens`);

	if (mode !== 'auto') {
		if (mode === 'direct' && !fitsInContext) {
			console.warn(`⚠️ Warning: Direct mode requested but file exceeds token limit`);
		}
		return {
			mode: mode as 'direct' | 'chunking' | 'summarize',
			reason: `User requested ${mode} mode`,
			estimatedTokens,
			maxAllowedTokens,
			fitsInContext,
		};
	}

	if (estimatedTokens < maxAllowedTokens * 0.3) {
		return {
			mode: 'direct',
			reason: `File is small (${estimatedTokens.toLocaleString()} tokens < 30% of limit)`,
			estimatedTokens,
			maxAllowedTokens,
			fitsInContext: true,
		};
	} else if (estimatedTokens < maxAllowedTokens * 0.8) {
		return {
			mode: 'chunking',
			reason: `File is medium-sized (${estimatedTokens.toLocaleString()} tokens, 30-80% of limit) - chunking recommended`,
			estimatedTokens,
			maxAllowedTokens,
			fitsInContext: true,
		};
	} else if (fitsInContext) {
		return {
			mode: 'chunking',
			reason: `File is large (${estimatedTokens.toLocaleString()} tokens, >80% of limit) - chunking strongly recommended`,
			estimatedTokens,
			maxAllowedTokens,
			fitsInContext: true,
		};
	} else {
		return {
			mode: 'summarize',
			reason: `File exceeds token limit (${estimatedTokens.toLocaleString()} > ${maxAllowedTokens.toLocaleString()} tokens) - summarization required`,
			estimatedTokens,
			maxAllowedTokens,
			fitsInContext: false,
		};
	}
}

/**
 * Get optimal chunk settings for a model
 */
export function getOptimalChunkSettings(
	model: string,
	maxContextUsage = 0.5,
): {
	maxChunks: number;
	maxTokensPerChunk: number;
	totalMaxTokens: number;
} {
	const maxContextTokens = 128000;
	const totalMaxTokens = Math.floor(maxContextTokens * maxContextUsage);
	const maxChunks = 10;
	const maxTokensPerChunk = Math.floor(totalMaxTokens / maxChunks);

	return {
		maxChunks,
		maxTokensPerChunk,
		totalMaxTokens,
	};
}

/**
 * Compress text by removing extra whitespace
 */
export function compressText(text: string): string {
	return text
		.replace(/ {2,}/g, ' ')
		.replace(/\n{3,}/g, '\n\n')
		.replace(/\t/g, ' ')
		.split('\n')
		.map((line) => line.trim())
		.join('\n')
		.trim();
}

/**
 * Truncate text to a token limit
 */
export function truncateToTokenLimit(
	text: string,
	maxTokens: number,
	addEllipsis = true,
): {
	content: string;
	truncated: boolean;
	originalTokens: number;
	finalTokens: number;
} {
	const originalTokens = estimateTokens(text);

	if (originalTokens <= maxTokens) {
		return {
			content: text,
			truncated: false,
			originalTokens,
			finalTokens: originalTokens,
		};
	}

	const maxChars = maxTokens * 4;
	const truncated = text.slice(0, maxChars);
	const ellipsis = addEllipsis ? '\n\n...[truncated]' : '';
	const finalContent = truncated + ellipsis;
	const finalTokens = estimateTokens(finalContent);

	return {
		content: finalContent,
		truncated: true,
		originalTokens,
		finalTokens,
	};
}

/**
 * Get a human-readable file size category
 */
export function getFileSizeCategory(sizeBytes: number): string {
	if (sizeBytes < 10 * 1024) return 'tiny (<10KB)';
	if (sizeBytes < 50 * 1024) return 'small (<50KB)';
	if (sizeBytes < 200 * 1024) return 'medium (<200KB)';
	if (sizeBytes < 500 * 1024) return 'large (<500KB)';
	if (sizeBytes < 1024 * 1024) return 'very large (<1MB)';
	return 'huge (>1MB)';
}

/**
 * Format token count for display
 */
export function formatTokenCount(tokens: number): string {
	if (tokens < 1000) return `${tokens} tokens`;
	if (tokens < 1000000) return `${(tokens / 1000).toFixed(1)}K tokens`;
	return `${(tokens / 1000000).toFixed(2)}M tokens`;
}

/**
 * Calculate token savings from optimization
 */
export function calculateSavings(
	originalTokens: number,
	optimizedTokens: number,
): {
	savedTokens: number;
	savingsPercent: number;
	savingsRatio: string;
} {
	const savedTokens = originalTokens - optimizedTokens;
	const savingsPercent = (savedTokens / originalTokens) * 100;
	const savingsRatio = `${optimizedTokens.toLocaleString()}/${originalTokens.toLocaleString()}`;

	return {
		savedTokens,
		savingsPercent,
		savingsRatio,
	};
}
