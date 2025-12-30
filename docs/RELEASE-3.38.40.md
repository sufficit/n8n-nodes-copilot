# Release Notes - v3.38.40

**Release Date**: 2025-12-30  
**Type**: Enhancement + Model Sync  
**Previous Version**: 3.38.39

## 🎯 Summary

Synchronized static model list with GitHub Copilot API data and implemented dynamic vision capability detection. Nodes now prioritize API cache for capability checks, with static list as fallback.

## ✨ New Features

### Dynamic Vision Capability Detection

**Before**: Only checked static model list for vision support  
**After**: Checks API cache first, then static list as fallback

**New DynamicModelsManager Methods**:
```typescript
// Check if model supports vision from API cache
DynamicModelsManager.modelSupportsVision(token, modelId): boolean | null

// Check if model supports tools/function calling
DynamicModelsManager.modelSupportsTools(token, modelId): boolean | null

// Get all capabilities from cache
DynamicModelsManager.getModelCapabilities(token, modelId): {
  vision: boolean;
  tools: boolean;
  streaming: boolean;
  maxContextTokens: number;
  maxOutputTokens: number;
  isPremium: boolean;
} | null

// Get model from cache by ID
DynamicModelsManager.getModelFromCache(token, modelId): CopilotModel | null
```

**Priority Order**:
1. 🥇 **API Cache** - Most accurate, always up-to-date
2. 🥈 **Static List** - Fallback when cache unavailable

## 📋 Updated Model List

### New Models Added (from API)

| Model | Provider | Vision | Context | Output | Category |
|-------|----------|--------|---------|--------|----------|
| `gpt-5.1` | OpenAI | ✅ | 264K | 64K | versatile |
| `gpt-5.2` | OpenAI | ✅ | 264K | 64K | versatile |
| `gpt-5-codex` | OpenAI | ✅ | 400K | 128K | powerful |
| `gpt-5.1-codex` | OpenAI | ✅ | 400K | 128K | powerful |
| `gpt-5.1-codex-mini` | OpenAI | ✅ | 400K | 128K | powerful |
| `gpt-5.1-codex-max` | OpenAI | ✅ | 400K | 128K | powerful |
| `claude-sonnet-4.5` | Anthropic | ✅ | 144K | 16K | versatile |
| `claude-haiku-4.5` | Anthropic | ✅ | 144K | 16K | versatile |
| `claude-opus-4.5` | Anthropic | ✅ | 144K | 16K | powerful |
| `claude-opus-41` | Anthropic | ✅ | 80K | 16K | powerful |
| `gemini-3-pro-preview` | Google | ✅ | 128K | 64K | powerful |
| `gemini-3-flash-preview` | Google | ✅ | 128K | 64K | lightweight |
| `grok-code-fast-1` | **xAI** | ❌ | 128K | 64K | lightweight |

### Updated Model Capabilities

| Model | Change |
|-------|--------|
| `gpt-5` | Context: 128K → 400K, Output: 64K → 128K |
| `gpt-5-mini` | Context: 128K → 264K |
| `claude-sonnet-4` | Context: 128K → 216K |
| `gpt-4o-mini` | Vision: ❌ (confirmed no vision) |

### New Provider: xAI

Added support for **xAI** (Grok) models:
- `grok-code-fast-1` - Fast coding model (no vision)

## 🔧 Technical Changes

### GitHubCopilotModels.ts

```typescript
// New interface field
interface GitHubCopilotModel {
  // ... existing fields
  isPremium?: boolean;  // NEW: Indicates premium subscription required
}

// New manager methods
GitHubCopilotModelsManager.getFreeModels(): GitHubCopilotModel[]
GitHubCopilotModelsManager.getPremiumModels(): GitHubCopilotModel[]

// Updated category types
category: "versatile" | "powerful" | "lightweight" | "reasoning" | ...

// Updated provider types  
provider: "OpenAI" | "Anthropic" | "Google" | "Microsoft" | "xAI"
```

### All Nodes Updated

Vision check flow in ChatModel, ChatAPI, and OpenAI nodes:

```typescript
// BEFORE: Only static list
const modelInfo = GitHubCopilotModelsManager.getModelByValue(model);
const supportsVision = modelInfo?.capabilities?.vision;

// AFTER: API cache first, then static fallback
let supportsVision = DynamicModelsManager.modelSupportsVision(token, model);
if (supportsVision === null) {
  // Fallback to static list
  const modelInfo = GitHubCopilotModelsManager.getModelByValue(model);
  supportsVision = !!(modelInfo?.capabilities?.vision);
}
```

## 📁 Files Changed

- `shared/models/GitHubCopilotModels.ts` - Updated model list and added new methods
- `shared/utils/DynamicModelsManager.ts` - Added capability check methods
- `nodes/GitHubCopilotChatModel/GitHubCopilotChatModel.node.ts` - Dynamic vision check
- `nodes/GitHubCopilotChatAPI/GitHubCopilotChatAPI.node.ts` - Dynamic vision check
- `nodes/GitHubCopilotOpenAI/GitHubCopilotOpenAI.node.ts` - Dynamic vision check

## 🔄 Migration Notes

No breaking changes. The static model list is still used as fallback. For best results:

1. **First API call** populates the cache with accurate model data
2. **Subsequent calls** use cached data for capability checks
3. **Cache expires** after 1 hour, auto-refreshes on next call

## 📊 Default Models Updated

```typescript
export const DEFAULT_MODELS = {
  GENERAL: "gpt-4.1",         // Free, with vision
  CODING: "gpt-5-codex",      // Premium, best for coding
  VISION: "gpt-4o",           // Free, with vision
  VISION_FALLBACK: "gpt-4.1", // Fallback for vision
  REASONING: "o3-mini",       // Best reasoning
  TOOLS: "gpt-4.1",           // Free with tools
  MULTIMODAL: "gemini-2.5-pro",
  FREE: "gpt-4.1",            // Best free model
  PREMIUM: "gpt-5.2"          // Best premium model
};
```
