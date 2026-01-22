# GitHub Copilot API - Error Handling Instructions

## Token Authentication

### ✅ Valid Token (403 Forbidden)
```http
Status: 403 - Forbidden
Headers: x-endpoint-client-forbidden, x-endpoint-integration-forbidden
Message: TPM quota exceeded
```
**Meaning**: Token authenticated successfully, but quota exhausted (TPM = Transactions Per Minute)

### ❌ Invalid Token (401 Unauthorized)
```http
Status: 401 - Unauthorized  
Message: unauthorized: unauthorized: AuthenticateToken authentication failed
```
**Meaning**: Token completely rejected by API

### ❌ Unsupported Model (400 Bad Request)
```http
Status: 400 - Bad Request
Message: model not supported
```
**Meaning**: Model not available for account/organization

## Account Types

### Enterprise Account

- ✅ Access to premium models (Claude, GPT-4, etc)
- ✅ TPM system with working retry mechanism
- ✅ Detailed headers with quota information

### Personal Account

- ❌ Authentication fails on API
- ❌ No access to enterprise endpoints
- ❌ Immediate 401 error

## Testing Strategy

**IF error 401**: DO NOT retry  
**IF error 400 "model not supported"**: DO NOT retry  
**IF error 403**: Retry recommended (temporary quota)

## TPM System (Transactions Per Minute)

```http
x-endpoint-client-forbidden: tpm:MODEL:clientID:CLIENT_NAME
```

**Observed ClientIDs**: vscode, dotnet_ai, java_on_azure, autodev_test

**Behavior**: Automatic rotation between clientIDs with independent quotas

## Implementation Guidelines

### Error Detection

When implementing GitHub Copilot API calls:

1. **Check status code first**
2. **Parse error message**
3. **Look for TPM headers**
4. **Apply appropriate retry strategy**

### Retry Logic

```javascript
if (error.status === 401) {
    // Authentication failed - do not retry
    throw new Error('Invalid GitHub Copilot token');
}

if (error.status === 400 && error.message.includes('model not supported')) {
    // Model not available - do not retry
    throw new Error(`Model ${model} not available for this account`);
}

if (error.status === 403) {
    // Quota exceeded - retry after delay
    const retryAfter = parseInt(error.headers['retry-after']) || 60;
    await sleep(retryAfter * 1000);
    return retry();
}
```

### Header Monitoring

Always capture and log these headers for debugging:
- `x-endpoint-client-forbidden`
- `x-endpoint-integration-forbidden`
- `x-endpoint-user-forbidden`
- `retry-after`

## Best Practices

1. **Token Validation**: Validate token format (`gho_*`) before making API calls
2. **Error Logging**: Log all error responses with headers for debugging
3. **Graceful Degradation**: Have fallback models when primary fails
4. **User Feedback**: Provide clear error messages to users
5. **Rate Limiting**: Implement client-side rate limiting to avoid TPM exhaustion

---

**Last Updated**: 2025-01-22
