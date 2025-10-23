# Release 3.37.0 - Embeddings Node & Model Type Filtering

**Release Date**: October 22, 2025  
**Version**: 3.37.0

## 🆕 New Features

### 1. GitHub Copilot Embeddings Node

Generate text embeddings using GitHub Copilot's embedding models.

**Features**:
- ✅ Three input modes: Single Text, Batch (Array), From Field
- ✅ Dynamic model discovery from your subscription
- ✅ Custom model name input support
- ✅ Custom dimensions support (512-1536 for compatible models)
- ✅ Batch processing for efficiency
- ✅ Automatic retry with exponential backoff
- ✅ TPM quota error handling

**Available Models**:
- `text-embedding-3-small` - Latest model with custom dimensions (recommended)
- `text-embedding-ada-002` - Legacy model (1536D fixed)
- `text-embedding-3-small-inference` - Optimized inference variant

**Use Cases**:
- Semantic search
- Document similarity
- Text clustering and classification
- RAG (Retrieval-Augmented Generation) systems
- Vector databases population

**Example Workflow**:
```
[Input Documents] → [GitHub Copilot Embeddings] → [Vector Database]
```

---

### 2. Model Type Filtering

Models are now automatically filtered by type (chat vs embeddings).

**Improvements**:
- ✅ **Chat API Node** → Shows only chat models (GPT, Claude, Gemini, etc.)
- ✅ **Embeddings Node** → Shows only embedding models (text-embedding-*)
- ✅ Clean, focused dropdown lists
- ✅ No more confusion with mixed model types

**Technical Details**:
- Models filtered by `capabilities.type` property
- Separate loading functions per model type
- Cache maintained per user token

---

### 3. Enhanced Model Discovery

**Custom Model Input**:
- Both Chat API and Embeddings nodes now support custom model name input
- Select "✏️ Enter Custom Model Name" from dropdown
- Useful for new/beta models not yet in discovery list

**Smart Cache Behavior**:
- ✅ Cache only updates on successful API fetch
- ✅ Uses previous cache if discovery fails
- ✅ No automatic fallback to hardcoded models
- ✅ User maintains full control

**Cache Strategy**:
```
Discovery Success → Update cache
Discovery Failure + Cache exists → Use previous cache
Discovery Failure + No cache → Manual input only
```

---

### 4. Embedding Models Testing

New test function in **GitHub Copilot Test** node.

**"Test Embedding Models" Operation**:
- Tests all available embedding models
- 3 test iterations per model
- Comprehensive metrics:
  - Success rate
  - Response time
  - Vector dimensions
  - Token consumption
- Detailed report with recommendations

**Use Case**:
Validate which embedding models are available and working in your subscription before building workflows.

---

## 🔧 Technical Changes

### Files Modified

**New Files**:
- `nodes/GitHubCopilotEmbeddings/GitHubCopilotEmbeddings.node.ts` (484 lines)

**Updated Files**:
- `shared/utils/DynamicModelsManager.ts` - Added `filterModelsByType()`
- `shared/models/DynamicModelLoader.ts` - Added `loadAvailableEmbeddingModels()`
- `shared/utils/GitHubCopilotEndpoints.ts` - Added EMBEDDINGS endpoint
- `nodes/GitHubCopilotTest/GitHubCopilotTest.node.ts` - Added `testEmbeddingModels()`
- `package.json` - Registered new embeddings node

### Architecture

```
DynamicModelsManager
├── getAvailableModels() → All models (cached)
├── filterModelsByType() → Filter by type (NEW)
└── modelsToN8nOptions() → Convert to n8n format

DynamicModelLoader
├── loadAvailableModels() → Chat models only
└── loadAvailableEmbeddingModels() → Embedding models only (NEW)

Nodes
├── GitHubCopilotChatAPI → Uses chat models
├── GitHubCopilotEmbeddings → Uses embedding models (NEW)
└── GitHubCopilotTest → Can test both types
```

---

## 📊 Comparison: Before vs After

### Model Dropdown (Chat API)

**Before 3.37.0**:
```
Model: [28 mixed models]
  - GPT-4o
  - Claude 3.5 Sonnet
  - text-embedding-3-small  ← Embedding model (shouldn't be here)
  - Gemini 2.0 Flash
  - text-embedding-ada-002  ← Embedding model (shouldn't be here)
  - ...
```

**After 3.37.0**:
```
Model: [24 chat models only]
  - ✏️ Enter Custom Model Name
  - GPT-4o
  - Claude 3.5 Sonnet
  - Gemini 2.0 Flash
  - o1-preview
  - ...
(No embedding models - clean list!)
```

### Model Dropdown (Embeddings)

**After 3.37.0**:
```
Model: [3-4 embedding models only]
  - ✏️ Enter Custom Model Name
  - text-embedding-3-small
  - text-embedding-ada-002
  - text-embedding-3-small-inference
(Only embedding models - focused list!)
```

---

## 🚀 Migration Guide

### For Existing Users

No breaking changes! Existing workflows continue working.

### For New Embeddings Users

1. **Add Embeddings Node**:
   - Search for "GitHub Copilot Embeddings" in n8n
   - Add to your workflow

2. **Configure**:
   - Select model (auto-discovered from your subscription)
   - Choose input mode (single/batch/field)
   - Optionally set custom dimensions

3. **Execute**:
   - Node returns embedding vectors
   - Use with vector databases (Pinecone, Weaviate, etc.)

### Example: Semantic Search Setup

```
[Read Documents] 
  ↓
[GitHub Copilot Embeddings] (Input Mode: From Field)
  ↓
[Pinecone Vector Store] (Insert)
  ↓
[Done]
```

---

## 🐛 Bug Fixes

None in this release (feature-only release).

---

## ⚠️ Known Limitations

1. **Embedding Models Availability**:
   - Depends on your GitHub Copilot subscription type
   - Some models may require specific subscription plans

2. **Custom Dimensions**:
   - Only supported by `text-embedding-3-small`
   - Other models use fixed dimensions (1536)

3. **Batch Size**:
   - API limits apply per request
   - Recommend testing with small batches first

---

## 📝 Notes

### Model Discovery

- Models are cached for 1 hour per user
- Force refresh available via "Refresh Models Cache" in Test node
- Minimum refresh interval: 5 minutes (prevents API spam)

### Custom Model Input

- Useful for beta models not yet in official list
- Example: `text-embedding-3-large` (if/when released)
- Validation happens at runtime

### Cache Strategy

- Previous cache kept if new discovery fails
- No hardcoded fallback models
- User always in control of model selection

---

## 🔗 Related Links

- [Embeddings Usage Guide](./202510221645-github-copilot-embeddings-complete-guide.md)
- [Models API Documentation](./USAGE-github-copilot-models-api.md)
- [GitHub Repository](https://github.com/sufficit/n8n-nodes-github-copilot)

---

## 👥 Contributors

- [@sufficit](https://github.com/sufficit)

---

## 📦 Package Information

**Package**: `n8n-nodes-github-copilot`  
**Version**: 3.37.0  
**NPM**: https://www.npmjs.com/package/n8n-nodes-github-copilot

---

**Happy Embedding! 🎉**
