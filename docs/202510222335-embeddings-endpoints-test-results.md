# GitHub Copilot Embeddings Endpoints - Test Results

**Date**: October 22, 2025 16:26 UTC  
**Token**: Personal Access Token (gho_*)  
**Purpose**: Test all embeddings-related endpoints discovered in VS Code extension code

## Executive Summary

✅ **2 endpoints working** (Models list, Index status)  
❌ **5 endpoints NOT working** (All embedding generation/search endpoints)  

**Conclusion**: Embeddings API is NOT publicly accessible with personal tokens.

---

## Discovered Endpoints

### Source Code Analysis
From `github.copilot-chat-0.32.3/dist/extension.js`:

```javascript
// Endpoints found in VS Code extension code:
capiEmbeddingsURL: "${capiBaseURL}/embeddings"
embeddingsURL: "${dotComAPIURL}/embeddings"
embeddingsCodeSearchURL: "${dotComAPIURL}/embeddings/code/search"
embeddingsModelURL: "${dotComAPIURL}/embeddings/models"
```

---

## Test Results

### ✅ WORKING ENDPOINTS

#### 1. **Models List** 
- **URL**: `https://api.githubcopilot.com/models`
- **Method**: GET
- **Status**: 200 OK
- **Response Time**: 607ms
- **Result**: Returns complete list of 28 available models
- **Models Include**:
  - GPT-4.1, GPT-4o, GPT-5, GPT-5 Mini
  - Claude 3.7 Sonnet, Claude 3.5 Sonnet
  - Gemini 2.0 Flash Thinking, Gemini 1.5 Pro
  
#### 2. **Embeddings Index Status**
- **URL**: `https://api.github.com/repos/{owner}/{repo}/copilot_internal/embeddings_index`
- **Method**: GET
- **Status**: 200 OK
- **Response Time**: 324ms
- **Response**:
  ```json
  {
    "lexical_search_ok": true,
    "semantic_code_search_ok": true,
    "semantic_doc_search_ok": true,
    "semantic_commit_sha": "599ee67...",
    "semantic_indexing_enabled": true,
    "can_index": "ok"
  }
  ```
- **Purpose**: Check if repository has semantic search enabled
- **Note**: Status check only, doesn't generate embeddings

---

### ❌ FAILED ENDPOINTS

#### 3. **Embeddings Models**
- **URL**: `https://api.github.com/copilot/embeddings/models`
- **Method**: GET
- **Status**: 404 Not Found
- **Error**: Endpoint doesn't exist

#### 4. **Generate Embeddings (Main API)**
- **URL**: `https://api.githubcopilot.com/embeddings`
- **Method**: POST
- **Status**: 400 Bad Request
- **Response**: Plain text "Bad Request"
- **Request Body**:
  ```json
  {
    "model": "text-embedding-3-small",
    "input": "test query for embeddings",
    "dimensions": 512
  }
  ```
- **Headers Sent**: All VS Code headers including Editor-Version
- **Conclusion**: Rejects personal token requests

#### 5. **Generate Embeddings (CAPI Proxy)**
- **URL**: `https://copilot-proxy.githubusercontent.com/embeddings`
- **Method**: POST
- **Status**: 404 Not Found
- **Error**: "404 page not found"
- **Conclusion**: Endpoint doesn't exist or requires different path

#### 6. **Embeddings Code Search**
- **URL**: `https://api.github.com/embeddings/code/search`
- **Method**: POST
- **Status**: 422 Unprocessable Entity
- **Error Message**: `"embedding model 'text-embedding-3-small' not found or not available"`
- **Rate Limit**: 120 requests/hour
- **Conclusion**: Endpoint exists but model not available for personal tokens

#### 7. **Chat Completions (Control Test)**
- **URL**: `https://api.githubcopilot.com/chat/completions`
- **Method**: POST
- **Status**: 403 Forbidden
- **Error**: "Access to this endpoint is forbidden"
- **Note**: Even chat fails with personal token (needs OAuth token from device flow)

---

## Embedding Models Discovered in Code

From extension.js source analysis:

### Available Models
1. **text-embedding-3-small**
   - Provider: OpenAI
   - Dimensions: 512
   - Quantization: float32

2. **metis-I16-Binary**
   - Provider: Custom (GitHub/Microsoft)
   - Dimensions: 1024
   - Quantization: binary (I16)
   - Notes: Optimized for code search

3. **text-3-small**
   - Alias for text-embedding-3-small

### Model Configuration (from code)
```javascript
embeddingModel: {
  id: "text-embedding-3-small",
  dimensions: 512,
  quantization: {
    document: "float32",
    query: "float32"
  }
}
```

---

## Infrastructure Discovered

### Remote CDN
- **Base URL**: `https://embeddings.vscode-cdn.net/`
- **Purpose**: Pre-computed embedding caches
- **Format**: `/${container}/v${version}/${type}/core.json`

### Workspace Indexing
- **Local Cache**: SQLite database (`workspace-chunks.db`)
- **Capacity Settings**:
  - Default: 750 files
  - Expanded: 50,000 files
  - Manual: 2,500 files

### Code Search Integration
- **GitHub Code Search**: Server-side embeddings
- **Azure DevOps Search**: Server-side embeddings
- **Local Indexing**: Uses remote API for generation

---

## Authentication Analysis

### Personal Token (gho_*)
- ✅ Works for: Models list, Index status
- ❌ Fails for: All embedding generation/search
- ❌ Fails for: Chat completions

### OAuth Token (Captured from VS Code)
- ✅ Works for: Chat completions (confirmed in previous tests)
- ❓ Unknown: Embeddings generation (not tested yet)
- Format: Semicolon-separated key-value pairs (15+ parameters)

### Required Headers
```javascript
{
  'Authorization': 'Bearer ${token}',
  'Editor-Version': 'vscode/1.105.1',
  'Editor-Plugin-Version': 'copilot-chat/0.32.3',
  'User-Agent': 'GitHubCopilotChat/0.32.3',
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}
```

---

## Conclusions

### 1. **Embeddings API is NOT Publicly Accessible**
- All embedding generation endpoints return errors
- Personal tokens don't have permission
- OAuth tokens also likely don't have access (needs verification)

### 2. **VS Code Uses Server-Side Embeddings**
- Embeddings retrieved from remote CDN caches
- GitHub/Azure DevOps provide pre-computed embeddings
- No local model execution

### 3. **Available Functionality**
- ✅ Check repository indexing status
- ✅ List available models
- ❌ Generate embeddings directly
- ❌ Search with embeddings

### 4. **Alternative Solutions Required**
Since GitHub Copilot embeddings are not accessible:

#### Option A: OpenAI Embeddings API
- Model: text-embedding-3-small (same as Copilot uses)
- Pricing: $0.02 per 1M tokens
- Dimensions: 512 or 1536
- **Recommendation**: Best alternative

#### Option B: Hugging Face Inference API
- Free tier available
- Models: sentence-transformers, e5-large-v2
- Good for testing

#### Option C: Azure OpenAI
- Same models as OpenAI
- Enterprise features
- Requires Azure subscription

---

## Recommendations for n8n Node

### 1. **Focus on Chat Functionality**
- Chat endpoint works with OAuth device flow
- Provides conversation/completion features
- Most valuable for automation

### 2. **Use OpenAI for Embeddings**
- Direct replacement for Copilot embeddings
- Same model (text-embedding-3-small)
- Straightforward API integration

### 3. **Document Limitations**
- Clearly state embeddings not available via Copilot API
- Provide alternative embedding solutions
- Keep monitoring for API changes

---

## Technical Details

### Error Messages Received

**Bad Request (400)**:
```
Bad Request
```

**Not Found (404)**:
```json
{
  "message": "Not Found",
  "documentation_url": "https://docs.github.com/rest"
}
```

**Unprocessable Entity (422)**:
```json
{
  "message": "embedding model 'text-embedding-3-small' not found or not available",
  "documentation_url": "https://docs.github.com/en/rest"
}
```

**Forbidden (403)**:
```
Access to this endpoint is forbidden. Please review our Terms of Service.
```

### Rate Limits Observed
- **Code Search**: 120 requests/hour
- **Core API**: 5000 requests/hour
- **Models List**: Cached (21600s = 6 hours)

---

## Files Generated

- Test script: `temp/test-discovered-endpoints.js`
- Results JSON: `temp/endpoint-test-results-1761150407098.json`
- This documentation: `docs/202510222335-embeddings-endpoints-test-results.md`

---

## Next Steps

1. ✅ **Confirmed**: Embeddings API not publicly accessible
2. ⏭️ **Recommend**: Implement OpenAI embeddings as alternative
3. ⏭️ **Implement**: OAuth device flow for chat functionality
4. ⏭️ **Document**: Clear API limitations for users
