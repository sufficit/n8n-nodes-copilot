# Changelog

All notable changes to this project will be documented in this file.

## [3.38.41] - 2025-12-30

### Fixed

- **Vision Fallback**: Improved detection of vision content in text messages (data URLs and `copilot-file://` references)
- **Vision Fallback**: Fixed static capability check in `Chat Model` node
- **Vision Fallback**: Added `multimodal` capability check for broader model support
- **Vision Fallback**: Fallback now triggers even if "Include Media" is false but vision content is found in message

## [3.38.40] - 2025-12-30

### Added

- **Dynamic Model Management**: Implemented `DynamicModelsManager` with 1-hour caching
- **Dynamic Capabilities**: System now prioritizes API-provided capabilities over static definitions
- **Model Sync**: Synchronized static model list with June 2025 API data (GPT-5, Claude 4.5, Grok)
- **Billing Multiplier**: Added support for `billing.multiplier` via `X-GitHub-Api-Version: 2025-05-01`

## [3.38.36] - 2025-12-30

### Added

- **GitHubCopilotChatAPI**: Vision Fallback feature
  - **Enable Vision Fallback** in Advanced Options
  - **Vision Fallback Model** dropdown (vision-capable models only)
  - **Custom Vision Model** for manual model id entry
  - Automatic model switching when primary model doesn't support vision
- **GitHubCopilotOpenAI**: Vision Fallback feature
  - Same options as ChatAPI for consistency
  - Auto-detection of vision content in messages
  - Proper Copilot-Vision-Request header when images detected

### Fixed

- **GitHubCopilotApiUtils**: Removed duplicated code causing TypeScript compilation errors
- **Vision Fallback UI**: Options now properly appear in Advanced Options collection
- **Response metadata**: Added `usedVisionFallback` and `originalModel` fields when fallback is used

## [3.38.35] - 2025-12-30

### Added

- **GitHubCopilotChatModel**: Vision Fallback feature
  - **Enable Vision Fallback** checkbox to use a separate vision-capable model when the primary model doesn't support vision
  - **Vision Fallback Model** dropdown (loads only models with Vision capability)
  - **Vision Fallback Custom Model Name** field for manual model id entry
  - Automatic upload/integration with GitHub Copilot Files endpoint for image processing

### Fixed

- **GitHubCopilotChatModel**: Auto-enable vision for models that support vision; fallback to configured model for images when needed
- **Upload**: Added `uploadFileToCopilot` helper to handle multipart uploads and replace image URLs with file references

### Updated

- **temp_models.json**: Refreshed with complete model list (39 models)


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
