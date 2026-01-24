# Publishing Instructions - n8n GitHub Copilot Nodes

## Overview
This document describes the process to publish the `n8n-nodes-github-copilot` package to NPM registry.

## Prerequisites

### 1. NPM Account Setup
- Ensure you have NPM account with publish permissions
- Login to NPM: `npm login`
- Verify login: `npm whoami`

#### Authentication Token Setup (Recommended for Automation)

To avoid repeated password prompts during publishing, configure authentication tokens:

**Option 1: Token Files (Recommended)**

Create separate token files in the project root:

```bash
# NPM automation token
echo "npm_your_token_here" > .npm.token

# GitHub personal access token
echo "ghp_your_token_here" > .github.token
```

**Option 2: config.json (Alternative)**

Create or edit `config.json` in project root:

```json
{
  "github": {
    "token_file": ".github.token",
    "token": ""
  },
  "npm": {
    "token_file": ".npm.token",
    "token": ""
  }
}
```

**Token Generation:**

1. **NPM Token**: Visit https://www.npmjs.com/settings/[username]/tokens
   - Create "Automation" token (recommended) or "Publish" token
   - Copy token to `.npm.token` file

2. **GitHub Token**: Visit https://github.com/settings/tokens
   - Create Personal Access Token with `repo` and `workflow` scopes
   - Copy token to `.github.token` file

**Security Notes:**
- ✅ Token files (`.npm.token`, `.github.token`) are automatically excluded by `.gitignore` (pattern: `*.token`)
- ✅ `config.json` is also excluded from version control
- ⚠️ Never commit tokens to Git repositories
- ⚠️ Use token files instead of inline tokens in config.json for better security

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
│   ├── GitHubCopilotEmbeddings/
│   ├── GitHubCopilotFiles/
│   ├── GitHubCopilotOpenAI/
│   ├── GitHubCopilotSpeech/
│   └── GitHubCopilotTest/
└── shared/
```

## Release Notes Template

### Version Format
```markdown
### Version X.Y.Z - Feature Name

**Features Added:**
- ✅ Feature 1 description
- ✅ Feature 2 description
- ✅ Feature 3 description

**Nodes Updated:**
- NodeName1 - Update description
- NodeName2 - Update description

**Files Added/Modified:**
- `path/to/file1.ts` - Description
- `path/to/file2.ts` - Description

**Breaking Changes:**
- None (or list breaking changes)
```

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

**Protected Files:**
- `.npm.token` - NPM authentication token
- `.github.token` - GitHub personal access token
- `config.json` - Configuration file with token references
- All `*.token` files - Excluded by `.gitignore` pattern

**Verification:**
```bash
# Verify .gitignore includes token protection
grep -E "\*\.token|config\.json" .gitignore

# Expected output:
# *.token
# config.json
```

**Best Practices:**
- ✅ Never include token files in published package
- ✅ Ensure `.gitignore` excludes sensitive files
- ✅ Verify `"files"` array in package.json only includes `dist/`
- ✅ Use token files instead of hardcoding tokens in scripts
- ✅ Rotate tokens periodically (every 90 days recommended)
- ⚠️ Never commit `config.json` with populated token fields

### Dependency Security
- Regularly update dependencies: `npm audit`
- Check for vulnerabilities before publishing
- Use `npm audit fix` to resolve issues

## Publication Workflow

```
1. Development
   ↓
2. Testing
   ↓
3. Version Update
   ↓
4. Build
   ↓
5. Lint Check
   ↓
6. Dry Run
   ↓
7. Publish
   ↓
8. Verification
   ↓
9. Documentation
   ↓
10. Notification
```

## Version History Best Practices

### Changelog Maintenance
- Keep CHANGELOG.md updated
- Use semantic versioning
- Document all changes clearly
- Include migration guides for breaking changes

### Git Tags
```bash
# Create annotated tag
git tag -a v3.37.0 -m "Release version 3.37.0"

# Push tags
git push origin --tags
```

### GitHub Releases
- Create release on GitHub for each version
- Include release notes
- Attach built artifacts if needed
- Link to documentation

---

**Last Updated**: 2026-01-24
**Maintainer**: Sufficit Development Team
**Contact**: development@sufficit.com.br
