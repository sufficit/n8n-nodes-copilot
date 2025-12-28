"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.estimateFileTokens = estimateFileTokens;
exports.selectFileProcessingMode = selectFileProcessingMode;
exports.getOptimalChunkSettings = getOptimalChunkSettings;
exports.compressText = compressText;
exports.truncateToTokenLimit = truncateToTokenLimit;
exports.getFileSizeCategory = getFileSizeCategory;
exports.formatTokenCount = formatTokenCount;
exports.calculateSavings = calculateSavings;
const FileChunkingApiUtils_1 = require("./FileChunkingApiUtils");
function estimateFileTokens(fileSize, isBase64 = true) {
    const encodedSize = isBase64 ? fileSize * 1.33 : fileSize;
    return Math.ceil(encodedSize / 4);
}
function selectFileProcessingMode(options) {
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
            mode: mode,
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
    }
    else if (estimatedTokens < maxAllowedTokens * 0.8) {
        return {
            mode: 'chunking',
            reason: `File is medium-sized (${estimatedTokens.toLocaleString()} tokens, 30-80% of limit) - chunking recommended`,
            estimatedTokens,
            maxAllowedTokens,
            fitsInContext: true,
        };
    }
    else if (fitsInContext) {
        return {
            mode: 'chunking',
            reason: `File is large (${estimatedTokens.toLocaleString()} tokens, >80% of limit) - chunking strongly recommended`,
            estimatedTokens,
            maxAllowedTokens,
            fitsInContext: true,
        };
    }
    else {
        return {
            mode: 'summarize',
            reason: `File exceeds token limit (${estimatedTokens.toLocaleString()} > ${maxAllowedTokens.toLocaleString()} tokens) - summarization required`,
            estimatedTokens,
            maxAllowedTokens,
            fitsInContext: false,
        };
    }
}
function getOptimalChunkSettings(model, maxContextUsage = 0.5) {
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
function compressText(text) {
    return text
        .replace(/ {2,}/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/\t/g, ' ')
        .split('\n')
        .map((line) => line.trim())
        .join('\n')
        .trim();
}
function truncateToTokenLimit(text, maxTokens, addEllipsis = true) {
    const originalTokens = (0, FileChunkingApiUtils_1.estimateTokens)(text);
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
    const finalTokens = (0, FileChunkingApiUtils_1.estimateTokens)(finalContent);
    return {
        content: finalContent,
        truncated: true,
        originalTokens,
        finalTokens,
    };
}
function getFileSizeCategory(sizeBytes) {
    if (sizeBytes < 10 * 1024)
        return 'tiny (<10KB)';
    if (sizeBytes < 50 * 1024)
        return 'small (<50KB)';
    if (sizeBytes < 200 * 1024)
        return 'medium (<200KB)';
    if (sizeBytes < 500 * 1024)
        return 'large (<500KB)';
    if (sizeBytes < 1024 * 1024)
        return 'very large (<1MB)';
    return 'huge (>1MB)';
}
function formatTokenCount(tokens) {
    if (tokens < 1000)
        return `${tokens} tokens`;
    if (tokens < 1000000)
        return `${(tokens / 1000).toFixed(1)}K tokens`;
    return `${(tokens / 1000000).toFixed(2)}M tokens`;
}
function calculateSavings(originalTokens, optimizedTokens) {
    const savedTokens = originalTokens - optimizedTokens;
    const savingsPercent = (savedTokens / originalTokens) * 100;
    const savingsRatio = `${optimizedTokens.toLocaleString()}/${originalTokens.toLocaleString()}`;
    return {
        savedTokens,
        savingsPercent,
        savingsRatio,
    };
}
