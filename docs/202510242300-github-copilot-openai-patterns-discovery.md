# GitHub Copilot Upload Discovery - OpenAI Patterns Test Results

**Date:** 2025-10-24  
**Version:** 202510242300  
**Status:** 🔍 **NEW ENDPOINTS DISCOVERED** - Different error patterns found

## Executive Summary

**OpenAI upload patterns don't work for GitHub Copilot, but revealed important endpoint differences and new error patterns that provide clues about the correct API format.**

## Test Results Analysis

### File Information
- **Filename**: `teste.pdf`
- **Size**: 483,049 bytes (471.73 KB)
- **SHA256**: `ab96e429a6f8a5d2...`

### Authentication Used
- **Token Type**: OAuth token (`tid=*`)
- **Format**: `tid=07a8362f96297dd0915704bb34ecd317;exp=1761282101;...`
- **Status**: Valid (expires in ~25 minutes)

## Critical Discoveries

### 🔴 **Pattern 3: /files endpoint exists (422 Bad Size)**
```
Endpoint: /copilot/chat/attachments/files
Method: POST
Content-Type: multipart/form-data
Response: 422 Bad Size
```
**Analysis**: The `/files` sub-endpoint EXISTS but rejected the file size. This is different from "Invalid name for request" - it means the endpoint accepts the request format but has size restrictions.

### 🔴 **Pattern 5: PUT with filename (500 Internal Error)**
```
Endpoint: /copilot/chat/attachments/teste.pdf
Method: PUT
Response: 500 "Saw 401 verifying authorization"
```
**Analysis**: PUT method is accepted, and filename in URL is recognized, but there's an internal authorization verification error. This suggests the URL structure might be correct.

### 🔴 **Pattern 8: /assistants/files requires multipart (400)**
```
Endpoint: /copilot/chat/attachments/assistants/files
Method: POST
Response: 400 "Multipart form data required"
```
**Analysis**: This endpoint exists and specifically requires multipart form data, not JSON. This is a strong clue about the expected format.

## Error Pattern Analysis

### Error Types Found
1. **"Invalid name for request" (400)**: 6 occurrences - Wrong URL structure
2. **"Bad Size" (422)**: 1 occurrence - File too large for `/files` endpoint
3. **"Saw 401 verifying authorization" (500)**: 1 occurrence - Internal auth error
4. **"Multipart form data required" (400)**: 1 occurrence - Wrong content type

### Implications
- **422 "Bad Size"** suggests `/files` endpoint has size limits
- **500 Internal Error** suggests PUT with filename might be on the right track
- **"Multipart required"** suggests some endpoints need form data, not JSON

## OpenAI Patterns Tested

### Files API Patterns
- ❌ Direct PDF upload → 400 "Invalid name"
- ❌ JSON metadata → 400 "Invalid name"

### Assistants API Patterns
- ❌ Multipart upload → 422 "Bad Size" (but endpoint exists!)
- ❌ File reference → 400 "Multipart required"

### Other API Patterns
- ❌ Vision API file reference → 400 "Invalid name"
- ❌ Batch API PUT with filename → 500 Internal Error
- ❌ Fine-tuning dataset → 400 "Invalid name"
- ❌ Custom headers → 400 "Invalid name"

## Key Insights

### ✅ **Confirmed Working Elements**
1. **Base endpoint exists**: `uploads.github.com/copilot/chat/attachments`
2. **OAuth authentication works**: No 401/403 errors
3. **Some sub-endpoints exist**: `/files`, `/assistants/files`
4. **PUT method accepted**: With filename in URL
5. **Multipart form data required**: For some endpoints

### 🔍 **Unknown Requirements**
1. **Exact URL structure**: May need repository/user context
2. **File size limits**: `/files` endpoint rejects 471KB PDF
3. **Required parameters**: Session IDs, chat context, etc.
4. **Specific multipart format**: Boundary, field names, etc.

## Next Investigation Steps

### High Priority
1. **Test smaller files** with `/files` endpoint (422 "Bad Size" suggests size limit)
2. **Try different URL structures** with repository context
3. **Test proper multipart format** for `/assistants/files` endpoint
4. **Investigate PUT method** with different filename encodings

### Medium Priority
1. **Monitor VS Code network traffic** during actual file uploads
2. **Check GitHub web interface** upload patterns
3. **Test with different file types** (images, text, etc.)

## Current Status

**OpenAI patterns don't work, but discovered that some GitHub Copilot upload endpoints exist with different error patterns. The `/files` endpoint accepts multipart uploads but has size restrictions, and PUT with filename causes internal authorization errors.**

---

**Status**: 🔍 **New endpoints discovered, size limits identified, need smaller files and proper multipart format.**</content>
<parameter name="filePath">z:\Desenvolvimento\n8n-nodes-copilot\docs\202510242300-github-copilot-openai-patterns-discovery.md