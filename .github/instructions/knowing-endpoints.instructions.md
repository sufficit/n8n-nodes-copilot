# GitHub Copilot API - Known Endpoints Instructions

This document lists URLs and endpoints discovered during investigations of official GitHub Copilot extensions for VS Code.

**Last Updated**: 2025-01-22  
**Source**: Complete analysis of `github.copilot` and `github.copilot-chat` extension files

## Main API Endpoints

### Core Copilot APIs

- `https://api.githubcopilot.com` - **Main Copilot API endpoint**
- `https://api.githubcopilot.com/models` - Available models list
- `https://api.githubcopilot.com/chat/completions` - Chat completions
- `https://api.githubcopilot.com/responses` - Responses API
- `https://api.githubcopilot.com/embeddings` - Embeddings
- `https://api.githubcopilot.com/agents` - Remote agents
- `https://api.githubcopilot.com/skills` - Skills list
- `https://api.githubcopilot.com/search` - Search

### GitHub APIs
- `https://api.github.com` - Official GitHub API  
- `https://api.github.com/copilot/mcp_registry` - MCP Registry (Model Context Protocol)
- `https://api.github.com/copilot_internal/content_exclusion` - Content exclusion
- `https://api.github.com/copilot_internal/user` - User information
- `https://api.github.com/copilot_internal/v2/token` - Token endpoint v2

### Proxy and Chat Completions
- `https://copilot-proxy.githubusercontent.com` - **Main proxy**
- `https://copilot-proxy.githubusercontent.com/chat/completions` - **Proxy for chat completions**
- `https://copilot-telemetry.githubusercontent.com` - Telemetry endpoint
- `https://copilot-telemetry.githubusercontent.com/telemetry` - Specific telemetry
- `https://origin-tracker.githubusercontent.com` - Origin tracker
- `https://uploads.github.com/copilot/chat/attachments` - Chat attachment uploads

### GitHub User Content Resources
- `https://avatars.githubusercontent.com` - User avatars
- `https://avatars.githubusercontent.com/u/147005046?v=4` - Specific avatar found
- `https://raw.githubusercontent.com` - GitHub raw content
- `https://private-user-images.githubusercontent.com` - Private user images

## Advanced Debug Configuration

Extensions include settings for endpoint override:

### Available Configurations
- `github.copilot.advanced.debug.overrideProxyUrl` - Override proxy URL
- `github.copilot.advanced.debug.overrideCapiUrl` - Override Copilot API URL  
- `github.copilot.advanced.debug.testOverrideProxyUrl` - Test proxy URL
- `github.copilot.advanced.debug.testOverrideCapiUrl` - Test API URL

### Default Endpoint URLs
```javascript
const DEFAULT_ENDPOINTS = {
  api: "https://api.githubcopilot.com",
  proxy: "https://copilot-proxy.githubusercontent.com", 
  telemetry: "https://copilot-telemetry.githubusercontent.com",
  "origin-tracker": "https://origin-tracker.githubusercontent.com"
};
```

### Alternative URLs (Model Lab)
- `https://api-model-lab.githubcopilot.com` - **Endpoint for model testing**

## Resources and Documentation URLs

### Official Sites
- `https://copilot.github.com` - Official GitHub Copilot site
- `https://github.com/features/copilot?editor=vscode` - Copilot features page

### Documentation and Support
- `https://docs.github.com/copilot/using-github-copilot/getting-started-with-github-copilot` - Official documentation
- `https://docs.github.com/en/copilot/troubleshooting-github-copilot/troubleshooting-firewall-settings-for-github-copilot` - Firewall troubleshooting
- `https://gh.io/copilot-firewall` - Firewall configuration info
- `https://gh.io/copilot-network-errors` - Network error troubleshooting
- `https://aka.ms/github-copilot-rate-limit-error` - Rate limit information
- `https://aka.ms/github-copilot-match-public-code` - Public code matching
- `https://aka.ms/copilot-chat-workspace-remote-index` - Remote workspace indexing

### OAuth and Authentication  
- `https://github.com/login/oauth` - GitHub OAuth endpoint
- `https://github.com/github-copilot/signup/copilot_individual` - Individual signup
- `https://github.com/apps/github-copilot-ide-plugin` - IDE Plugin
- `https://github.com/apps/claude` - Claude App

## Model and External API Endpoints

### OpenAI
- `https://api.openai.com` - OpenAI API
- `https://api.openai.com/v1` - OpenAI API v1
- `https://openaipublic.blob.core.windows.net/encodings/o200k_base.tiktoken` - Tokenizer

### Anthropic
- `https://api.anthropic.com/api/organizations/*/claude_code_data_sharing` - Claude API
- `https://docs.anthropic.com/en/docs/claude-code/mcp` - MCP Documentation
- `https://docs.anthropic.com/en/docs/claude-code/sdk#command-line` - SDK CLI
- `https://docs.anthropic.com/en/docs/claude-code/settings` - Settings
- `https://console.anthropic.com/settings/billing` - Billing console
- `https://console.anthropic.com/settings/keys` - Key configuration

### Azure and Others
- `https://almsearch.dev.azure.com/{org}/{project}/_apis/search/semanticsearchstatus/{repo}?api-version=7.1-preview` - Azure DevOps Search
- `https://bedrock-runtime-fips.{Region}.{PartitionResult#dualStackDnsSuffix}` - AWS Bedrock
- `https://ces-dev1.azurewebsites.net/api/proxy/{n}` - Development proxy
- `https://mobile.events.data.microsoft.com/OneCollector/1.0` - Microsoft telemetry

### Other APIs
- `https://default.exp-tas.com/` - Experimentation service
- `https://registry.npmjs.org/${encodeURIComponent(t.name)}` - NPM Registry

## Important Discoveries

### Endpoint Consistency
- **VS Code uses exactly the same endpoints we test in our scripts**
- Access differences may be related to:
  - Specific authentication headers
  - Particular request parameters  
  - Authentication methods (OAuth vs personal token)
  - Different permission scopes

### Permission Configuration
Extensions use two authentication modes:
- `default` - Complete permissions (recommended) - Includes `read:user`, `user:email`, `repo`, `workflow`
- `minimal` - Minimum necessary permissions - Only `read:user`, `user:email`

### Important Headers Identified
During analysis, specific header references were found:
- `Authorization: Bearer {token}`
- `Content-Type: application/json`
- `Accept: application/vnd.github+json`
- `X-GitHub-Api-Version: 2025-07-16` - **🔑 CRITICAL VERSION DISCOVERED**
- `User-Agent: [VS Code specific]`
- `Integration-Id: [specific identifier]`

### ⭐ **Critical Discovery: API Version**
**X-GitHub-Api-Version: `2025-07-16`** is the specific version that:
- ✅ **Allows access to models endpoint**: `https://api.githubcopilot.com/models`
- ✅ **Enables GPT-5 and GPT-5 Mini**: Functional chat completions
- ❌ **Premium models require specific subscription**: GPT-4.1, GPT-4o, o3-mini return 403
- 🔍 **Improves general compatibility** with GitHub Copilot endpoints

**Mandatory use in all headers for maximum compatibility.**

## n8n Node Implementation

### Relevant Configurations
Based on discoveries, nodes can implement:

1. **Endpoint Fallback:** Test multiple endpoints in priority order
2. **Specific Headers:** Implement headers found in extensions  
3. **Debug Override:** Allow alternative endpoint configuration
4. **Optional Telemetry:** Implement telemetry if needed

### Priority URLs for Testing
1. `https://api.githubcopilot.com` - Primary
2. `https://copilot-proxy.githubusercontent.com` - Fallback
3. `https://api-model-lab.githubcopilot.com` - Development

### Suggested Next Steps
1. Monitor VS Code requests in real-time
2. Investigate differences between OAuth and personal token authentication
3. Test with different header combinations
4. Implement endpoint fallback system
5. Check if OAuth access has different privileges than personal token

## Implementation Notes

### Found Patterns
- All URLs follow HTTPS standard
- Main endpoints at `*.githubcopilot.com`
- Proxies at `*.githubusercontent.com`  
- Documentation at `docs.github.com` and `aka.ms/*`

### Security Considerations
- Tokens must be kept secure
- Debug endpoints for development only
- Telemetry is optional but recommended
- Rate limits apply to all endpoints

---

**Status**: ✅ Complete documentation based on systematic analysis of official VS Code Copilot extensions
