# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
