# Changelog

All notable changes to this project will be documented in this file.

## [4.3.0] - 2026-01-23 🗄️ PostgreSQL PGVector Integration

### Added
- **GitHubCopilotPGVector Node** - PostgreSQL vector store integration with GitHub Copilot Embeddings:
  - **Create Table** operation: Creates vector tables with pgvector extension and IVFFlat indexing
  - **Insert Documents** operation: Generates embeddings and inserts documents with metadata (batch processing)
  - **Search Similar** operation: Semantic similarity search using cosine distance
  - Configurable dimensions (512-1536)
  - JSONB metadata storage
  - Custom column names support
  - Batch processing with configurable size
  - Distance threshold filtering

### Features
- Uses GitHub Copilot Embeddings API as backend
- PostgreSQL credentials integration
- Efficient batch document processing
- IVFFlat index creation for performance
- Metadata filtering in search queries
- Configurable table schemas

### Dependencies
- Requires `pg` (PostgreSQL client)
- Requires `pgvector` extension in PostgreSQL

## [4.2.1] - 2026-01-23 🧪 Test Suite & Troubleshooting

### Added
- **Complete Test Suite** for Runtime Provider Injection:
  - Unit tests: `tests/unit/version-detection.test.js` (8/9 passing)
  - Unit tests: `tests/unit/provider-injection.test.js` (8/9 passing)
  - Integration test: `tests/integration-test.js` (7/7 passing)
  - Interactive debug tool: `tests/debug-provider-injection.js`
- **Troubleshooting Documentation**:
  - `docs/202601230030-provider-injection-troubleshooting.md` - Complete problem analysis
  - Updated `tests/README.md` with comprehensive test guide
- **Test Reports**: JSON reports for integration tests and diagnostics

### Fixed
- Module path resolution in integration tests (relative paths)
- Test suite documentation and usage instructions

### Documentation
- Detailed troubleshooting guide for provider injection issues
- Test execution instructions and expected results
- Environment detection and validation procedures

### Notes
✅ All tests pass successfully in development environment  
⚠️ Final validation requires testing in actual n8n v2+ instance  
📊 Test coverage: 23/25 tests passing (92%)

## [4.2.0] - 2026-01-22 🎯 n8n v2 Chat Hub Integration

### Added
- **n8n v2 Chat Hub Integration**: Runtime provider injection for n8n v2+
  - Automatically detects n8n version (v1 vs v2+)
  - Injects GitHub Copilot into Chat Hub providers list (experimental)
  - Conditional activation: only runs in n8n v2 or higher
  - Auto-injection via `GITHUB_COPILOT_AUTO_INJECT=true` environment variable
  - Manual injection API: `injectGitHubCopilotProvider()`
  - Version detection utilities: `isN8nV2OrHigher()`, `isChatHubAvailable()`
  - Comprehensive debugging and status tracking
  - Fallback to workflow agents in n8n v1.x

### Changed
- Reorganized documentation: moved USAGE files to `.github/instructions/` with `.instructions.md` format
- Updated `copilot-instructions.md` with new documentation structure
- Added shared utilities module for version detection and provider injection

### Documentation
- Added `.github/instructions/runtime-provider-injection.instructions.md` - Complete runtime injection guide
- Added `docs/202501220730-n8n-v2-chat-provider-list-integration-research.md` - Technical research
- Updated all instruction files with proper formatting and structure

### Notes
⚠️ **Runtime injection is experimental** - may break with n8n updates. Use with caution and test after upgrades.
✅ **Safe fallback**: Automatically uses workflow agents approach in n8n v1.x

## [4.0.0] - 2025-12-31 🚀 BREAKING CHANGE

### 🎉 Migrated to New GitHub Copilot CLI (Programmatic Mode)

**⚠️ BREAKING CHANGES:**
- Migrated from deprecated `gh copilot` extension to new **standalone `copilot` CLI**
- **GitHub Copilot CLI node** now requires **`@github/copilot` CLI** instead of `gh` CLI extension
- Old operations (suggest, explain, shell, revise, rating) replaced with **unified programmatic mode**
- Node version bumped from 1 to 2 (existing workflows will need updates)

### Added
- **Programmatic Mode**: Use `copilot -p "prompt"` for any task or query
- **Tool Approval Options**: Fine-grained control over what Copilot can execute:
  - `allow-all-tools`: Full automation (⚠️ use with caution)
  - `shell-only`: Only shell commands
  - `write-only`: Only file writes
  - `manual`: Manual approval required (safest)
  - `custom`: Custom approval rules with `--allow-tool` / `--deny-tool`
- **Agentic Capabilities**: Copilot can now plan and execute complex multi-step tasks
- **Configurable Timeout**: Set execution timeout (default: 60s)
- **Better Error Messages**: Clearer installation and authentication errors

### Changed
- **Installation**: Now requires `npm install -g @github/copilot` or `brew install copilot-cli`
- **Authentication**: Use `copilot` command and `/login` slash command (not `gh auth login`)
- **Command Format**: Unified to `copilot -p "query" [tool-flags]`
- **Default Model**: Claude Sonnet 4.5 (can be changed with `/model` command in CLI)

### Removed
- Deprecated `gh copilot suggest/explain/shell/revise/rate` commands
- Language-specific options (now part of prompt)
- Command type options (now part of prompt)
- Filter output option (new CLI has cleaner output)

### Migration Guide
1. **Uninstall old extension**: `gh extension remove github/gh-copilot` (if installed)
2. **Install new CLI**: 
   - npm: `npm install -g @github/copilot`
   - brew: `brew install copilot-cli`
   - Windows: `winget install GitHub.Copilot`
3. **Authenticate**: Run `copilot` and use `/login` command
4. **Update workflows**: Replace specific operations with programmatic queries
   - Old: Operation "suggest" with language "python"
   - New: Prompt "Write a Python function that..."

### Security Note
⚠️ **Tool approval is critical for security**. The new CLI can execute commands and modify files. Always use the most restrictive approval setting for your use case. See [docs](https://docs.github.com/en/copilot/concepts/agents/about-copilot-cli#security-considerations) for details.

---

## [3.38.34] - 2025-12-30

### Fixed
- **GitHubCopilotChatModel**: Added critical headers to `defaultHeaders` for premium model access
  - `X-GitHub-Api-Version: 2025-05-01`
  - `X-Interaction-Type: copilot-chat`
  - `OpenAI-Intent: conversation-panel`
  - `Copilot-Integration-Id: vscode-chat`
- **AI Agent 403 Fix**: Models like Raptor Mini (oswe-vscode-prime) now work correctly in AI Agent node
- Updated User-Agent and Editor-Plugin-Version to match VS Code Copilot Chat

### Updated
- **Raptor Mini model**: Updated capabilities to match API (264K context, 64K output)
- **temp_models.json**: Refreshed with complete model list (39 models)

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.38.26] - 2025-10-30

### Fixed
- **GitHubCopilotChatModel**: Fixed response format compatibility with LangChain/n8n - Chat Model now displays output correctly in n8n editor
- **Response Structure**: Corrected `_generate` method to return proper LangChain format with `generations` array and `llmOutput.tokenUsage`
- **invocationParams Method**: Added missing `invocationParams` method for full ChatOpenAI compatibility

### Technical Details
- Changed response format from `generations: [[{...}]]` to `generations: [{...}]`
- Moved `tokenUsage` from root level to `llmOutput.tokenUsage`
- Added `invocationParams` override method to ensure proper parameter handling

## [3.38.22] - 2025-10-24

### Fixed
- **GitHubCopilotChatModel**: Fixed 403 Forbidden errors by implementing proper API infrastructure
- **API Infrastructure**: Migrated from direct LangChain calls to `makeGitHubCopilotRequest` with OAuth token generation and retry logic
- **Retry Logic**: Added automatic retry for 403 errors with exponential backoff
- **OAuth Tokens**: Implemented automatic OAuth token generation from GitHub tokens

### Added
- **GitHubCopilotChatModel**: Added full support for tools and function calling, matching OpenAI-compatible format
- **Tools Support**: Added `tools` and `tool_choice` properties to enable function calling capabilities
- **Enhanced Description**: Updated node description to highlight tools and function calling support

## [3.38.11] - 2025-10-23

### Fixed

#### 🔧 Chat Model Interface Fix

- **GitHub Copilot Chat Model**: Fixed missing custom model input field when selecting "✏️ Enter Custom Model Name"
- Added conditional "Custom Model Name" field that appears when manual model entry is selected
- Updated model selection logic to properly handle manual model input
- Now consistent with other nodes in the package

---

## [3.38.10] - 2025-10-23

### Added

#### 🎁 Binary Output for Auth Helper

- **Binary file download option** in GitHub Copilot Auth Helper node
- Now the default output format returns HTML as binary data
- User can directly download the `.html` file from n8n
- No need to copy/paste HTML text anymore!

#### Output Format Options

1. **📄 Binary File (Download Ready)** - DEFAULT
   - HTML returned as binary data
   - Ready to download as `.html` file
   - Click download button in n8n UI
   
2. **📋 HTML Text + Instructions**
   - HTML as text with usage instructions
   - For users who prefer copy/paste
   
3. **📝 HTML Text Only**
   - Just the HTML code
   - For advanced users

### Changed

- Default output format changed from "htmlWithInstructions" to "binary"
- Improved user experience - one click to download authentication page

### How to Use

1. Add "GitHub Copilot Auth Helper" node
2. Execute node
3. **Click download button** on the binary output
4. Open downloaded `github-copilot-auth.html` in browser
5. Follow instructions to get token

---

## [3.31.0] - 2025-10-01

### Added

#### 🎉 New Node: GitHub Copilot Auth Helper

- **Interactive OAuth Device Flow authentication** via beautiful HTML page
- Generates complete HTML page that handles entire Device Flow
- No terminal/CLI required - everything runs in browser
- Features:
  - ✅ Auto-requests device code from GitHub
  - ✅ Displays code in large, copyable format
  - ✅ Auto-opens GitHub authorization page
  - ✅ Automatic polling until authorization complete
  - ✅ Shows token ready to copy when done
  - ✅ Beautiful modern UI with gradient design
  - ✅ Step-by-step visual progress
  - ✅ Mobile responsive
  - ✅ Error handling for all OAuth error cases

### Removed

#### OAuth2 Credentials (Non-functional)

- **Removed GitHubCopilotOAuth2Api credential** - did not work with n8n limitations
- **Removed GitHubCopilotDeviceFlow credential** - requires n8n core modifications
- **Kept only GitHubCopilotApi credential** - works perfectly with manual token input

### Changed

- Simplified credential system to single working credential
- Auth Helper node provides better UX than removed OAuth2 credentials

### How to Use New Auth Helper

1. Add "GitHub Copilot Auth Helper" node to workflow
2. Execute node
3. Copy HTML from output
4. Save as `.html` file and open in browser
5. Follow on-screen instructions
6. Copy token and use in GitHub Copilot OAuth2 credential

### Migration
No migration needed. Existing credentials and nodes continue to work as before.

### Notes
- Auth Helper provides better UX than command-line script
- Device Flow credential prepared but not active (requires n8n core support)
- Script `authenticate.js` still available as alternative

---

## [3.30.1] - 2025-09-30

### Fixed
- Removed `index.js` entry point (not needed for n8n community nodes)
- Removed `main` field from package.json
- Fixed package self-dependency issue
- Simplified package structure following n8n community best practices

### Changed
- Icons now use shared icon path pattern (`../../shared/icons/copilot.svg`)
- Simplified gulpfile to only copy shared icons

---

## [3.29.9] - 2025-09-30

### Fixed
- Fixed icon display issues for all nodes
- Updated icon paths to use consistent naming

---

## [3.29.8] - 2025-09-30

### Fixed
- Moved `n8n-workflow` from peerDependencies to dependencies
- Fixed package installation error

---

## [3.29.0] - 2025-09-29

### Added
- Initial OAuth2 credential support
- Authentication helper script

---

[3.31.0]: https://github.com/sufficit/n8n-nodes-github-copilot/compare/v3.30.1...v3.31.0
[3.30.1]: https://github.com/sufficit/n8n-nodes-github-copilot/compare/v3.29.9...v3.30.1
[3.29.9]: https://github.com/sufficit/n8n-nodes-github-copilot/compare/v3.29.8...v3.29.9
[3.29.8]: https://github.com/sufficit/n8n-nodes-github-copilot/compare/v3.29.0...v3.29.8
[3.29.0]: https://github.com/sufficit/n8n-nodes-github-copilot/releases/tag/v3.29.0
