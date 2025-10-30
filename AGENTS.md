# AI Agent Instructions for n8n-nodes-github-copilot

## Project Overview

n8n community node package for GitHub Copilot integration with CLI, Chat API, and AI models access.

## Available Nodes

- **GitHubCopilot**: CLI integration for suggest, explain, shell, revise operations
- **GitHubCopilotChatAPI**: Direct Chat API access with image support and streaming
- **GitHubCopilotChatModel**: AI Chat Model for workflows with multiple model support
- **GitHubCopilotOpenAI**: OpenAI-compatible interface for GitHub Copilot Chat API
- **GitHubCopilotTest**: Testing and validation node for API responses

## Documentation Files (docs/)

### Core Documentation
- **[implementation-summary.md](docs/implementation-summary.md)**: Technical implementation overview and architecture decisions
- **[USAGE-github-copilot-models-api.md](docs/USAGE-github-copilot-models-api.md)**: Models API usage and configuration
- **[USAGE-github-copilot-knowing-endpoints.md](docs/USAGE-github-copilot-knowing-endpoints.md)**: Available API endpoints reference
- **[USAGE-github-copilot-api-errors.md](docs/USAGE-github-copilot-api-errors.md)**: Common API errors troubleshooting guide

### Authentication
- **[USAGE-oauth2-implementation.md](docs/USAGE-oauth2-implementation.md)**: OAuth2 implementation best practices

### Other
- **[USAGE-github-copilot-client-integration-ids.md](docs/USAGE-github-copilot-client-integration-ids.md)**: Client integration IDs configuration
- **[USAGE-publish.md](docs/USAGE-publish.md)**: Package publishing and deployment instructions

## Key Features

- CLI integration via gh copilot commands
- Chat API with GPT-4, Claude, Gemini models
- Image processing and analysis
- OpenAI format compatibility
- OAuth2 and API key authentication
- Streaming responses support

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


