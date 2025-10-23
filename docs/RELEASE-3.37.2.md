# Release Notes - v3.37.2

**Release Date**: 2025-01-21  
**Type**: Bugfix + Code Organization  
**Previous Version**: 3.37.1

## 🎯 Summary

Code organization refactoring: Moved embeddings API request logic from nodes to shared utilities, following established architecture patterns. Fixed test embeddings functionality.

## 🔧 Bug Fixes

### GitHubCopilotTest Node
- **Fixed**: Test Embedding Models function now works correctly
- **Fixed**: Uses shared `executeEmbeddingsRequestSimple()` instead of inline fetch calls
- **Improved**: Cleaner error handling and consistent API interaction

## ♻️ Code Organization

### Created Files

**`shared/utils/EmbeddingsApiUtils.ts`** (130 lines)
- Centralized embeddings API request functions
- Eliminates code duplication across nodes
- Exports:
  * `EmbeddingResponse` interface - API response type
  * `EmbeddingRequest` interface - Request body type
  * `executeEmbeddingsRequest()` - Production function with retry logic
  * `executeEmbeddingsRequestSimple()` - Test function, single attempt

### Refactored Files

**`nodes/GitHubCopilotEmbeddings/GitHubCopilotEmbeddings.node.ts`**
- Removed inline `EmbeddingResponse` interface (~5 lines)
- Removed inline `executeEmbeddingsWithRetry()` function (~80 lines)
- Now imports and uses shared utilities
- **Code reduction**: ~80 lines removed

**`nodes/GitHubCopilotTest/GitHubCopilotTest.node.ts`**
- Removed inline fetch() calls in testEmbeddingModels (~30 lines)
- Now uses `executeEmbeddingsRequestSimple()` from shared utilities
- Cleaner try-catch blocks
- **Code reduction**: ~20 lines removed

## 📐 Architecture Improvements

### Before (Duplicated Code)
```typescript
// Each node had its own fetch logic
const response = await fetch(url, {
  method: "POST",
  headers: getEmbeddingsHeaders(token),
  body: JSON.stringify(requestBody),
});

if (response.ok) {
  const data = await response.json();
  // process...
} else {
  // error handling...
}
```

### After (Shared Utilities)
```typescript
// All nodes use the same function
const data = await executeEmbeddingsRequest(token, requestBody, enableRetry, maxRetries);
// Much simpler - shared function handles everything
```

## 💡 Benefits

1. **No Code Duplication**: Request logic in one place only
2. **Easier Maintenance**: Changes to API calls happen in shared file
3. **Consistency**: All nodes use same error handling and retry logic
4. **Testability**: Shared functions can be unit tested
5. **Cleaner Nodes**: ~100 lines removed from node files

## 📊 Impact

- **Total Code Reduction**: ~100 lines across all nodes
- **Maintainability**: ⬆️ Significantly improved
- **Test Coverage**: ⬆️ Easier to test shared utilities
- **Bug Surface**: ⬇️ Less duplicated code = fewer bugs

## 🔍 Technical Details

### EmbeddingsApiUtils Functions

**`executeEmbeddingsRequest()`** - Production Use
- Automatic retry with exponential backoff
- TPM quota error detection
- Configurable max retries (default: 3)
- Returns typed `EmbeddingResponse`

**`executeEmbeddingsRequestSimple()`** - Testing Use
- Single attempt, no retry
- Throws error on failure
- Cleaner for test scenarios
- Returns typed `EmbeddingResponse`

### Header Configuration
Uses `GitHubCopilotEndpoints.getEmbeddingsHeaders()` with required headers:
- `Editor-Version`: vscode/1.95.0
- `Editor-Plugin-Version`: copilot/1.0.0
- `Vscode-Sessionid`: UUID-timestamp
- `X-GitHub-Api-Version`: 2025-08-20

## 🧪 Testing

✅ **Compilation**: TypeScript builds without errors  
✅ **GitHubCopilotEmbeddings**: Refactored, tested  
✅ **GitHubCopilotTest**: Test embeddings function now works  
✅ **Code Review**: No duplication, proper typing  

## 📝 Upgrade Notes

No breaking changes. Existing workflows continue to work without modifications.

## 🎓 Lessons Learned

1. **Shared Utilities Pattern**: Essential for maintainable code
2. **Early Refactoring**: Better to organize code early than fix duplication later
3. **Consistent Architecture**: Following established patterns improves code quality
4. **Test Node Importance**: Catching issues early prevents production problems

## 👥 Credits

- Architecture pattern following n8n best practices
- User feedback on code organization

---

**Full Changelog**: [v3.37.1...v3.37.2](https://github.com/sufficit/n8n-nodes-github-copilot/compare/v3.37.1...v3.37.2)
