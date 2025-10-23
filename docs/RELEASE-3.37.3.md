# Release Notes - v3.37.3

**Release Date**: 2025-01-21  
**Type**: Critical Bugfix + UX Improvement  
**Previous Version**: 3.37.2

## 🎯 Summary

Fixed critical OAuth token issue in test embeddings function and improved nomenclature consistency across test options.

## 🐛 Critical Bug Fixes

### GitHubCopilotTest Node - Test Embedding Models

**Issue**: Test embeddings function was failing with 403 errors

**Root Cause**: 
- Function was using GitHub token (`ghu_*`) directly instead of OAuth token (`gho_*`)
- Embeddings API requires OAuth token, not GitHub token
- GitHubCopilotEmbeddings node works correctly because it generates OAuth token
- Test function was missing the OAuth token generation step

**Fix**:
```typescript
// BEFORE (incorrect):
async function testEmbeddingModels(token: string, ...) {
  // Used token directly
  const data = await executeEmbeddingsRequestSimple(token, requestBody);
}

// AFTER (correct):
async function testEmbeddingModels(githubToken: string, ...) {
  // Generate OAuth token first (required for embeddings API)
  const oauthToken = await OAuthTokenManager.getValidOAuthToken(githubToken);
  const data = await executeEmbeddingsRequestSimple(oauthToken, requestBody);
}
```

**Result**: ✅ Test embeddings function now works correctly with proper OAuth token

## 🎨 UX Improvements

### Nomenclature Consistency

**Issue**: Inconsistent naming in test function options

**Changes**:
- ❌ **Before**: "Consolidated Model Test" (generic, unclear)
- ✅ **After**: "Test Chat Models" (specific, clear)

**Current Test Options** (now consistent):
1. "List Available Models" - Lists all models
2. "Refresh Models Cache" - Force cache refresh
3. **"Test Embedding Models"** - Tests embedding models
4. **"Test Chat Models"** - Tests chat models (renamed)

**Pattern**: All test functions follow same naming convention:
- "Test [Model Type] Models" format
- Clear and descriptive
- Professional English naming

## 📋 Technical Details

### OAuth Token Flow

**GitHubCopilotEmbeddings Node** (already correct):
```typescript
const githubToken = credentials.token; // ghu_* or github_pat_*
const oauthToken = await OAuthTokenManager.getValidOAuthToken(githubToken); // gho_*
// Use oauthToken for API calls
```

**GitHubCopilotTest Node** (now fixed):
```typescript
// Receives githubToken from credentials
async function testEmbeddingModels(githubToken: string, ...) {
  // Generate OAuth token (required for embeddings)
  const oauthToken = await OAuthTokenManager.getValidOAuthToken(githubToken);
  
  // Use OAuth token for models list
  const modelsResponse = await fetch(modelsUrl, {
    headers: GitHubCopilotEndpoints.getAuthHeaders(oauthToken),
  });
  
  // Use OAuth token for embeddings requests
  const data = await executeEmbeddingsRequestSimple(oauthToken, requestBody);
}
```

### Token Types Reference

| Token Type | Format | Usage | API Support |
|------------|--------|-------|-------------|
| GitHub Token | `ghu_*` or `github_pat_*` | Stored in credentials | GitHub API only |
| OAuth Token | `gho_*` | Generated from GitHub token | Copilot Chat & Embeddings API |

### Why OAuth Token is Required

1. **Embeddings API**: Requires OAuth token (`gho_*`) for authentication
2. **Chat API**: Also requires OAuth token
3. **Models API**: Works with both, but OAuth preferred
4. **Token Generation**: `OAuthTokenManager.getValidOAuthToken()` handles:
   - OAuth token generation from GitHub token
   - Token caching (24h validity)
   - Automatic refresh when expired

## 🧪 Testing

✅ **Compilation**: TypeScript builds without errors  
✅ **Test Embeddings**: Now uses correct OAuth token  
✅ **Nomenclature**: All test options consistent  
✅ **Token Flow**: Matches production embeddings node  

## 📝 Upgrade Notes

No breaking changes. Existing workflows continue to work without modifications.

**Important**: If you were experiencing 403 errors with "Test Embedding Models" function, this release fixes the issue.

## 🔍 Files Changed

1. **`nodes/GitHubCopilotTest/GitHubCopilotTest.node.ts`**:
   - Line 538: Changed parameter name `token` → `githubToken`
   - Line 548: Added OAuth token generation
   - Line 552: Use OAuth token for models API
   - Line 603: Use OAuth token for embeddings requests
   - Line 749: Renamed test option "Consolidated Model Test" → "Test Chat Models"
   - Line 751: Updated description to mention "chat models"

## 🎓 Lessons Learned

1. **Token Types Matter**: Different APIs require different token types
2. **Consistency is Key**: Test functions should match production node behavior
3. **Clear Naming**: UX benefits from descriptive, consistent naming
4. **Token Flow**: Always follow same pattern as production nodes

## 🙏 Credits

- User feedback on 403 errors and nomenclature inconsistency
- Token management architecture from previous releases

---

**Full Changelog**: [v3.37.2...v3.37.3](https://github.com/sufficit/n8n-nodes-github-copilot/compare/v3.37.2...v3.37.3)
