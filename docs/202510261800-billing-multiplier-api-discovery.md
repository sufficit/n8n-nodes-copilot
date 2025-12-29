# GitHub Copilot API Billing Multiplier Discovery

**Date**: 2025-10-26  
**Version Format**: 202510261800  
**Source**: microsoft/vscode-copilot-chat repository

## Summary

Discovered that the GitHub Copilot API returns `billing.multiplier` data when the correct headers are sent. The key header is `X-GitHub-Api-Version: 2025-05-01`.

## Key Discovery

### Critical Header

```http
X-GitHub-Api-Version: 2025-05-01
```

This header triggers the API to return the `billing` object with `multiplier` field.

### Complete Headers for Models API

```typescript
headers: {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2025-05-01',  // CRITICAL!
    'X-Interaction-Type': 'model-access',
    'OpenAI-Intent': 'model-access',
    'Copilot-Integration-Id': 'vscode-chat',
}
```

### API Response Format

With the correct headers, each model includes:

```json
{
  "billing": {
    "is_premium": true,
    "multiplier": 1,
    "restricted_to": ["copilot_enterprise_seat"]
  },
  "id": "claude-sonnet-4",
  "name": "Claude Sonnet 4",
  "is_chat_default": false,
  "is_chat_fallback": false,
  ...
}
```

## Source Code References

### networking.ts (microsoft/vscode-copilot-chat)

**Path**: `src/platform/networking/common/networking.ts`

```typescript
const headers: ReqHeaders = {
    Authorization: `Bearer ${secretKey}`,
    'X-Request-Id': requestId,
    'X-Interaction-Type': intent,
    'OpenAI-Intent': intent, // Tells CAPI who flighted this request
    'X-GitHub-Api-Version': '2025-05-01',
    ...additionalHeaders,
    ...(endpoint.getExtraHeaders ? endpoint.getExtraHeaders() : {}),
};
```

### endpointProvider.ts

**Path**: `src/platform/endpoint/common/endpointProvider.ts`

```typescript
export interface IModelAPIResponse {
    // ...
    billing?: { 
        is_premium: boolean; 
        multiplier: number;           // 0, 0.33, 1, 3, or 10
        restricted_to?: string[] 
    };
    // ...
}
```

### chatEndpoint.ts

**Path**: `src/platform/endpoint/common/chatEndpoint.ts`

```typescript
this.isPremium = modelMetadata.billing?.is_premium;
this.multiplier = modelMetadata.billing?.multiplier;
this.restrictedToSkus = modelMetadata.billing?.restricted_to;
```

### modelMetadataFetcher.ts

**Path**: `src/platform/endpoint/node/modelMetadataFetcher.ts`

```typescript
const response = await getRequest(
    this._fetcher,
    this._telemetryService,
    this._capiClientService,
    { type: RequestType.Models, isModelLab: this._isModelLab },
    copilotToken,
    await createRequestHMAC(process.env.HMAC_SECRET),
    'model-access',  // Intent
    requestId,
);
const data: IModelAPIResponse[] = (await response.json()).data;
```

## Test Results

| Header Configuration | Total Models | With `billing` | Notes |
|---------------------|--------------|----------------|-------|
| Standard (no version) | 31 | 0 | ❌ No billing data |
| `2025-05-01` version | 32 | 32 | ✅ All have billing |
| + `Copilot-Integration-Id` | 39 | 39 | ✅ More models + billing |

## Multiplier Values from API

| Model | multiplier | is_premium |
|-------|------------|------------|
| `gpt-5-mini` | 0 | false |
| `gpt-4o-mini` | 0 | false |
| `gpt-4o` | 0 | false |
| `gpt-5` | 1 | true |
| `gpt-5.1` | 1 | true |
| `gpt-5.1-codex` | 1 | true |
| `claude-haiku-4.5` | 0.33 | true |
| `gpt-5.1-codex-mini` | 0.33 | true |
| `gemini-3-flash-preview` | 0.33 | true |
| `claude-sonnet-4` | 1 | true |
| `claude-sonnet-4.5` | 1 | true |
| `gemini-2.5-pro` | 1 | true |
| `claude-opus-4.5` | 3 | true |
| `claude-opus-41` | 10 | true |
| `oswe-vscode-prime` | 0 | false |

## Implementation Changes

Updated `DynamicModelsManager.ts`:

1. **Updated API headers** to use `X-GitHub-Api-Version: 2025-05-01`
2. **Added billing interface** to `CopilotModel` type
3. **Modified `getCostMultiplier()`** to use API data when available, with fallback to ID-based estimation

```typescript
private static getCostMultiplier(model: CopilotModel): string {
    // BEST: Use API billing data if available
    if (model.billing?.multiplier !== undefined) {
        return `${model.billing.multiplier}x`;
    }
    
    // FALLBACK: Estimate based on model ID patterns
    // ...
}
```

## Benefits

1. **Accurate pricing**: No more guessing based on model names
2. **Future-proof**: New models automatically get correct multipliers
3. **More models**: 39 models vs 31 with the new headers
4. **Additional data**: `is_premium`, `is_chat_default`, `is_chat_fallback`

## Related Files

- [DynamicModelsManager.ts](../shared/utils/DynamicModelsManager.ts)
- [202510260200-vscode-copilot-multiplier-analysis.md](./202510260200-vscode-copilot-multiplier-analysis.md)
