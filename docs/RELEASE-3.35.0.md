# Release Notes - Version 3.35.0

**Release Date:** October 22, 2025  
**Version:** 3.35.0

## 🎯 Major Features

### 1. **All Models Now Visible** 🌟
- **Removed model filtering** - Now shows ALL 38+ models from GitHub Copilot API
- **Previously**: Only 19 models with `model_picker_enabled: true`
- **Now**: All models including specific versions, embeddings, and legacy models
- **Benefit**: Access to more specialized models and specific versions

### 2. **Capability Badges System** 🏷️
Each model now displays visual indicators showing its capabilities:

| Badge | Capability | Description |
|-------|-----------|-------------|
| 🔄 | **Streaming** | Supports real-time streaming responses |
| 🔧 | **Tools** | Can call external functions/tools |
| 👁️ | **Vision** | Can process images |
| 📋 | **Structured** | Supports structured JSON outputs |
| ⚡ | **Parallel** | Can execute multiple tool calls in parallel |
| 🧠 | **Reasoning** | Has extended thinking capabilities |

### 3. **Enhanced Model Information** 📊
Each model dropdown option now shows:
- **Model name** with capability badges
- **Context window size** (e.g., "Context: 264k")
- **Max output tokens** (e.g., "Output: 64k")
- **Provider** (Azure OpenAI, Anthropic, Google, xAI, OpenAI)

## 📋 Examples

### Before (v3.34.0):
```
GPT-4o
Claude 3.5 Sonnet
Gemini 2.0 Flash
```

### After (v3.35.0):
```
✏️ Enter Custom Model Name

GPT-5 [🔄 Streaming • 🔧 Tools • 👁️ Vision • 📋 Structured • ⚡ Parallel]
Context: 264k • Output: 64k • Provider: Azure OpenAI

Claude Sonnet 4 [🔄 Streaming • 🔧 Tools • 👁️ Vision • ⚡ Parallel • 🧠 Reasoning]
Context: 216k • Output: 16k • Provider: Anthropic

Gemini 2.5 Pro [🔄 Streaming • 🔧 Tools • 👁️ Vision • ⚡ Parallel • 🧠 Reasoning]
Context: 128k • Output: 64k • Provider: Google

Grok Code Fast 1 [🔄 Streaming • 🔧 Tools • 📋 Structured]
Context: 128k • Output: 64k • Provider: xAI
```

## 📊 Statistics

### Models by Provider:
- **Azure OpenAI**: 24 models (63%)
- **Anthropic**: 8 models (21%)
- **Google**: 2 models (5%)
- **OpenAI**: 3 models (8%)
- **xAI**: 1 model (3%)

### Capabilities Coverage:
- **Streaming**: 35/38 models (92%)
- **Tools**: 29/38 models (76%)
- **Vision**: 22/38 models (58%)
- **Parallel**: 21/38 models (55%)
- **Structured**: 13/38 models (34%)
- **Reasoning**: 2/38 models (5%)

## 🆕 Newly Visible Models

Now accessible in the dropdown (19 additional models):

**OpenAI Specific Versions:**
- `gpt-4o-2024-11-20`
- `gpt-4o-2024-05-13`
- `gpt-4o-2024-08-06`
- `gpt-4.1-2025-04-14`
- `gpt-4-o-preview`
- `gpt-4o-mini-2024-07-18`

**Legacy Models:**
- `gpt-3.5-turbo`
- `gpt-3.5-turbo-0613`
- `gpt-4`
- `gpt-4-0613`
- `gpt-4-0125-preview`

**Embeddings Models:**
- `text-embedding-ada-002`
- `text-embedding-3-small`
- `text-embedding-3-small-inference`

**Specialized Versions:**
- `o3-mini-2025-01-31`
- `o3-mini-paygo`
- `o3-2025-04-16`
- `o4-mini-2025-04-16`
- `gpt-4o-mini`

## 🔧 Technical Changes

### Modified Files:

1. **`shared/utils/DynamicModelsManager.ts`**:
   - Removed `model_picker_enabled` filter
   - Added capability badge generation
   - Enhanced `modelsToN8nOptions()` with rich metadata
   - Updated `CopilotModel` interface with new fields

2. **`shared/models/DynamicModelLoader.ts`**:
   - Updated to return all models without filtering
   - Maintains manual input option at top

### Code Changes:

```typescript
// BEFORE (v3.34.0)
const enabledModels = data.data.filter(
  (model) => model.model_picker_enabled !== false
);
return enabledModels;

// AFTER (v3.35.0)
return data.data; // Return ALL models
```

```typescript
// NEW: Capability badge generation
const badges: string[] = [];
if (supports.streaming) badges.push("🔄 Streaming");
if (supports.tool_calls) badges.push("🔧 Tools");
if (supports.vision) badges.push("👁️ Vision");
if (supports.structured_outputs) badges.push("📋 Structured");
if (supports.parallel_tool_calls) badges.push("⚡ Parallel");
if (supports.max_thinking_budget) badges.push("🧠 Reasoning");

const displayName = `${model.name} [${badges.join(" • ")}]`;
```

## 🎯 Use Cases

### 1. **Specialized Model Selection**
Users can now choose specific model versions for reproducibility:
```
gpt-4o-2024-11-20 → Use exact version for consistent results
o3-mini-paygo → Use pay-as-you-go variant
```

### 2. **Capability-Based Selection**
Quickly identify models with required features:
```
Need Vision? → Look for 👁️ badge
Need Tools? → Look for 🔧 badge
Need Reasoning? → Look for 🧠 badge
```

### 3. **Embeddings Workflows**
Access embedding models directly:
```
text-embedding-3-small → For semantic search
text-embedding-ada-002 → For legacy compatibility
```

## 🔄 Migration Guide

### From v3.34.0 to v3.35.0:

**No breaking changes!** This is a backward-compatible enhancement.

- ✅ Existing workflows continue to work
- ✅ Model IDs remain unchanged
- ✅ All previously available models still available
- ➕ 19 additional models now accessible

## 📚 Documentation

For more information:
- **Model Selection Guide**: See capability badges for quick reference
- **API Documentation**: All models follow GitHub Copilot API specification
- **Testing**: Use `temp/test-model-badges.js` to preview all models

## 🙏 Acknowledgments

This release focuses on:
- **Transparency**: Show all available options
- **Usability**: Visual indicators for quick decision-making
- **Flexibility**: Access to specialized and legacy models

## 🐛 Bug Fixes

- None (pure enhancement release)

## ⚠️ Known Limitations

- Some models may require specific subscription tiers
- Embedding models may not work with chat completion endpoints
- Legacy models (gpt-3.5-turbo) have limited context windows

## 🚀 What's Next (v3.36.0+)

Planned features:
- Model search/filter in dropdown
- Favorite models list
- Custom model groups
- Usage analytics per model

---

**Full Changelog**: https://github.com/sufficit/n8n-nodes-github-copilot/compare/v3.34.0...v3.35.0
