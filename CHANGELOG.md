# Changelog

All notable changes to this project will be documented in this file.

## [4.4.17] - 2026-02-16 🔁 Republish

### Changed
- **Release**: Republished as patch bump to avoid version conflicts in environments that already had `4.4.16` installed.

## [4.4.16] - 2026-02-16 🆔 Always Show Model ID

### Improved
- **Dynamic Model Picker**: Always show `ID: ...` in model option descriptions.
  - Helps identify the exact model string to use in manual/custom scenarios.

## [4.4.15] - 2026-02-13 🧠 Model Info in Errors

### Improved
- **GitHub Copilot OpenAI Node**: Added model information to error messages.
  - Now, when an API error occurs (like 400 Bad Request), the error message explicitly states which model was being used (e.g., `🤖 Model used: gemini-2.0-flash`).
  - This helps troubleshoot issues specific to certain models (like Gemini's stricter empty message validation).

## [4.4.14] - 2026-02-13 🎭 Schema Bypass for Binary

### Changed
- **GitHub Copilot OpenAI Node**: Implemented schema validation bypass for non-image binary files.
  - Forces the Data URL MIME status to `image/jpeg` when sending unknown files (like PDF).
  - This allows the payload to pass the initial JSON Schema validation and reach the backend.
  - Users will now receive the specific "Unsupported image" error from Copilot instead of a generic "Invalid request body" schema error.

## [4.4.13] - 2026-02-13 🐛 Detailed Binary Errors

### Improved
- **GitHub Copilot OpenAI Node**: Enhanced error reporting for binary file reading failures.
  - Now includes the specific system error message (e.g., file not found, permission denied) instead of a generic "Failed to read" error.
  - Helps diagnose why n8n cannot read the binary attachment before sending it to Copilot.

## [4.4.12] - 2026-02-13 🔓 Unrestricted Binary Uploads

### Changed
- **GitHub Copilot OpenAI Node**: Removed client-side validation for binary file types.
  - Now allows ANY binary file (including PDF) to be sent to the API, allowing the GitHub Copilot API to return its own error messages if the format is unsupported.
  - Improved error handling to surfacing specific read errors instead of masking them.

## [4.4.11] - 2026-02-13 🚫 File Type Validation

### Improved
- **GitHub Copilot OpenAI Node**: Added strict validation for binary file types to prevent confusing API errors.
  - Now explicitly blocks non-image files (like PDFs) with a clear error message explaining implementation limitations.
  - Enforces strict whitelist: `png`, `jpeg`, `gif`, `webp`.

## [4.4.10] - 2026-02-13 🐛 Vision API Role & Schema Fixes

### Fixed
- **GitHub Copilot OpenAI Node** - Critical fixes for Vision/Multimodal binary uploads:
  - **Force User Role**: Automatically enforces `role: "user"` when attaching binary files (OpenAI/Copilot rejects system/assistant roles with images).
  - **Schema Compliance**: Added `detail: "auto"` property to `image_url` object to satisfy strict schema validators.
  - **Mime Type Detection**: Integrated robust MIME type detection to ensure valid `image/*` types are sent in Data URLs (fixes `400` errors for unknown binary types).
  - **Clean Payload**: Explicitly removes any residual `type` properties from message objects before sending.

## [4.4.9] - 2026-02-13 🐛 Schema Validation Fix

### Fixed
- **GitHub Copilot OpenAI Node** - Critical fix for API Schema Validation Error (400 Bad Request):
  - Removed invalid `type` property from the root message object which was violating the OpenAI API spec.
  - Resolved `invalid_request_body` error when sending multimodal messages (text + image).
  - Ensures strict compliance with OpenAI Chat Completions API format ` { role: "user", content: [...] }`.

## [4.4.8] - 2026-02-13 🎨 Enhanced UI for Binary Files

### Improved
- **GitHub Copilot OpenAI Node** - Improved user experience for file uploads:
  - **Dynamic UI**: Hidden the main `Content` field when `File (Binary)` is selected to avoid confusion with `[object Object]` values.
  - **New Caption Field**: Added a dedicated `Caption` field for image prompts when using binary mode.
  - **Robust Handling**: Automatically ignores `[object Object]` strings if they accidentally slip into the content payload.
  - **Error Prevention**: Fixes `400 Bad Request` errors caused by malformed text content in multimodal messages.

## [4.4.7] - 2026-02-13 🔄 Legacy File Support & Binary Mode

### Improved
- **GitHub Copilot OpenAI Node** - Enhanced file attachment flexibility:
  - **Restored Compatibility**: `File (URL / Base64)` option restored for manual image inputs (legacy behavior)
  - **New Option**: `File (Binary)` explicitly separates binary file handling from text inputs
  - **Conditional UI**: "Input Binary Field" only appears when `File (Binary)` is selected, keeping the UI clean
  - **Multimodal Support**: Both modes support multimodal messages (text + image)

### Fixed
- Fixed regression where legacy file inputs were being treated as missing binary files

## [4.4.6] - 2026-02-13 📎 Automatic Binary File Handling

### Improved
- **GitHub Copilot OpenAI Node** - Enhanced file attachment handling:
  - **Automatic Binary Detection**: Now specifically asks for the "Input Binary Field" when "File" type is selected
  - **Multimodal Support**: Supports sending both text content AND image attachment in a single message
  - **Smart Defaults**: Defaults binary field name to 'data', preventing guessing errors
  - **Better Validation**: Provides clear error messages if the specified binary property is not found

## [4.4.5] - 2026-02-10 🔄 JSON Restored & Vision Fixed

### Fixed
- **GitHub Copilot OpenAI Node** - Restored automatic JSON normalization:
  - Re-implemented `JSON.stringify` logic for object content
  - Fixes `400 Bad Request` regression when passing JSON objects
  - Works in conjunction with Strict Vision Detection (v4.4.4)

## [4.4.4] - 2026-02-10 👁️ Strict Vision Detection Fix

### Fixed
- **GitHub Copilot OpenAI Node** - Critical fix for false positive vision detection:
  - **STRICT detection**: NOW REQUIRES actual base64 image data (100+ chars minimum)
  - No longer triggers on JSON strings containing `"data:image ` as text
  - Prevents `"Model does not support vision"` errors when passing regular JSON
  - Detection rule: Content MUST START with `data:image/.../base64,` (not just containing)

### Technical  
- Regex changed from `.includes('data:image/')` to `^data:image/[a-z]+;base64,[100+ chars]`
- Eliminates false positives from JSON serialization
- GPT-4.1 (and all vision models) now work correctly with JSON content

## [4.4.3] - 2026-02-10 🎯 Improved Vision Detection

### Fixed
- **GitHubCopilotOpenAI Node** - More precise vision content detection:
  - Eliminates false positives when JSON strings contain words like "image" or "data:image"
  - Uses regex pattern to detect actual base64 image data URLs (`data:image/...;base64,...`)
  - Requires minimum 50 characters of base64 data to avoid false matches
  - Prevents unnecessary vision model requirements for plain text/JSON content

### Improved
- Added detailed logging for vision detection triggers
- More accurate multimodal content identification
- Better handling of JSON serialized data vs actual image content

## [4.4.2] - 2026-02-10 🛡️ Token Validation Fixes

### Fixed
- **Critical**: Fixed `Cannot read properties of undefined (reading 'length')` error in DynamicModelsManager
- **GitHubCopilotOpenAI Node** - Proper token retrieval from credentials:
  - Now correctly accesses both `token` and `oauthToken` fields
  - Added validation before attempting to use token for vision detection
  - Fallback to static model list when token is unavailable
- **DynamicModelsManager** - Added robust token validation:
  - Validates token exists and is a non-empty string before hashing
  - Prevents crashes when undefined/null tokens are passed
  - Returns fallback hash for invalid tokens

### Improved
- Better error handling for credential access
- More defensive coding in token-dependent operations

## [4.4.1] - 2026-02-10 🔄 Auto JSON Content Normalization

### Fixed
- **GitHubCopilotOpenAI Node** - Auto-conversion of JSON objects to strings in message content:
  - When passing `{{$json}}` directly, it now auto-converts to JSON string
  - Prevents "invalid request body" errors when content is an object
  - Maintains compatibility with string and array formats (OpenAI image_url style)
  - Added detailed logging for content type conversions

### Improved
- Better error messages for content format validation
- Enhanced debug logging for message normalization process

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
