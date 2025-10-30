# Files Token Optimization Solution

**Date**: 2025-10-23 23:50 UTC  
**Problem**: Sending files as base64 in message content exceeds token limits  
**Status**: Solution Design Ready

## 🔍 Problem Analysis

### Current Implementation (Token-Heavy)
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Analyze this file"
    },
    {
      "role": "user",
      "content": "data:text/plain;base64,SGVsbG8gV29ybGQ=...[VERY LONG]",
      "type": "file"
    }
  ]
}
```

**Issues:**
- ❌ Large files exceed token limits (128k-200k tokens)
- ❌ Base64 encoding increases size by ~33%
- ❌ Each request re-sends the entire file
- ❌ No file caching or reuse

### Token Consumption Example

| File Size | Base64 Size | Estimated Tokens | Status |
|-----------|-------------|------------------|--------|
| 10 KB | 13.3 KB | ~3,300 | ✅ OK |
| 100 KB | 133 KB | ~33,000 | ⚠️ Warning |
| 500 KB | 665 KB | ~166,000 | ❌ Exceeds limit |
| 1 MB | 1.33 MB | ~333,000 | ❌ Far exceeds |

## 💡 Solution Strategies

### Strategy 1: File Chunking (Recommended)

Use GitHub Copilot's **Chunking API** to process files in smaller pieces.

**Endpoint**: `https://api.githubcopilot.com/chunks` (discovered in docs)

**How it works:**
1. Upload file to chunking endpoint
2. API returns chunks with embeddings
3. Use relevant chunks in chat context
4. Much lower token consumption

**Request Format:**
```json
{
  "content": "file content here",
  "embed": true,
  "qos": "Online"
}
```

**Response:**
```json
{
  "chunks": [
    {
      "content": "chunk 1 text",
      "embedding": [...],
      "metadata": {...}
    }
  ]
}
```

**Benefits:**
- ✅ Only relevant chunks used (10-20% of file)
- ✅ Embeddings for semantic search
- ✅ Works with large files
- ✅ Better context relevance

### Strategy 2: File Summarization

Preprocess large files to extract key information.

**Implementation:**
1. Send file in first request with "summarize" prompt
2. Use summary in subsequent requests
3. Store summary for reuse

**Example Flow:**
```typescript
// Step 1: Summarize
const summaryResponse = await makeRequest({
  messages: [
    { role: "user", content: "Summarize this file in 500 tokens" },
    { role: "user", content: fileData, type: "file" }
  ],
  max_tokens: 1000
});

// Step 2: Use summary
const analysisResponse = await makeRequest({
  messages: [
    { role: "user", content: "Based on this summary: " + summary },
    { role: "user", content: "Answer: " + userQuestion }
  ]
});
```

**Benefits:**
- ✅ Reduces token usage by 80-95%
- ✅ Works with existing API
- ✅ No new endpoints needed
- ⚠️ Requires 2 API calls

### Strategy 3: Text Extraction + Compression

For documents, extract and compress text before sending.

**Processing Pipeline:**
```
PDF/DOCX → Extract Text → Remove Formatting → Compress → Send
```

**Compression Techniques:**
- Remove redundant whitespace
- Truncate to max tokens
- Extract only relevant sections
- Use embeddings to find relevant parts

**Benefits:**
- ✅ Works with any file type
- ✅ User controls compression level
- ✅ Preserves important content
- ⚠️ May lose some context

### Strategy 4: External File Hosting + Reference

Upload file to external service, send reference URL.

**Not Recommended:**
- ❌ GitHub Copilot API doesn't support file URLs
- ❌ Requires external infrastructure
- ❌ Security concerns

## 🎯 Recommended Implementation

### Phase 1: Add File Chunking Support

**New Utility:** `shared/utils/FileChunkingApiUtils.ts`

```typescript
export interface ChunkRequest {
  content: string;
  embed: boolean;
  qos: "Batch" | "Online";
}

export interface ChunkResponse {
  chunks: Array<{
    content: string;
    embedding?: number[];
    start: number;
    end: number;
  }>;
}

export async function chunkFile(
  token: string,
  fileContent: string,
  embeddings = true
): Promise<ChunkResponse> {
  const response = await fetch(
    "https://api.githubcopilot.com/chunks",
    {
      method: "POST",
      headers: getAuthHeaders(token),
      body: JSON.stringify({
        content: fileContent,
        embed: embeddings,
        qos: "Online"
      })
    }
  );
  
  return await response.json();
}

export function selectRelevantChunks(
  chunks: ChunkResponse["chunks"],
  query: string,
  maxTokens = 10000
): string {
  // Use embeddings to find relevant chunks
  // Combine chunks up to maxTokens
  // Return concatenated relevant content
}
```

### Phase 2: Update Nodes with Chunking Option

**Add to `GitHubCopilotOpenAI` and `GitHubCopilotChatAPI`:**

```typescript
{
  displayName: "File Processing",
  name: "fileProcessing",
  type: "options",
  options: [
    {
      name: "Direct (Base64)",
      value: "direct",
      description: "Send file directly as base64 (use for small files)"
    },
    {
      name: "Chunking (Recommended)",
      value: "chunking",
      description: "Process file in chunks (use for large files)"
    },
    {
      name: "Summarize First",
      value: "summarize",
      description: "Summarize file before analysis"
    }
  ],
  default: "chunking"
}
```

### Phase 3: Automatic Mode Selection

```typescript
function selectFileMode(fileSize: number, model: string): string {
  const modelLimits = getModelRequirements(model);
  const maxTokens = modelLimits.limits.max_context_window_tokens;
  const estimatedTokens = estimateFileTokens(fileSize);
  
  if (estimatedTokens < maxTokens * 0.3) {
    return "direct"; // File is small enough
  } else if (estimatedTokens < maxTokens * 0.7) {
    return "chunking"; // Use chunks for medium files
  } else {
    return "summarize"; // File too large, summarize first
  }
}
```

## 📊 Expected Improvements

### Token Usage Comparison

| File Size | Direct (Base64) | Chunking | Summarize | Savings |
|-----------|----------------|----------|-----------|---------|
| 100 KB | 33k tokens | ~5k tokens | ~1k tokens | 85-97% |
| 500 KB | 166k tokens ❌ | ~15k tokens | ~2k tokens | 91-99% |
| 1 MB | 333k tokens ❌ | ~25k tokens | ~3k tokens | 92-99% |
| 5 MB | 1.6M tokens ❌ | ~50k tokens | ~5k tokens | 97-99.7% |

### Cost Savings

Assuming $0.01 per 1k tokens:
- **100 KB file**: $0.33 → $0.05 (85% savings)
- **500 KB file**: Not possible → $0.15 (enables usage)
- **1 MB file**: Not possible → $0.25 (enables usage)

## 🔧 Implementation Plan

### Files to Create

1. **`shared/utils/FileChunkingApiUtils.ts`**
   - Chunking API request functions
   - Chunk selection algorithms
   - Embedding-based relevance scoring

2. **`shared/utils/FileOptimizationUtils.ts`**
   - Auto mode selection
   - Token estimation
   - Compression utilities

### Files to Modify

1. **`nodes/GitHubCopilotOpenAI/GitHubCopilotOpenAI.node.ts`**
   - Add file processing mode selection
   - Implement chunking workflow
   - Add summarization workflow

2. **`nodes/GitHubCopilotChatAPI/GitHubCopilotChatAPI.node.ts`**
   - Add file processing mode selection
   - Implement chunking workflow

3. **`nodes/GitHubCopilotOpenAI/nodeProperties.ts`**
   - Add file processing options
   - Add chunk size configuration

## 🧪 Testing Strategy

### Test Cases

1. **Small Files (< 50 KB)**
   - Direct mode should work
   - Verify no chunking overhead

2. **Medium Files (50-500 KB)**
   - Chunking should activate
   - Verify relevant chunks selected

3. **Large Files (> 500 KB)**
   - Summarization should activate
   - Verify quality of summary

4. **Very Large Files (> 5 MB)**
   - Test chunking limits
   - Verify error handling

### Test Script

**Location:** `./temp/test-file-optimization.js`

```javascript
// Test different file sizes
const testCases = [
  { size: 10 * 1024, expectedMode: "direct" },
  { size: 100 * 1024, expectedMode: "chunking" },
  { size: 1024 * 1024, expectedMode: "summarize" },
];

for (const test of testCases) {
  const mode = selectFileMode(test.size, "gpt-4o");
  console.log(`${test.size} bytes → ${mode} (expected: ${test.expectedMode})`);
}
```

## 📝 User Documentation

### Usage Examples

**Automatic Mode (Recommended):**
```json
{
  "messages": [
    { "role": "user", "content": "Analyze this code" },
    { 
      "role": "user", 
      "content": "data:text/plain;base64,...",
      "type": "file"
    }
  ],
  "fileProcessing": "auto"  // Automatically selects best mode
}
```

**Manual Mode:**
```json
{
  "fileProcessing": "chunking",
  "chunkSettings": {
    "maxChunks": 10,
    "relevanceThreshold": 0.7
  }
}
```

## 🎓 Benefits Summary

1. **Enables Large File Processing**: Files up to 10 MB become usable
2. **Reduces Costs**: 85-99% token savings
3. **Improves Response Quality**: Better context selection
4. **Better User Experience**: Auto mode selection
5. **Flexible**: User can override automatic selection

## 🔮 Future Enhancements

1. **Incremental Processing**: Process files in streaming mode
2. **Smart Caching**: Cache chunks for reuse
3. **Multi-File Support**: Analyze multiple files together
4. **Custom Chunking**: User-defined chunk boundaries

---

**Status**: ✅ Design complete - Ready for implementation  
**Priority**: HIGH - Solves critical token limit issue  
**Estimated Effort**: 8-12 hours implementation + testing
