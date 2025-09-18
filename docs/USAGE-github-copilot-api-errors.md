# GitHub Copilot API - Error Guide

## 🔑 Token Authentication

### ✅ Valid Token (403 Forbidden)
```http
Status: 403 - Forbidden
Headers: x-endpoint-client-forbidden, x-endpoint-integration-forbidden
Message: TPM quota exceeded
```
**Meaning**: Token authenticated, but quota exhausted (TPM = Transactions Per Minute)

### ❌ Invalid Token (401 Unauthorized)
```http
Status: 401 - Unauthorized  
Message: unauthorized: unauthorized: AuthenticateToken authentication failed
```
**Meaning**: Token completely rejected by API

### ❌ Unsupported Model (400 Bad Request)
```http
Status: 400 - Bad Request
Message: model not supported
```
**Meaning**: Model not available for account/organization

## 🏢 Account Types

### Enterprise Account

- ✅ Access to premium models (Claude, GPT-4, etc)
- ✅ TPM system with working retry mechanism
- ✅ Detailed headers with quota information

### Personal Account

- ❌ Authentication fails on API
- ❌ No access to enterprise endpoints
- ❌ Immediate 401 error

## 🎯 Testing Strategy

**IF error 401**: DO NOT retry  
**IF error 400 "model not supported"**: DO NOT retry  
**IF error 403**: Retry recommended (temporary quota)

## 🔄 TPM System (Transactions Per Minute)

```http
x-endpoint-client-forbidden: tpm:MODEL:clientID:CLIENT_NAME
```

**Observed ClientIDs**: vscode, dotnet_ai, java_on_azure, autodev_test

**Behavior**: Automatic rotation between clientIDs with independent quotas