# USAGE: N8N AI Agent Node

## Overview

The **N8N AI Agent** node provides direct access to N8N's built-in AI Agent functionality, allowing you to leverage the same powerful tools and capabilities available in GitHub Copilot through N8N's native AI interface. This connector reuses the proven infrastructure and patterns from the GitHub Copilot Chat API node.

## Prerequisites

### 1. N8N AI Agent Enabled
- Ensure AI Agent is enabled in your N8N instance
- This feature may require N8N version 1.0+ or specific configuration
- Contact your N8N administrator if AI Agent is not available

### 2. N8N API Access
- Configure N8N API credentials in the node settings
- Obtain API key from your N8N instance settings
- Ensure proper permissions for AI Agent access

## Features

### 🤖 **AI Chat Operations**
- **Natural Language Conversations**: Direct chat with AI models
- **Multi-Model Support**: GPT-4, Claude, Gemini, and other AI models
- **Context Management**: Maintain conversation history and context
- **System Instructions**: Configure AI behavior with system messages

### 🛠️ **Tool Execution**
- **Built-in Tools**: Access N8N's comprehensive tool library
- **Custom Tools**: Execute specific tools through AI Agent
- **Tool Chaining**: Combine multiple tools in complex workflows
- **Smart Tool Selection**: AI automatically chooses appropriate tools

### 🧠 **Memory Management**
- **Context Storage**: Store and retrieve conversation context
- **Memory Operations**: Save, load, and clear AI memory
- **Session Management**: Maintain state across workflow executions
- **Context Sharing**: Share context between different workflow nodes

### 🖼️ **Media Support**
- **Image Analysis**: Upload and analyze images with AI
- **File Processing**: Process various file types through AI
- **Multiple Input Sources**: Manual upload, URL, or binary property
- **Format Support**: JPEG, PNG, GIF, WebP image formats

## Configuration

### Basic Settings

#### **Server Configuration**
```
N8N Server URL: https://your-n8n-instance.com
API Key: your-n8n-api-key
```

#### **Model Selection**
- **GPT-4 Turbo**: Latest OpenAI model with enhanced capabilities
- **GPT-4**: High-quality reasoning and code generation
- **GPT-3.5 Turbo**: Fast and efficient for simple tasks
- **Claude 3**: Anthropic's advanced reasoning model
- **Gemini Pro**: Google's multimodal AI model

### Operation Types

#### **1. Chat Operation**
Send conversational messages to the AI Agent.

**Parameters:**
- **Message**: Your question or instruction to the AI
- **System Message**: Optional system instructions to guide AI behavior
- **Include Media**: Enable image/file upload capabilities
- **Temperature**: Control response creativity (0.0-2.0)
- **Max Tokens**: Limit response length
- **Stream Response**: Enable real-time streaming responses

**Example Usage:**
```
Message: "Analyze this sales data and provide insights"
System Message: "You are a business analyst expert"
Temperature: 0.7
Max Tokens: 1000
```

#### **2. Tools Operation**
Execute specific tools through the AI Agent.

**Parameters:**
- **Tool Request**: Describe what tool functionality you need
- **Available Tools**: Select from N8N's tool library
- **Tool Parameters**: Configure tool-specific settings
- **Auto-Execute**: Let AI choose and execute tools automatically

**Example Usage:**
```
Tool Request: "Search for customer data in CRM"
Available Tools: ["crm_search", "data_analysis", "report_generation"]
Auto-Execute: true
```

#### **3. Memory Operation**
Manage AI Agent memory and context.

**Parameters:**
- **Memory Action**: save, load, clear, or update
- **Context ID**: Unique identifier for memory session
- **Memory Content**: Data to store or retrieve
- **Expiry Time**: How long to retain memory

**Example Usage:**
```
Memory Action: "save"
Context ID: "customer_session_123"
Memory Content: "Customer preferences and history"
Expiry Time: "24h"
```

## Usage Examples

### Example 1: Data Analysis Chat
```json
{
  "operation": "chat",
  "model": "gpt-4-turbo",
  "message": "Analyze the sales trends in the uploaded CSV file",
  "includeMedia": true,
  "mediaSource": "manual",
  "systemMessage": "You are a data analyst. Provide actionable insights.",
  "temperature": 0.3
}
```

### Example 2: Automated Tool Execution
```json
{
  "operation": "tools",
  "model": "claude-3",
  "toolRequest": "Generate a customer report from the CRM data",
  "availableTools": ["crm_connector", "report_generator", "email_sender"],
  "autoExecute": true
}
```

### Example 3: Context Management
```json
{
  "operation": "memory",
  "memoryAction": "save",
  "contextId": "workflow_session_456",
  "memoryContent": "{{$json.previous_analysis}}",
  "expiryTime": "12h"
}
```

## Advanced Configuration

### **Media Processing**
- **Supported Formats**: JPEG, PNG, GIF, WebP, PDF (first page)
- **Size Limits**: Up to 20MB per file
- **Processing**: Automatic format detection and optimization
- **URL Support**: Direct image URLs or base64 encoded data

### **Streaming Responses**
- **Real-time Output**: See AI responses as they're generated
- **Partial Processing**: Handle responses before completion
- **Progress Tracking**: Monitor long-running operations
- **Error Handling**: Graceful handling of connection issues

### **Error Handling**
- **Retry Logic**: Automatic retry for temporary failures
- **Fallback Models**: Switch to alternative models on errors
- **Detailed Logging**: Comprehensive error information
- **Rate Limiting**: Respect API usage limits

## Integration Patterns

### **Workflow Chaining**
1. **Data Collection** → N8N AI Agent (analyze)
2. **AI Analysis** → Decision Node (route based on insights)
3. **Action Execution** → N8N AI Agent (generate report)
4. **Report Generation** → Email/Slack notification

### **Multi-Model Strategy**
- Use **GPT-4** for complex reasoning tasks
- Use **Claude** for document analysis
- Use **Gemini** for multimodal processing
- Use **GPT-3.5** for simple, fast operations

### **Memory Persistence**
- Store conversation context across workflow runs
- Maintain user preferences and settings
- Cache analysis results for reuse
- Share insights between different workflows

## Troubleshooting

### **Common Issues**

#### **Authentication Errors**
```
Error: "Invalid N8N API key"
Solution: Check API key and N8N instance URL
```

#### **AI Agent Not Available**
```
Error: "N8N AI Agent endpoint not found"
Solution: Ensure AI Agent is enabled in your N8N instance
```

#### **Tool Execution Failures**
```
Error: "Tool not available"
Solution: Check available tools in your N8N instance
```

### **Performance Optimization**
- Use appropriate model for task complexity
- Implement caching for repeated operations
- Optimize media file sizes
- Use streaming for long responses

## Comparison with GitHub Copilot Chat API

| Feature | N8N AI Agent | GitHub Copilot Chat API |
|---------|--------------|-------------------------|
| **Models** | N8N configured models | GitHub's model selection |
| **Tools** | N8N native tools | GitHub Copilot tools |
| **Memory** | Built-in context management | Manual state management |
| **Integration** | Native N8N workflow | External API calls |
| **Media** | N8N media processing | GitHub API limitations |
| **Cost** | N8N licensing | GitHub Copilot subscription |

## Best Practices

1. **Model Selection**: Choose the right model for your specific use case
2. **Context Management**: Use memory operations to maintain state
3. **Error Handling**: Implement proper retry and fallback logic
4. **Performance**: Monitor response times and optimize accordingly
5. **Security**: Protect API keys and sensitive data in workflows
6. **Documentation**: Document complex AI workflows for team collaboration

## Related Documentation

- [GitHub Copilot Chat API Usage](./USAGE-github-copilot-chat-api.md)
- [Authentication Guide](./USAGE-authentication.md)
- [File Upload Documentation](./USAGE-github-copilot-file-upload.md)
- [Audio Investigation Results](./USAGE-github-copilot-audio-investigation.md)