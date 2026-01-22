# GitHub Copilot API - Client and Integration IDs Instructions

## Discovered Client IDs

### GitHub CLI Token
```
clientID: copilot_4_cli
integrationID: copilot-4-cli
```

### VS Code Token
```
clientID: vscode
integrationID: vscode
```

### Additional Client IDs
- `dotnet_ai`
- `java_on_azure` 
- `autodev_test`

## TPM Headers

```http
x-endpoint-client-forbidden: tpm:MODEL:clientID:CLIENT_NAME
x-endpoint-integration-forbidden: tpm:MODEL:clientID:CLIENT_NAME:integrationID:INTEGRATION_NAME
```

## Key Points

- Each clientID has independent TPM quotas
- VS Code rotates between multiple clientIDs
- Different tokens use different client/integration pairs

## Usage in Nodes

When implementing GitHub Copilot nodes:

1. **Headers**: Include appropriate client/integration IDs in request headers
2. **Quota Management**: Monitor TPM headers to detect quota exhaustion
3. **ClientID Rotation**: Implement rotation strategy if needed
4. **Error Handling**: Parse TPM headers from error responses

### Example Implementation

```typescript
const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2025-07-16',
    'editor-version': 'vscode/1.95.0',
    'editor-plugin-version': 'copilot-chat/0.22.4',
};
```

## ClientID Strategy

### For Generic Clients
Use generic identifiers like:
- `n8n`
- `n8n-github-copilot`
- Custom integration name

### For Specific Integrations
Match the integration pattern:
- clientID: Your application name
- integrationID: Your integration identifier

---

**Last Updated**: 2025-01-22
