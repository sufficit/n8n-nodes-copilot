# Copilot Instructions - n8n GitHub Copilot Nodes
* **Version**: 202601220530
* **Description**: This file provides guidelines and instructions for developing n8n GitHub Copilot nodes.
* **Repository**: https://github.com/sufficit/n8n-nodes-copilot
* **VS Code Copilot Chat Repository**: https://github.com/microsoft/vscode-copilot-chat

## Versioning
* **Version Format**: YYYYMMDDHHMM (UTC timezone)
* **Update Rule**: MUST update version for ANY modification to copilot-instructions.md
* **Timezone**: Always use UTC (GMT+0) for timestamp consistency

## Discovery Documentation
* **Discovery docs**: Use timestamp format YYYYMMDDHHMM as prefix
* **Format**: `YYYYMMDDHHMM-description.md` for research findings and usage discoveries
* **Location**: Save in `./docs/` folder with timestamp prefix

## Usage Instructions
* **Usage instructions**: Context-specific guidance for using project features
* **Format**: `feature-name.instructions.md` (no timestamp prefix)
* **Location**: Save in `./.github/instructions/` folder
* **Purpose**: Provide AI agents and developers with implementation guidance
* **Examples**: auth-helper-node.instructions.md, api-errors.instructions.md, models-api.instructions.md

## Table of Contents
- [Versioning](#versioning)
- [Discovery Documentation](#discovery-documentation)
- [Usage Instructions](#usage-instructions)
- [General Guidelines](#general-guidelines)
- [Token Configuration](#token-configuration)
- [Security and Best Practices](#security-and-best-practices)
- [Node Architecture](#node-architecture)
- [GitHub Copilot Models](#github-copilot-models)
- [Testing and Debugging](#testing-and-debugging)
- [GitHub Copilot API](#github-copilot-api)

## General Guidelines
* **ALL CODE**: Write in English (comments, variables, functions, documentation)
* **ALL DOCUMENTATION**: Write in English (README, docs, comments)
* **ALL COMMIT MESSAGES**: Write in English
* **USER RESPONSES**: Use IDE language (Portuguese when VS Code is in Portuguese)
* **SCRIPT HEADERS**: All script/test files MUST have header comment explaining purpose and usage
* Evitar mudanças em código não relacionado à query
* Usar TypeScript com tipagem rigorosa
* Seguir padrões do n8n community nodes

## Token Configuration

### 🔑 **Token Location**
The GitHub Copilot token is stored in the file:
```
./.token
```

### 🔐 **Token Security Rules**
* ❌ **NEVER** place tokens explicitly in documentation, example code, or commits
* ✅ **ALWAYS** reference the `.token` file using relative path (`./`)
* ✅ **ALWAYS** use `fs.readFileSync('./.token', 'utf8').trim()` to load token in test scripts
* ❌ **NEVER** use absolute paths for token files (ex: `Z:/Desenvolvimento/...`)
* ✅ **ALWAYS** use relative paths for cross-system compatibility

### 📋 **Token Loading Pattern**
```javascript
// CORRECT METHOD - use in all test scripts
const fs = require('fs');
const token = fs.readFileSync('./.token', 'utf8').trim();

// Format validation
if (!token.startsWith('gho_')) {
    throw new Error('Token must be a GitHub Copilot token (format: gho_*)');
}
```

### 🧪 **Test Scripts**
* All test scripts should point to `./.token`
* Include token format validation (`gho_*`)
* Never expose complete token in logs (only first 10 characters)
* Use safe debug: `token.substring(0, 10) + '...'`

## Security and Best Practices

### 🔒 **Token Handling**
1. **File .token**: Should contain only the GitHub Copilot token (format `gho_*`)
2. **Safe Logging**: Always mask tokens in logs and debug
3. **Validation**: Check format before using
4. **Error Handling**: Error messages should not expose tokens

### 📝 **Documentation**
1. **Code Examples**: Use placeholders like `gho_XXXXX` or reference file
2. **Paths**: Always relative, never absolute
3. **Scripts**: Include security comments
4. **README**: Clear instructions about token configuration

## Node Architecture

### 🏗️ **Project Structure**
```
n8n-nodes-copilot/
├── .token                          # Token GitHub Copilot (gho_*)
├── nodes/
│   ├── GitHubCopilotChatModel/     # AI Chat Model node
│   └── GitHubCopilotChatAPI/       # Direct API node
├── credentials/
│   └── GitHubCopilotApi.credentials.ts
├── scripts/                        # Utility scripts (auth, models update)
├── tests/                          # Test scripts and results
├── shared/                         # Shared utilities and models
├── temp/                           # Temporary files (auto-clean)
├── docs/                           # Internal documentation
└── README.md                       # Project documentation
```

### 📁 **File Organization Rules**

#### 🎯 **Root Directory Policy**
* **ONLY ESSENTIAL FILES**: Keep only core project files in root
* **Allowed in Root**: `package.json`, `tsconfig.json`, `gulpfile.js`, `LICENSE`, `README.md`, `.token`
* **Forbidden in Root**: Test scripts, legacy code, backup files, temporary artifacts

#### 🗂️ **Folder Guidelines**
* **`./scripts/`**: **PERMANENT SCRIPTS ONLY** - User-approved utilities (auth, models update)
* **`./tests/`**: All test files, results, and analysis scripts  
* **`./temp/`**: **DEFAULT for new scripts** - Temporary files, backups, experimental code
* **`./docs/`**: Documentation with timestamp prefix (YYYYMMDDHHMM-*)
* **`./shared/`**: Reusable utilities and model definitions
* **`./nodes/`**: n8n node implementations only

#### 🧹 **File Management**
* **New Scripts**: Create in `./temp/` by default unless user specifies permanent
* **Script Promotion**: Move from `./temp/` to `./scripts/` only when user confirms permanence
* **Backup Files**: Use `./temp/` folder, include timestamp in filename
* **Legacy Scripts**: Move to appropriate folder or delete if obsolete
* **Temporary Files**: Auto-clean files older than 30 days in `./temp/`
* **JSON Results**: Store in `./tests/` with descriptive names

#### ⚠️ **Script Creation Rules**
* **Default Location**: All new scripts go to `./temp/` unless explicitly requested permanent
* **User Decision**: Only user can approve moving scripts from `./temp/` to `./scripts/`
* **Temporary First**: Even utility scripts start in `./temp/` until proven valuable

### 🎯 **Node Types**
1. **GitHubCopilotChatModel**: AI Chat Model compatible with LangChain
2. **GitHubCopilotChatAPI**: Direct API access to GitHub Copilot

### 🔧 **Implemented Features**
* Token validation with `gho_*` format
* Debug mode with secure logging
* Robust error handling
* Compatibility with providers: OpenAI, Anthropic, Google, Microsoft

## GitHub Copilot Models

### 📋 **Models File**
The `./models.json` file contains the **complete and updated list** of all models available via GitHub Copilot API.

### 🎯 **Property `model_picker_enabled`**
**Essential for filtering relevant models:**
- `true`: Model enabled for interface (12 models)
- `false`: Model disabled/obsolete (16 models)  
- **Always use**: `model.model_picker_enabled !== false` to filter

### 📊 **Current Summary**
- ✅ **Total**: 28 models available in API
- ✅ **Enabled**: 12 models for interface
- ✅ **Providers**: Azure OpenAI (5), Anthropic (5), Google (2)
- ✅ **Functional**: GPT-5, GPT-5 Mini (verified)

### 📖 **Complete Documentation**
For detailed information about models, API endpoint, practical implementations and fallback strategies:

**➡️ See: `./.github/instructions/models-api.instructions.md`**

## Testing and Debugging

### 🧪 **Test Folder**
The `./tests/` folder contains automated test scripts that follow security guidelines.

**IMPORTANT**:
- ✅ **All tests** automatically load data from `./models.json` and `./.token` files
- ✅ **Never hardcode** models or tokens in scripts
- ✅ **Always use relative paths** for compatibility
- ✅ **Generate reports** in JSON format for analysis

### 📋 **Available Scripts**
* `./tests/test-all-models.js` - Tests all models from `models.json` file
* `./tests/README.md` - Complete test documentation

### 🎯 **Pattern for New Tests**
```javascript
// Standard structure for test scripts
const fs = require('fs');

// Load token (CORRECT METHOD)
const token = fs.readFileSync('./.token', 'utf8').trim();
if (!token.startsWith('gho_')) {
    throw new Error('Token must be gho_* format');
}

// Load models (CORRECT METHOD)  
const modelsData = JSON.parse(fs.readFileSync('./models.json', 'utf8'));
const models = modelsData.data.filter(m => m.model_picker_enabled !== false);

// Execute tests...
// Save results in ./tests/results-*.json
```

### 🧪 **Legacy Test Scripts**
* `verify-personal-copilot.js`: Tests personal account access (DEPRECATED - use tests/)
* `verify-mcp-github-settings.js`: Checks organizational settings via MCP

### 🐛 **Debug Guidelines**
1. **Token Masking**: Always use `token.substring(0, 10) + '...'`
2. **Error Logging**: Include status codes and relevant headers
3. **API Testing**: Test individual models to identify limitations
4. **Organization Access**: Check billing and available seats

### 📊 **Monitoring**
* Automatic verification of organizations with 0 seats
* Available model cache (5 minutes)
* Detection of providers restricted by subscription

## GitHub Copilot API

### **Main Endpoints**
* **Models**: `https://api.githubcopilot.com/models`
* **Chat Completions**: `https://api.githubcopilot.com/chat/completions`
* **Organization Billing**: `https://api.github.com/orgs/{org}/copilot/billing`

### 🔑 **Authentication**
```javascript
headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
}
```

### 📋 **Known Limitations**
1. **Personal vs Organizational Account**: Available models vary
2. **Provider Restrictions**: Anthropic/Google may require specific subscription
3. **Rate Limits**: Applied per provider and subscription
4. **Organization Seats**: Required for full access to premium models

---

**Note**: This project implements complete integration with GitHub Copilot API, following strict security practices for token handling and maximum compatibility with different subscription types.
