# Publishing Guide - n8n GitHub Copilot Nodes

## Overview
This document describes the process to publish the `n8n-nodes-github-copilot` package to NPM registry.

## Prerequisites

### 1. NPM Account Setup
- Ensure you have an NPM account with publish permissions
- Login to NPM: `npm login`
- Verify login: `npm whoami`

### 2. Version Management
- Update version in `package.json` following semantic versioning
- Use appropriate version increment:
  - **Patch** (x.x.X): Bug fixes, minor updates
  - **Minor** (x.X.x): New features, non-breaking changes  
  - **Major** (X.x.x): Breaking changes

### 3. Pre-publish Checklist
- [ ] All tests passing
- [ ] Code built successfully (`npm run build`)
- [ ] Lint checks passed (`npm run lint`)
- [ ] Documentation updated
- [ ] Version incremented in `package.json`

## Publishing Process

### Step 1: Build and Validate
```bash
# Navigate to project directory
cd z:\Desenvolvimento\n8n-nodes-copilot

# Clean build
npm run build

# Run lint checks
npm run lint

# Verify package contents
npm pack --dry-run
```

### Step 2: Version Update
```bash
# Update version (automatic)
npm version patch   # for bug fixes
npm version minor   # for new features  
npm version major   # for breaking changes

# Or manual update in package.json
```

### Step 3: Publish to NPM
```bash
# Publish to NPM registry
npm publish

# For scoped packages (if needed)
npm publish --access public
```

### Step 4: Verification
```bash
# Verify publication
npm view n8n-nodes-github-copilot

# Check latest version
npm view n8n-nodes-github-copilot version
```

## Package Information

### Current Package Details
- **Name**: `n8n-nodes-github-copilot`
- **Registry**: https://www.npmjs.com/package/n8n-nodes-github-copilot
- **Repository**: https://github.com/sufficit/n8n-nodes-github-copilot
- **License**: MIT

### Files Included in Distribution
```json
"files": [
  "dist"
]
```

### Build Output Structure
```
dist/
├── credentials/
│   ├── GitHubCopilotApi.credentials.js
│   └── GitHubCopilotOAuth2Api.credentials.js
├── nodes/
│   ├── GitHubCopilot/
│   ├── GitHubCopilotChatAPI/
│   ├── GitHubCopilotChatModel/
│   └── GitHubCopilotTest/
└── shared/
```

## Release Notes Template

### Version 3.27.0 - OAuth2 Integration
**Features Added:**
- ✅ New OAuth2 credential type (`GitHubCopilotOAuth2Api`)
- ✅ Device Flow OAuth support with helper script
- ✅ Credential type selector in all nodes
- ✅ Enhanced authentication options

**Nodes Updated:**
- GitHubCopilotChatModel - Added credential type selector
- GitHubCopilotChatAPI - Enhanced with OAuth2 support
- GitHubCopilot - Optional OAuth2 authentication
- GitHubCopilotTest - Testing with both credential types

**Files Added:**
- `get-copilot-token.js` - OAuth helper script
- `credentials/GitHubCopilotOAuth2Api.credentials.ts`

**Breaking Changes:**
- None (backward compatible)

## Troubleshooting

### Common Issues

#### 1. Login Problems
```bash
# Clear NPM cache
npm cache clean --force

# Re-login
npm logout
npm login
```

#### 2. Permission Errors
```bash
# Check account permissions
npm access list packages

# Verify organization membership (if applicable)
npm org ls sufficit
```

#### 3. Version Conflicts
```bash
# Check existing versions
npm view n8n-nodes-github-copilot versions --json

# Force version update
npm version <new-version> --force
```

#### 4. Build Issues
```bash
# Clean and rebuild
rm -rf dist/ node_modules/
npm install
npm run build
```

## Post-Publication

### 1. Verification Steps
- [ ] Package appears on NPM: https://www.npmjs.com/package/n8n-nodes-github-copilot
- [ ] Version number updated correctly
- [ ] Download and test installation: `npm install n8n-nodes-github-copilot`
- [ ] Verify in n8n community nodes catalog

### 2. Documentation Updates
- [ ] Update repository README with new version
- [ ] Tag GitHub release with version number
- [ ] Update changelog/release notes

### 3. Community Notification
- [ ] Update n8n community forum (if applicable)
- [ ] Social media announcement (if applicable)
- [ ] Internal team notification

## Security Considerations

### Token Management
- Never include `.token` file in published package
- Ensure `.gitignore` excludes sensitive files
- Verify `"files"` array in package.json only includes `dist/`

### Dependency Security
- Regularly update dependencies: `npm audit`
- Check for vulnerabilities before publishing
- Use `npm audit fix` to resolve issues

---

**Last Updated**: September 19, 2025
**Maintainer**: Sufficit Development Team
**Contact**: development@sufficit.com.br