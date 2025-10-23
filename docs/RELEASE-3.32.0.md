# Release 3.32.0 - OAuth Token Auto-Renewal

**Release Date**: 2025-10-22

## 🎉 Major Feature: Automatic OAuth Token Management

This release introduces **automatic OAuth token generation and caching**, eliminating the need for manual token renewal every 30 minutes.

## ✨ New Features

### 🔄 OAuthTokenManager Class
- **Automatic token generation** from GitHub CLI tokens (gho_*)
- **In-memory caching** with intelligent expiration handling
- **Auto-refresh** with 2-minute buffer (tokens refresh after ~18 minutes)
- **Persistent machine ID** per GitHub token (SHA-256 hash)
- **Zero-downtime renewal** - seamless token refresh

### 🔐 Enhanced Credential System
- **Two authentication modes**:
  1. **GitHub CLI Token + Auto OAuth** (RECOMMENDED) - Set and forget!
  2. **Manual OAuth Token** (Advanced) - For custom use cases
- **Automatic mode selection** based on token format
- **Backwards compatible** with existing credentials

### ⚡ Performance Improvements
- **First request**: ~475ms (token generation)
- **Cached requests**: ~0ms (instant retrieval!)
- **Auto-renewal**: Happens automatically every ~18 minutes
- **No manual intervention** required

## 🔧 Technical Details

### Files Added
- `shared/utils/OAuthTokenManager.ts` - Core token management class
- `temp/OAuthTokenManager.js` - JavaScript test version
- `temp/test-oauth-manager.js` - Comprehensive test suite

### Files Modified
- `credentials/GitHubCopilotApi.credentials.ts` - Added authMethod selector and async authenticate()
- `shared/utils/GitHubCopilotApiUtils.ts` - Integrated OAuthTokenManager into request flow

### Authentication Flow
```
Node Request
    ↓
Check authMethod
    ↓
If GitHub Token (gho_*):
    ↓
OAuthTokenManager.getValidOAuthToken()
    ↓
    ├─ Valid cache? → Return instantly (0ms) ✨
    └─ Expired? → Generate new (475ms)
    ↓
OAuth Token (tid=...;exp=...;sku=...)
    ↓
API Request with Bearer token
```

## 📊 Benefits

### For Users
- ✅ **No more manual token generation** every 30 minutes
- ✅ **Instant API calls** (cached tokens)
- ✅ **Zero configuration** - just provide GitHub token
- ✅ **Automatic renewal** - works 24/7 without intervention

### For Developers
- ✅ **Centralized token management**
- ✅ **Type-safe implementation**
- ✅ **Comprehensive error handling**
- ✅ **Debug-friendly logging**

## 🎯 Affected Nodes

All 6 nodes now benefit from automatic OAuth token management:
1. ✅ **GitHubCopilotChatAPI** - Direct Chat API access
2. ✅ **GitHubCopilotChatModel** - AI Chat Model for workflows
3. ✅ **GitHubCopilotOpenAI** - OpenAI-compatible interface
4. ✅ **GitHubCopilotTest** - Testing and validation
5. ✅ **GitHubCopilot** - CLI integration
6. ✅ **GitHubCopilotAuthHelper** - Token generation helper

## 🔄 Migration Guide

### Existing Users (Manual OAuth Tokens)
Your existing credentials will continue to work! The system automatically detects token format and uses the appropriate method.

### New Users (Recommended Setup)
1. Get your GitHub CLI token (gho_*):
   ```bash
   gh auth token
   ```
2. Configure credential in n8n:
   - **Authentication Method**: GitHub CLI Token (Auto OAuth) - RECOMMENDED
   - **Token**: Paste your gho_* token
3. Save and use! 🎉

No need to worry about token expiration anymore!

## 📝 Example Logs

### First Request (Cold Start)
```
🔄 Using GitHub token to generate OAuth token...
🔄 Generating new OAuth token...
🆔 Generated new machine ID
✅ OAuth token generated successfully (expires in 30 minutes)
✅ OAuth token ready (auto-generated from GitHub token)
```

### Subsequent Requests (Cached)
```
🔄 Using GitHub token to generate OAuth token...
✅ Using cached OAuth token (25 minutes remaining)
✅ OAuth token ready (auto-generated from GitHub token)
```

### Auto-Refresh (After 18 minutes)
```
🔄 Using GitHub token to generate OAuth token...
⏰ Token expires soon (2 minutes remaining), refreshing...
🔄 Generating new OAuth token...
✅ OAuth token generated successfully (expires in 30 minutes)
✅ OAuth token ready (auto-generated from GitHub token)
```

## 🧪 Testing

Comprehensive test suite included:
- ✅ Token generation (475ms)
- ✅ Cache retrieval (0ms - instant!)
- ✅ Cache information tracking
- ✅ Refresh status monitoring
- ✅ API validation

All tests passed successfully! 🎉

## 📚 Documentation

- **OAuthTokenManager**: TypeScript class with full JSDoc documentation
- **Credential Setup**: Updated with new authentication modes
- **API Utils**: Updated request flow documentation

## 🔮 Future Enhancements

- Add embeddings node (using this new OAuth system)
- Persistent cache (across n8n restarts)
- Token usage statistics
- Multi-account support

## ⚠️ Breaking Changes

**None!** This release is fully backwards compatible with existing credentials and workflows.

## 🙏 Credits

Developed with ❤️ by Sufficit
Special thanks to the n8n community for feedback and support!

---

**Upgrade Command**:
```bash
npm install n8n-nodes-github-copilot@3.32.0
```

**Questions or Issues?**
- GitHub: https://github.com/sufficit/n8n-nodes-github-copilot/issues
- Email: development@sufficit.com.br
