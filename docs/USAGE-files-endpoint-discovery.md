# GitHub Copilot Files Endpoint Discovery

## Overview

The Files endpoint implementation is currently **BLOCKED** because the expected API endpoints don't exist or return errors. We're using proxy interception to discover the real API patterns used by VS Code.

## Current Status

- ❌ `/files` endpoint: 404 Not Found
- ❌ `/copilot/chat/attachments` endpoint: 400 "Invalid name for request"
- 🔍 **Active**: Proxy interception to capture real VS Code requests

## Tools Created

### 1. Enhanced Proxy (`scripts/proxy.py`)

- **Purpose**: Intercept HTTPS requests from VS Code to GitHub Copilot
- **Features**:
  - Optional filtering by request content
  - JSON output to `temp/mitm-captured-*.json`
  - Request/response body capture

### 2. Proxy Runner (`scripts/run-proxy.py`)

- **Purpose**: Convenience script to start mitmdump with proper configuration
- **Usage**:

  ```bash
  # Filter for attachment requests only
  python scripts/run-proxy.py --filter attachment

  # Capture all requests
  python scripts/run-proxy.py
  ```

### 3. Request Analyzer (`scripts/analyze-captured.py`)

- **Purpose**: Analyze captured request files
- **Features**:
  - Summarize endpoints, methods, content types
  - Filter analysis by text patterns
  - Show sample requests

### 4. Setup Test (`scripts/test-proxy-setup.py`)

- **Purpose**: Verify proxy setup and token validity
- **Tests**:
  - Token format validation
  - API connectivity
  - Proxy connection

## Discovery Process

### Step 1: Setup Proxy

```bash
# Test setup first
python scripts/test-proxy-setup.py

# Start proxy with attachment filtering
python scripts/run-proxy.py --filter attachment
```

### Step 2: Configure VS Code

1. Install mitmproxy CA certificate (follow terminal instructions)
2. Configure VS Code proxy: `http://localhost:8080`
3. Restart VS Code

### Step 3: Generate Attachment Requests

1. Open Copilot Chat in VS Code
2. Attach a file (image, text, document)
3. Ask Copilot about the attached file
4. Generate multiple requests with different file types

### Step 4: Analyze Captured Data

```bash
# Analyze all captured requests
python scripts/analyze-captured.py

# Filter for attachment-related requests
python scripts/analyze-captured.py --filter attachment

# Analyze specific file
python scripts/analyze-captured.py --file temp/mitm-captured-chat-20251023_121957.json
```

## Expected Findings

From VS Code source code analysis, we expect to find:

1. **Upload Endpoint**: Likely `/copilot/chat/attachments` or similar
2. **Request Format**: Multipart form-data with binary file data
3. **Headers**: `Content-Type: multipart/form-data` or `application/octet-stream`
4. **Parameters**: File metadata (name, type, size)

## Next Steps

1. **Capture Real Requests**: Use proxy to capture actual VS Code attachment uploads
2. **Analyze Patterns**: Identify correct endpoint, headers, and parameters
3. **Implement Files Node**: Create n8n node based on discovered patterns
4. **Test Integration**: Verify file upload/management works in workflows

## Files to Monitor

- `temp/mitm-captured-*.json`: Captured request files
- `AGENTS.md`: Updated status and findings
- `docs/`: New documentation when patterns are discovered

## Troubleshooting

### Proxy Not Capturing Requests

- Ensure VS Code proxy is set to `http://localhost:8080`
- Check if mitmproxy CA certificate is installed
- Restart VS Code after proxy configuration

### No Attachment Requests

- Try different file types (images, PDFs, text files)
- Ensure file is actually attached in Copilot Chat
- Check if Copilot has necessary permissions

### Analysis Shows No Data

- Verify proxy is running and capturing
- Check file paths in `temp/` directory
- Try without filter first: `python scripts/analyze-captured.py`

## 2025-10-23 - BREAKTHROUGH: Working File Upload Format Discovered! 🎉

### Direct API Testing Success

**We successfully discovered a working file upload format through direct API testing!**

#### Working Format:
```json
{
  "messages": [
    {"role": "user", "content": "Please analyze this file"},
    {"role": "user", "content": "data:text/plain;base64,SGVsbG8gV29ybGQ=", "type": "file"}
  ]
}
```

#### Key Findings:
- **✅ Files sent within `/chat/completions` requests** (not separate endpoint)
- **✅ Base64 encoded with data URL format**: `data:text/plain;base64,<base64_content>`
- **✅ Two-message structure**: text prompt + file content with `type: "file"`
- **✅ Works with text files**
- **❌ Access denied to individual.githubcopilot.com** (403 error)

#### Test Results:
- **Models endpoint**: ✅ 200 OK (38 models found)
- **Chat completions**: ❌ 403 Forbidden (individual endpoint)
- **File upload format**: ✅ 200 OK (with data URL + type: "file")

#### File Type Support:
- **✅ JSON files**: Working
- **✅ Binary data**: Working  
- **❌ Text files**: 403 Forbidden (content restrictions?)

#### Alternative Formats Discovered:
- **Format A**: Single message with file content + metadata
  ```json
  {
    "messages": [
      {
        "role": "user",
        "content": "data:application/json;base64,eyJuYW1lIjoidGVzdCJ9",
        "type": "file",
        "filename": "data.json"
      }
    ]
  }
  ```

#### Technical Details:
- **Endpoint**: `/chat/completions` (not `/files` or `/attachments`)
- **Encoding**: `data:<mime-type>;base64,<base64_data>`
- **Message Format**: Two user messages (prompt + file) OR single message with metadata
- **File Property**: `type: "file"` on file message
- **Supported Types**: JSON, binary data (text may be restricted)

#### Files Created:
- `temp/test-direct-api.py`: Direct API testing script with working format
- `temp/test-file-formats.py`: Comprehensive file format testing

#### Next Steps:
1. **Fix proxy interception** to capture real VS Code requests
2. **Compare VS Code format** with discovered format
3. **Test other file types** (images, PDFs, binary files)
4. **Implement GitHubCopilotFiles node** with working format
5. **Add OpenAI-compatible file operations**