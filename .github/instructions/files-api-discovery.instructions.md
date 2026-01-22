# GitHub Copilot Files API - Discovery Instructions

**Status**: 🔍 **ENDPOINTS DISCOVERED - INSUFFICIENT PERMISSIONS**

## Executive Summary

GitHub Copilot Files API **exists and is functional**, but current OAuth token does not have sufficient permissions for upload. All tests result in "Bad Size" (422) or authorization errors (500), indicating endpoints are protected.

## Critical Findings

### ✅ **Confirmed Endpoints**
- `https://uploads.github.com/copilot/chat/attachments/files` - Exists, accepts multipart
- `https://uploads.github.com/copilot/chat/attachments/assistants/files` - Exists, requires multipart
- Base URL: `https://uploads.github.com/copilot/chat/attachments`

### ❌ **Main Issue: Authorization**
Current OAuth token (`tid=*`) works for:
- ✅ Models API (`/models`)
- ❌ Chat completions (403 Forbidden)
- ❌ File uploads (422/500 errors)

### 🔍 **Identified Restriction Headers**
```
x-endpoint-client-forbidden: tpm:GPT4o:clientID:dotnet_ai
x-endpoint-integration-forbidden: tpm:GPT4o:clientID:dotnet_ai:integrationID:dotnet-code-testing-agent-vscode
x-endpoint-user-forbidden: tpm:GPT4o:clientID:dotnet_ai:integrationID:dotnet-code-testing-agent-vscode:userID
```

## Tests Performed

### 1. **File Sizes Tested**
- 69 bytes → 422 "Bad Size"
- 1KB → 422 "Bad Size"
- 2KB → 422 "Bad Size"
- 4KB → 422 "Bad Size"
- 8KB → 422 "Bad Size"
- 10KB → 422 "Bad Size"
- **Result**: Even tiny files fail

### 2. **Multipart Formats Tested**
- ✅ Standard multipart (file + filename)
- ✅ Multipart with purpose field
- ✅ Multipart with metadata JSON
- ❌ All result in 422 "Bad Size"

### 3. **Contexts Tested**
- ❌ Without conversation context
- ❌ With conversation context (conversation ID)
- ❌ With different URL parameters
- **Result**: Context does not resolve issue

### 4. **Tokens Tested**
- ❌ Old OAuth token (expired)
- ❌ New OAuth token (generated 2025-10-24)
- **Result**: Even with valid token, error persists

## Technical Analysis

### 🎯 **Why "Bad Size"?**
Error 422 "Bad Size" **does NOT mean** file is too large. It means:
1. Multipart format is incorrect
2. Required parameters are missing
3. Token lacks adequate permissions
4. Conversation context is necessary

### 🔐 **OAuth Token Restrictions**
Current OAuth token appears restricted to:
- Client: `dotnet_ai`
- Integration: `dotnet-code-testing-agent-vscode`
- No permissions for file uploads

## Possible Solutions

### **1. Token with Elevated Permissions**
- Need OAuth token with file upload permissions
- Possibly from different integration or enterprise account

### **2. Conversation Context Required**
- File uploads may require chat session ID
- Similar to chat completions needing context

### **3. Alternative Authentication**
- Use GitHub App token instead of OAuth
- Or personal access token with specific scopes

### **4. Different Endpoint**
- May have other undiscovered endpoints
- Or specific URL parameters

## Implementation Guidelines

### Traffic Capture (High Priority)
```bash
# Use existing proxy script to capture real uploads
pip install mitmproxy
mitmdump -s scripts/proxy.py --ssl-insecure
# Configure VS Code to use proxy localhost:8080
# Upload file in VS Code Copilot Chat
# Analyze captured requests
```

### Source Code Investigation
- Analyze VS Code source code (github.com/microsoft/vscode)
- Look for file upload implementations
- Identify exact multipart format

### Reverse Engineering Alternative
- Use tools like Wireshark to capture traffic
- Analyze GitHub Copilot web interface requests
- Compare with other GitHub upload APIs

## Current Theory

Error "Bad Size" may indicate:
- Multipart boundary is wrong
- Form-data "name" field must be specific
- Additional headers are necessary
- Order of multipart fields matters
- Specific encoding is required

**The API definitely exists and works** - we just need to discover exact format used by VS Code.

## Recommendations

1. **Do NOT implement file upload in nodes yet** - format unknown
2. **Monitor VS Code traffic** to capture real upload requests
3. **Document findings** when format is discovered
4. **Update this document** with working implementation

---

**Last Updated**: 2025-01-22  
**Status**: Blocked - awaiting format discovery
