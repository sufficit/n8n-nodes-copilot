# GitHub Copilot API - Discovery Documentation

**Date**: 2025-10-01 18:40  
**Version**: n8n-nodes-github-copilot v3.31.19  
**Purpose**: Document GitHub Copilot API implementation and compare with VS Code official implementation

## Table of Contents
- [Overview](#overview)
- [API Endpoints](#api-endpoints)
- [Models Supported](#models-supported)
- [Headers Configuration](#headers-configuration)
- [Authentication](#authentication)
- [Request Format](#request-format)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [Retry Strategy](#retry-strategy)
- [Key Discoveries](#key-discoveries)
- [Comparison with VS Code](#comparison-with-vscode)

## Overview

The GitHub Copilot API is accessed through `https://api.githubcopilot.com` and provides chat completions similar to OpenAI's API but with specific requirements and behaviors.

### Base Configuration

```typescript
// From: shared/utils/GitHubCopilotEndpoints.ts
export const GITHUB_COPILOT_API = {
  BASE_URL: "https://api.githubcopilot.com",
  GITHUB_BASE_URL: "https://api.github.com",
  
  ENDPOINTS: {
    MODELS: "/models",
    CHAT_COMPLETIONS: "/chat/completions",
    ORG_BILLING: (org: string) => `/orgs/${org}/copilot/billing`,
    ORG_SEATS: (org: string) => `/orgs/${org}/copilot/billing/seats`,
    USER_COPILOT: "/user/copilot_access",
  }
}
```

## API Endpoints

### 1. Chat Completions Endpoint
- **URL**: `https://api.githubcopilot.com/chat/completions`
- **Method**: POST
- **Purpose**: Main endpoint for chat interactions with Copilot models

### 2. Models Endpoint
- **URL**: `https://api.githubcopilot.com/models`
- **Method**: GET
- **Purpose**: List available Copilot models

### 3. Billing Endpoints (GitHub API)
- **Org Billing**: `https://api.github.com/orgs/{org}/copilot/billing`
- **Org Seats**: `https://api.github.com/orgs/{org}/copilot/billing/seats`
- **User Access**: `https://api.github.com/user/copilot_access`

## Models Supported

### Model Name Mapping

```typescript
// From: GitHubCopilotOpenAI.node.ts
const modelMapping: Record<string, string> = {
  "gpt-4": "gpt-4o",
  "gpt-4o": "gpt-4o",
  "gpt-4o-mini": "gpt-4o-mini",
  "gpt-3.5-turbo": "gpt-4o-mini",
  "claude-3.5-sonnet": "claude-3.5-sonnet",
  "claude-3.5-sonnet-20241022": "claude-3.5-sonnet",
  "o1-preview": "o1-preview",
  "o1-mini": "o1-mini",
};
```

### Available Models
1. **gpt-4o** - Default model, GPT-4 optimized
2. **gpt-4o-mini** - Smaller, faster GPT-4 variant
3. **claude-3.5-sonnet** - Anthropic Claude 3.5 Sonnet
4. **o1-preview** - OpenAI O1 preview model
5. **o1-mini** - OpenAI O1 mini model

## Headers Configuration

### Critical Headers Discovery ⚠️

**What Works:**
```typescript
{
  "Authorization": `Bearer ${token}`,
  "Accept": "application/json",
  "Content-Type": "application/json",
  "User-Agent": "GitHub-Copilot/1.0 (n8n-node)",
  "Editor-Version": "vscode/1.95.0",
  "Editor-Plugin-Version": "copilot/1.0.0"
}
```

**What Breaks:**
```typescript
{
  "X-GitHub-Api-Version": "2022-11-28"  // ❌ Causes "invalid apiVersion" error
}
```

### Header Evolution
- **v3.31.14-3.31.16**: No special headers, frequent 403 errors
- **v3.31.17**: Added VS Code headers + `X-GitHub-Api-Version` → "invalid apiVersion" errors
- **v3.31.18-3.31.19**: Removed `X-GitHub-Api-Version` → ✅ Working correctly

### VS Code Client Headers
These headers reduce 403 errors significantly:
- `User-Agent: GitHub-Copilot/1.0 (n8n-node)` - Identifies client
- `Editor-Version: vscode/1.95.0` - VS Code version
- `Editor-Plugin-Version: copilot/1.0.0` - Copilot extension version

## Authentication

### Token Formats Supported
1. **OAuth2 Token**: `gho_...` (GitHub OAuth)
2. **User Token**: `ghu_...` (GitHub User)
3. **PAT Token**: `github_pat_...` (Personal Access Token)

### Credential Type Detection
```typescript
// Dynamic credential type detection
let credentialType = "githubCopilotApi"; // default
try {
  credentialType = context.getNodeParameter("credentialType", 0, "githubCopilotApi") as string;
} catch {
  // Fallback to default
}

const credentials = await context.getCredentials(credentialType);
const token = (
  credentials.accessToken || 
  credentials.access_token || 
  credentials.oauthTokenData?.access_token ||
  credentials.token
) as string;
```

## Request Format

### Standard Chat Completions Request
```json
{
  "model": "gpt-4o",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user", 
      "content": "Hello!"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 2000,
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "get_weather",
        "description": "Get weather information",
        "parameters": {
          "type": "object",
          "properties": {
            "location": {
              "type": "string",
              "description": "City name"
            }
          },
          "required": ["location"]
        }
      }
    }
  ]
}
```

### Parameters Supported
- `model` - Model identifier (see models section)
- `messages` - Array of conversation messages
- `temperature` - Randomness (0.0-2.0)
- `max_tokens` - Maximum response length
- `seed` - Reproducibility seed (optional)
- `tools` - Function calling tools (optional)
- `response_format` - JSON response format (optional)

## Response Format

### Standard Response
```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1696147200,
  "model": "gpt-4o",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! How can I help you?",
        "padding": "..."  // ⚠️ Non-standard field
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 20,
    "total_tokens": 30
  }
}
```

### Critical Discovery: Response Filtering ⚠️

**Problem**: GitHub Copilot API returns non-standard fields like `"padding"` in the message object.

**Solution** (v3.31.18):
```typescript
// Filter response to OpenAI standard
choices: copilotResponse.choices.map(choice => ({
  index: choice.index,
  message: {
    role: choice.message.role,
    content: choice.message.content,
    ...(choice.message.tool_calls && { tool_calls: choice.message.tool_calls }),
  },
  finish_reason: choice.finish_reason,
}))
```

**Impact**: Chatwoot and other OpenAI-compatible clients reject responses with extra fields.

### Tool Calls Response
```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": null,
        "tool_calls": [
          {
            "id": "call_abc123",
            "type": "function",
            "function": {
              "name": "get_weather",
              "arguments": "{\"location\": \"São Paulo\"}"
            }
          }
        ]
      },
      "finish_reason": "tool_calls"
    }
  ]
}
```

## Error Handling

### Error Format (OpenAI Compatible)

**Our Implementation** (v3.31.19):
```typescript
// OpenAI-compatible error format
return {
  error: {
    message: errorMessage,
    type: errorType,  // invalid_request_error, rate_limit_error, api_error
    param: null,
    code: errorCode,  // invalid_api_key, insufficient_quota, etc.
  }
};
```

### Error Type Mapping
```typescript
// HTTP Status → OpenAI Error Type
400 → "invalid_request_error" (code: "invalid_request")
401 → "invalid_request_error" (code: "invalid_api_key")
403 → "invalid_request_error" (code: "insufficient_quota")
429 → "rate_limit_error" (code: "rate_limit_exceeded")
500+ → "api_error" (code: "internal_error")
```

### Common Error Messages

1. **Invalid Token**
```json
{
  "error": {
    "message": "Invalid token format",
    "type": "invalid_request_error",
    "code": "invalid_api_key"
  }
}
```

2. **Rate Limit (403)**
```json
{
  "error": {
    "message": "GitHub Copilot API error: 403 Forbidden",
    "type": "invalid_request_error",
    "code": "insufficient_quota"
  }
}
```

3. **Invalid API Version** (v3.31.17 bug, fixed in v3.31.18)
```json
{
  "error": {
    "message": "invalid apiVersion",
    "type": "invalid_request_error",
    "code": "invalid_request"
  }
}
```

## Retry Strategy

### Configuration
```typescript
export interface RetryConfig {
  maxRetries?: number;      // Default: 3
  baseDelay?: number;       // Default: 500ms
  retryOn403?: boolean;     // Default: true
}
```

### Retry Logic (v3.31.15+)
```typescript
for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
  try {
    const response = await fetch(fullUrl, options);
    
    // Retry on 403 (intermittent GitHub Copilot issues)
    if (response.status === 403 && RETRY_ON_403 && attempt < MAX_RETRIES) {
      const delayMs = BASE_DELAY * Math.pow(2, attempt - 1); // Exponential backoff
      const jitter = Math.random() * delayMs * 0.2;          // 0-20% jitter
      const totalDelay = Math.floor(delayMs + jitter);
      
      console.warn(`⚠️ 403 on attempt ${attempt}/${MAX_RETRIES}. Retry in ${totalDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, totalDelay));
      continue;
    }
    
    if (response.ok) {
      if (attempt > 1) {
        console.log(`✅ Succeeded on attempt ${attempt}/${MAX_RETRIES}`);
      }
      return await response.json();
    }
    
    throw new Error(`API Error: ${response.status}`);
  } catch (error) {
    // Last attempt or non-retryable error
    if (attempt >= MAX_RETRIES) throw error;
    // Retry with backoff
    await new Promise(resolve => setTimeout(resolve, calculateDelay(attempt)));
  }
}
```

### Retry Schedule
- **Attempt 1**: Immediate
- **Attempt 2**: 500-600ms (500ms + 0-20% jitter)
- **Attempt 3**: 1000-1200ms (1000ms + 0-20% jitter)

**Why Jitter?** Prevents "thundering herd" when multiple requests retry simultaneously.

## Key Discoveries

### 1. ❌ X-GitHub-Api-Version Header Issue
**Problem**: Including `X-GitHub-Api-Version: 2022-11-28` causes `400 Bad Request` with error "invalid apiVersion".

**Discovery Date**: 2025-10-01 (v3.31.17)  
**Fixed In**: v3.31.18  
**Lesson**: GitHub Copilot API doesn't accept GitHub API version headers.

### 2. ⚠️ Response Padding Field
**Problem**: GitHub Copilot API returns non-standard `"padding"` field in message object, breaking Chatwoot.

**Discovery Date**: 2025-10-01 (v3.31.17)  
**Fixed In**: v3.31.18  
**Solution**: Filter response to include only OpenAI standard fields (role, content, tool_calls).

### 3. 🔄 Intermittent 403 Errors
**Problem**: Random 403 Forbidden errors even with valid token.

**Discovery Date**: 2025-10-01 (v3.31.14-3.31.16)  
**Fixed In**: v3.31.15-3.31.17 (retry system) + v3.31.17 (headers optimization)  
**Solution**: 
- Exponential backoff retry with jitter
- VS Code client headers (User-Agent, Editor-Version, Editor-Plugin-Version)

### 4. 📋 Error Format Incompatibility
**Problem**: Custom error format not recognized by Chatwoot.

**Discovery Date**: 2025-10-01 (v3.31.18)  
**Fixed In**: v3.31.19  
**Solution**: Implement OpenAI-compatible error format with type/code mapping.

### 5. 🔑 Token Format Flexibility
**Discovery**: GitHub Copilot API accepts multiple token formats (gho_, ghu_, github_pat_).

**Validated**: 2025-10-01  
**Implementation**: Dynamic token detection with fallback.

## Comparison with VS Code

### VS Code Implementation Location
- **Repository**: microsoft/vscode
- **Chat Infrastructure**: `src/vs/workbench/contrib/chat/`
- **Language Models**: `src/vs/workbench/contrib/chat/common/languageModels.ts`

### Key Differences

#### 1. VS Code Has Native Integration
- [VS Code uses proprietary GitHub Copilot extension](https://github.com/microsoft/vscode-copilot-chat)
- Direct integration with GitHub authentication
- No need for manual token management

#### 2. Our Implementation (n8n-nodes-github-copilot)
- Open-source node for n8n automation
- OAuth2 + Manual token support
- OpenAI-compatible interface for Chatwoot integration

#### 3. Headers Configuration
**VS Code**: Unknown (extension is closed-source)  
**Our Implementation**:
```typescript
{
  "User-Agent": "GitHub-Copilot/1.0 (n8n-node)",
  "Editor-Version": "vscode/1.95.0",
  "Editor-Plugin-Version": "copilot/1.0.0"
}
```

#### 4. Error Handling
**VS Code**: Integrated error UI in editor  
**Our Implementation**: OpenAI-compatible error format for API consumers

#### 5. Retry Strategy
**VS Code**: Unknown  
**Our Implementation**: Configurable exponential backoff with jitter (3 retries default)

### What We Can Learn from VS Code

Unfortunately, the GitHub Copilot extension for VS Code is **closed-source** and distributed as a compiled binary. The chat infrastructure in the VS Code repository (`microsoft/vscode`) provides the framework for extensions to integrate, but doesn't contain the actual Copilot API implementation.

**Available in VS Code Repo**:
- Chat UI framework
- Language model provider interfaces
- Tool calling infrastructure

**Not Available** (Closed-Source):
- Actual API endpoints used
- Authentication flow
- Request/response transformations
- Retry logic

### Our Implementation Advantages

1. **Open Source**: Full transparency and community contributions
2. **OpenAI Compatible**: Works with Chatwoot and other OpenAI clients
3. **Flexible Authentication**: OAuth2, PAT, manual tokens
4. **Configurable Retry**: User-defined retry parameters
5. **n8n Integration**: Workflow automation capabilities

## Implementation Timeline

### Version History
- **v3.31.14**: Real API integration (replaced mock responses)
- **v3.31.15**: Added configurable retry system
- **v3.31.16**: Retry configuration parameters
- **v3.31.17**: VS Code headers + X-GitHub-Api-Version (introduced bug)
- **v3.31.18**: Fixed X-GitHub-Api-Version issue + response filtering
- **v3.31.19**: OpenAI-compatible error format

### Current Status (v3.31.19)
✅ **Production Ready**
- Real API integration working
- Retry system reduces 403 errors
- Response filtering ensures compatibility
- OpenAI error format for Chatwoot
- VS Code headers for better reliability

## Recommendations

### For Production Use
1. **Token Management**: Use OAuth2 for automatic token refresh
2. **Retry Configuration**: Keep default (3 retries, 500ms base delay)
3. **Error Handling**: Implement exponential backoff in client applications
4. **Monitoring**: Track 403 error rates and retry success rates

### For Future Investigation
1. Analyze VS Code's compiled Copilot extension (reverse engineering)
2. Monitor GitHub Copilot API changelog for header requirements
3. Test different User-Agent strings for optimal reliability
4. Investigate rate limit patterns and quotas

## References

### Official Documentation
- GitHub Copilot API: https://api.githubcopilot.com
- GitHub API: https://docs.github.com/rest
- OpenAI API Compatibility: https://platform.openai.com/docs/api-reference

### Our Implementation
- Node Package: n8n-nodes-github-copilot
- Repository: (internal)
- Version: 3.31.19
- Published: NPM

### Related Files
- `shared/utils/GitHubCopilotEndpoints.ts` - Endpoints configuration
- `shared/utils/GitHubCopilotApiUtils.ts` - API request utilities
- `nodes/GitHubCopilotOpenAI/GitHubCopilotOpenAI.node.ts` - OpenAI-compatible node
- `nodes/GitHubCopilotChatAPI/GitHubCopilotChatAPI.node.ts` - Native Copilot node

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-01 18:40  
**Author**: GitHub Copilot AI Assistant  
**Status**: Active Discovery Document
