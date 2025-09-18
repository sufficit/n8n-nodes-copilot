# GitHub Copilot API - Client and Integration IDs

## 🆔 Discovered Client IDs

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

## 🔄 TPM Headers
```
x-endpoint-client-forbidden: tpm:MODEL:clientID:CLIENT_NAME
x-endpoint-integration-forbidden: tpm:MODEL:clientID:CLIENT_NAME:integrationID:INTEGRATION_NAME
```

## � Key Points
- Each clientID has independent TPM quotas
- VS Code rotates between multiple clientIDs
- Different tokens use different client/integration pairs