# AI Agent Instructions for n8n-nodes-github-copilot

## Project Overview

n8n community node package for GitHub Copilot integration with CLI, Chat API, and AI models access.

## Available Nodes

- **GitHubCopilot**: CLI integration for suggest, explain, shell, revise operations
- **GitHubCopilotChatAPI**: Direct Chat API access with image support and streaming
- **GitHubCopilotChatModel**: AI Chat Model for workflows with multiple model support
- **GitHubCopilotOpenAI**: OpenAI-compatible interface for GitHub Copilot Chat API
- **GitHubCopilotTest**: Testing and validation node for API responses

## Documentation Files

### Instruction Files (.github/instructions/)
- **[auth-helper-node.instructions.md](.github/instructions/auth-helper-node.instructions.md)**: Auth Helper Node usage and implementation guide
- **[api-errors.instructions.md](.github/instructions/api-errors.instructions.md)**: Common API errors troubleshooting guide
- **[models-api.instructions.md](.github/instructions/models-api.instructions.md)**: Models API usage and configuration
- **[knowing-endpoints.instructions.md](.github/instructions/knowing-endpoints.instructions.md)**: Available API endpoints reference
- **[client-integration-ids.instructions.md](.github/instructions/client-integration-ids.instructions.md)**: Client integration IDs configuration
- **[files-api-discovery.instructions.md](.github/instructions/files-api-discovery.instructions.md)**: Files API discovery findings and status
- **[publish.instructions.md](.github/instructions/publish.instructions.md)**: Package publishing and deployment instructions
- **[runtime-provider-injection.instructions.md](.github/instructions/runtime-provider-injection.instructions.md)**: n8n v2 Chat Hub provider injection (experimental)

### Discovery Documentation (docs/)
- **[implementation-summary.md](docs/implementation-summary.md)**: Technical implementation overview and architecture decisions
- **Timestamped files**: Research findings and technical discoveries (format: YYYYMMDDHHMM-*.md)

## Key Features

- CLI integration via gh copilot commands
- Chat API with GPT-4, Claude, Gemini models
- Image processing and analysis
- OpenAI format compatibility
- OAuth2 and API key authentication
- Streaming responses support
- n8n v2 Chat Hub integration (runtime provider injection)

## Next Tasks

### 🔜 Files Endpoint Implementation

**Priority**: High  
**Description**: Implement file upload and management functionality using GitHub Copilot Files API endpoint.

**Requirements**:

- Support file upload to GitHub Copilot API
- File management (list, retrieve, delete)
- Integration with existing nodes (ChatAPI, OpenAI)
- OpenAI-compatible format for file operations
- Proper error handling and validation

**API Endpoint**: `/files` (GitHub Copilot API)

**Related**:

- OpenAI Files API compatibility
- File processing for chat context
- Document analysis capabilities

**Status**: Pending implementation


