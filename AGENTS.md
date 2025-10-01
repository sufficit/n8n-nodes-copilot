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

- **[implementation-summary.md](docs/implementation-summary.md)**: Technical implementation overview and architecture decisions
- **[oauth2-integration.md](docs/oauth2-integration.md)**: OAuth2 authentication setup and configuration guide
- **[USAGE-github-copilot-api-errors.md](docs/USAGE-github-copilot-api-errors.md)**: Common API errors troubleshooting guide
- **[USAGE-github-copilot-client-integration-ids.md](docs/USAGE-github-copilot-client-integration-ids.md)**: Client integration IDs configuration
- **[USAGE-github-copilot-knowing-endpoints.md](docs/USAGE-github-copilot-knowing-endpoints.md)**: Available API endpoints reference
- **[USAGE-github-copilot-models-api.md](docs/USAGE-github-copilot-models-api.md)**: Models API usage and configuration
- **[USAGE-oauth2-implementation.md](docs/USAGE-oauth2-implementation.md)**: OAuth2 implementation best practices
- **[USAGE-publish.md](docs/USAGE-publish.md)**: Package publishing and deployment instructions

## Key Features

- CLI integration via gh copilot commands
- Chat API with GPT-4, Claude, Gemini models
- Image processing and analysis
- OpenAI format compatibility
- OAuth2 and API key authentication
- Streaming responses support
