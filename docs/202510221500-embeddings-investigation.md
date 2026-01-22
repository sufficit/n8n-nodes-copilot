# GitHub Copilot Embeddings API - Investigation Results

**Date:** 2025-10-22  
**Version:** 202510221500  
**Status:** ❌ Embeddings endpoint NOT accessible with personal token

## Summary

Investigation into the GitHub Copilot `/embeddings` endpoint shows that while the endpoint exists and embedding models are listed in the API, actual access returns **400 Bad Request** errors consistently.

## Test Results

### Endpoint Tested
- **URL:** `https://api.githubcopilot.com/embeddings`
- **Method:** POST
- **Authentication:** Bearer token (gho_* format)

### Models Available (from /models API)
According to the `/models` endpoint, 3 embedding models are listed:

1. **text-embedding-ada-002**
   - Name: Embedding V2 Ada
   - Family: text-embedding-ada-002
   - Type: embeddings
   - Provider: Azure OpenAI

2. **text-embedding-3-small**
   - Name: Embedding V3 small
   - Family: text-embedding-3-small
   - Type: embeddings
   - Provider: Azure OpenAI
   - Capabilities: dimensions

3. **text-embedding-3-small-inference**
   - Name: Embedding V3 small (Inference)
   - Family: text-embedding-3-small
   - Type: embeddings
   - Provider: Azure OpenAI
   - Capabilities: dimensions

### Test Attempts

#### Attempt 1: Basic Request
```javascript
{
  "model": "text-embedding-3-small",
  "input": "Hello, this is a test."
}
```
**Result:** 400 Bad Request

#### Attempt 2: With API Version Header
```javascript
Headers: {
  'Authorization': 'Bearer gho_...',
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'X-GitHub-Api-Version': '2025-07-16'
}
Body: {
  "model": "text-embedding-3-small",
  "input": "Hello, this is a test for embeddings."
}
```
**Result:** 400 Bad Request

#### All Models Tested
All 3 embedding models returned the same error:
- ❌ text-embedding-ada-002 → 400
- ❌ text-embedding-3-small → 400
- ❌ text-embedding-3-small-inference → 400

### Response Details
```
HTTP/1.1 400 Bad Request
Content-Type: text/plain; charset=utf-8
Content-Length: 12

Bad Request
```

## Analysis

### Possible Reasons

1. **Subscription Level Limitation**
   - Embeddings might require GitHub Copilot Business or Enterprise
   - Personal GitHub Copilot may not include embeddings API access
   - Similar to how some chat models return 403 Forbidden

2. **Different Authentication Method**
   - OAuth2 flow might be required instead of personal access token
   - Specific scopes might be needed for embeddings access
   - VS Code extension might use different authentication

3. **Request Format Issue**
   - API might expect different request structure than OpenAI format
   - Additional parameters might be required
   - GitHub-specific wrapper around OpenAI format

4. **Feature Not Fully Released**
   - Models listed but endpoint not yet available for general use
   - Beta feature requiring special access
   - Endpoint documented but not implemented

### Evidence

✅ **Endpoint exists:** Listed in official VS Code extension code  
✅ **Models exist:** 3 embedding models returned by /models API  
✅ **Documentation exists:** Mentioned in .github/instructions/knowing-endpoints.instructions.md  
❌ **Access denied:** Consistent 400 errors across all attempts  
❌ **No error details:** Response body only contains "Bad Request"

## Comparison with Chat API

### Chat Completions (/chat/completions)
- ✅ Accessible with personal token
- ✅ 7 out of 13 models working (54%)
- ✅ Detailed error messages when access denied
- ✅ Returns 403 for subscription-limited models

### Embeddings (/embeddings)
- ❌ Returns 400 for all models
- ❌ No detailed error messages
- ❌ No successful responses
- ❌ Same behavior regardless of model

## Conclusion

**The GitHub Copilot embeddings endpoint is NOT accessible with personal access tokens.**

### Recommendations

1. **Skip Embeddings Implementation:** Don't create an embeddings node for n8n at this time
2. **Document Limitation:** Add note in README that only chat completions are supported
3. **Monitor API Changes:** Check periodically if embeddings become available
4. **Focus on Chat Models:** Continue improving chat completion features
5. **Consider Alternatives:** Users needing embeddings should use OpenAI API directly

### Alternative Solutions

For users needing embeddings:
- Use OpenAI API directly (requires OpenAI API key)
- Use Azure OpenAI Service (requires Azure subscription)
- Use other embedding providers (Cohere, Hugging Face, etc.)

## Files Created During Investigation

- `temp/check-embedding-models.js` - Script to list embedding models from /models API
- `temp/list-embedding-models.js` - Extract exact model IDs
- `temp/test-embeddings-exact-ids.js` - Test with exact model names
- `temp/test-embeddings-debug.js` - Debug request/response details
- `temp/test-embeddings-headers.js` - Test with additional headers
- `temp/embeddings-exact-ids-test.json` - Test results JSON

## Next Steps

1. ✅ Document findings (this file)
2. ⏭️ Update README.md to clarify that only chat completions are supported
3. ⏭️ Consider adding note in GitHubCopilotChatAPI node description
4. ⏭️ Focus development on improving chat features
5. ⏭️ Monitor GitHub Copilot API updates for embeddings availability

---

**Conclusion:** GitHub Copilot API currently does not provide embeddings access via personal tokens. Only chat completions are functional. Users requiring embeddings should use alternative providers.
