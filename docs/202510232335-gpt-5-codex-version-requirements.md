# GPT-5-Codex Model Version Requirements Discovery

**Date**: 2025-10-23 23:35 UTC  
**Type**: Model-Specific Configuration Discovery  
**Issue**: 400 Bad Request with `gpt-5-codex` model

## 🔍 Problem Identified

### Error Message
```json
{
  "error": {
    "message": "model gpt-5-codex is not supported in this VS Code version. Please update it to version 1.104.1 or newer",
    "code": "model_not_supported_in_version"
  }
}
```

### Root Cause
The `gpt-5-codex` model requires **specific VS Code version headers** to be sent with the API request. GitHub Copilot API validates these headers and rejects requests that don't meet the minimum version requirements.

## 📋 Model Requirements

### From models.json Analysis

```json
{
  "id": "gpt-5-codex",
  "name": "GPT-5-Codex (Preview)",
  "vendor": "OpenAI",
  "preview": true,
  "supported_endpoints": ["/responses"],
  "capabilities": {
    "family": "gpt-5-codex",
    "limits": {
      "max_context_window_tokens": 200000,
      "max_output_tokens": 64000
    }
  }
}
```

**Key Findings:**
1. ✅ Model is in **preview** mode (`preview: true`)
2. ✅ Only supports `/responses` endpoint (NOT `/chat/completions`)
3. ❌ Requires **minimum VS Code version 1.104.1**
4. ❌ Requires specific version headers

## 🔧 Required Headers

### Current Implementation (Generic)
```typescript
headers: {
  "Authorization": `Bearer ${token}`,
  "Content-Type": "application/json",
  "Accept": "application/json",
  "Editor-Version": "vscode/1.95.0",      // ❌ TOO OLD for gpt-5-codex
  "Editor-Plugin-Version": "copilot/1.0.0",
  "User-Agent": "GitHub-Copilot/1.0 (n8n-node)"
}
```

### Required for gpt-5-codex
```typescript
headers: {
  "Authorization": `Bearer ${token}`,
  "Content-Type": "application/json",
  "Accept": "application/json",
  "Editor-Version": "vscode/1.104.1",     // ✅ MINIMUM VERSION
  "Editor-Plugin-Version": "copilot/1.0.0",
  "User-Agent": "GitHub-Copilot/1.0 (n8n-node)"
}
```

## 🎯 Model-Specific Requirements

### By Model Family

| Model | Min VS Code Version | Endpoint | Special Headers |
|-------|---------------------|----------|-----------------|
| `gpt-4o`, `gpt-4.1`, `gpt-5-mini`, `gpt-5` | 1.95.0 | `/chat/completions` or `/responses` | Standard |
| `gpt-5-codex` | **1.104.1** | `/responses` only | Version-specific |
| `o3`, `o3-mini`, `o4-mini` | 1.95.0 | `/chat/completions` or `/responses` | Standard |
| Claude models | 1.95.0 | `/chat/completions` | Standard |
| Gemini models | 1.95.0 | `/chat/completions` | Standard |

### Preview Models (Extra Requirements)

All models with `preview: true` may have:
- Minimum version requirements
- Endpoint restrictions
- Additional validation

## 💡 Solution Strategy

### 1. Model-Specific Header Configuration

Create a configuration map for models with special requirements:

```typescript
const MODEL_VERSION_REQUIREMENTS: Record<string, {
  minVSCodeVersion: string;
  supportedEndpoints: string[];
  additionalHeaders?: Record<string, string>;
}> = {
  "gpt-5-codex": {
    minVSCodeVersion: "1.104.1",
    supportedEndpoints: ["/responses"],
    additionalHeaders: {
      // Any additional headers if needed
    }
  },
  // Add more models with special requirements
};
```

### 2. Dynamic Header Generation

```typescript
function getHeadersForModel(model: string, token: string): Record<string, string> {
  const modelRequirements = MODEL_VERSION_REQUIREMENTS[model];
  const vsCodeVersion = modelRequirements?.minVSCodeVersion || "1.95.0";
  
  return {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Editor-Version": `vscode/${vsCodeVersion}`,
    "Editor-Plugin-Version": "copilot/1.0.0",
    "User-Agent": "GitHub-Copilot/1.0 (n8n-node)",
    ...(modelRequirements?.additionalHeaders || {})
  };
}
```

### 3. Endpoint Validation

```typescript
function validateModelEndpoint(model: string, endpoint: string): void {
  const requirements = MODEL_VERSION_REQUIREMENTS[model];
  
  if (requirements && requirements.supportedEndpoints) {
    if (!requirements.supportedEndpoints.includes(endpoint)) {
      throw new Error(
        `Model ${model} does not support endpoint ${endpoint}. ` +
        `Supported endpoints: ${requirements.supportedEndpoints.join(", ")}`
      );
    }
  }
}
```

## 📝 Implementation Plan

### Phase 1: Add Model Configuration
1. Create `shared/models/ModelVersionRequirements.ts`
2. Extract requirements from `models.json` (`preview`, `supported_endpoints`)
3. Define minimum version requirements per model

### Phase 2: Update Shared Utilities
1. Modify `GitHubCopilotEndpoints.getAuthHeaders()` to accept model parameter
2. Add dynamic version header generation
3. Add endpoint validation function

### Phase 3: Update Nodes
1. **GitHubCopilotOpenAI**: Pass model to header generation
2. **GitHubCopilotChatAPI**: Pass model to header generation
3. **GitHubCopilotChatModel**: Pass model to header generation

### Phase 4: Error Handling
1. Detect version requirement errors (400 with "model_not_supported_in_version")
2. Provide clear error messages with minimum version info
3. Suggest correct configuration to user

## 🧪 Testing Strategy

### Test Cases
1. ✅ Test `gpt-5-codex` with version 1.95.0 (should fail with clear message)
2. ✅ Test `gpt-5-codex` with version 1.104.1 (should succeed)
3. ✅ Test standard models with both versions (should work)
4. ✅ Test preview models vs non-preview models
5. ✅ Test endpoint validation (`/responses` vs `/chat/completions`)

### Test Script Location
`./temp/test-gpt-5-codex-versions.js`

## 📊 Models Requiring Special Configuration

### From models.json Analysis

**Preview Models:**
- `gpt-5-codex` - Requires vscode/1.104.1, `/responses` only
- `o3` - Preview, but works with standard headers
- `o4-mini` - Preview, but works with standard headers

**Non-Preview Models:**
- All others use standard headers and both endpoints

## 🎯 Expected Benefits

1. **Correct Model Usage**: Each model uses appropriate headers
2. **Better Error Messages**: Users know exactly what's wrong
3. **Future-Proof**: Easy to add new model requirements
4. **Endpoint Routing**: Automatic selection of correct endpoint per model

## 📋 Files to Modify

### New Files
- `shared/models/ModelVersionRequirements.ts` - Model requirements config

### Modified Files
- `shared/utils/GitHubCopilotEndpoints.ts` - Dynamic header generation
- `shared/utils/GitHubCopilotApiUtils.ts` - Use model-aware headers
- `nodes/GitHubCopilotOpenAI/GitHubCopilotOpenAI.node.ts` - Pass model to API utils
- `nodes/GitHubCopilotChatAPI/GitHubCopilotChatAPI.node.ts` - Pass model to API utils
- `nodes/GitHubCopilotChatModel/GitHubCopilotChatModel.node.ts` - Pass model to API utils

## 🔮 Future Considerations

1. **Auto-Discovery**: Parse `models.json` at runtime for requirements
2. **Version Negotiation**: Try multiple versions if one fails
3. **Fallback Models**: Suggest alternatives when model unavailable
4. **Cache Requirements**: Don't re-parse requirements on every request

---

**Status**: ✅ Root cause identified - Implementation ready to begin
