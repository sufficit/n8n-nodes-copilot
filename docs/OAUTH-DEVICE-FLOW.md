# GitHub OAuth Device Flow - Análise e Replicação

**Data**: 2025-10-01  
**Objetivo**: Documentar o fluxo OAuth Device Code usado no script `authenticate.js` para replicação nas credenciais n8n

## 📋 Visão Geral

O script `authenticate.js` implementa o **GitHub OAuth Device Flow** (Device Code Grant) de forma **100% funcional**, seguindo exatamente o mesmo método usado pelo VS Code para obter tokens GitHub Copilot.

## 🎯 Fluxo Completo (4 Passos)

### **PASSO 1: Obter Device Code**

**Endpoint**: `https://github.com/login/device/code`  
**Método**: POST  
**Content-Type**: `application/x-www-form-urlencoded`

**Parâmetros**:
```javascript
{
  client_id: "01ab8ac9400c4e429b23",  // VS Code Client ID
  scope: "repo user:email"             // Permissões necessárias
}
```

**Resposta**:
```json
{
  "device_code": "código_longo_aleatório",
  "user_code": "XXXX-XXXX",           // Código para usuário digitar
  "verification_uri": "https://github.com/login/device",
  "verification_uri_complete": "https://github.com/login/device?user_code=XXXX-XXXX",
  "expires_in": 900,                   // 15 minutos
  "interval": 5                        // Polling interval em segundos
}
```

### **PASSO 2: Usuário Autoriza**

1. **Abrir URL**: `verification_uri_complete` (ou `verification_uri`)
2. **Fazer login** no GitHub (se necessário)
3. **Confirmar código**: `user_code` (XXXX-XXXX)
4. **Autorizar aplicação**: Conceder permissões `repo` e `user:email`

**Automação no Script**:
```javascript
// Abre navegador automaticamente
const command = process.platform === "win32" 
  ? `explorer "${urlToOpen}"` 
  : `open "${urlToOpen}"`;
exec(command);

// Aguarda usuário pressionar tecla após autorização
await waitForKeypress();
```

### **PASSO 3: Polling para Token**

**Endpoint**: `https://github.com/login/oauth/access_token`  
**Método**: POST  
**Content-Type**: `application/x-www-form-urlencoded`

**Parâmetros**:
```javascript
{
  client_id: "01ab8ac9400c4e429b23",
  device_code: "código_obtido_no_passo_1",
  grant_type: "urn:ietf:params:oauth:grant-type:device_code"
}
```

**Respostas Possíveis**:

1. **Sucesso** (200 OK):
```json
{
  "access_token": "gho_XXXXXXXXXXXXXXXX",
  "token_type": "bearer",
  "scope": "repo,user:email"
}
```

2. **Aguardando autorização** (400):
```json
{
  "error": "authorization_pending"
}
```
👉 Continuar polling (aguardar 5 segundos)

3. **Rate limit** (400):
```json
{
  "error": "slow_down"
}
```
👉 Aguardar mais tempo (10 segundos)

4. **Expirado** (400):
```json
{
  "error": "expired_token"
}
```
👉 Recomeçar do PASSO 1

5. **Negado** (400):
```json
{
  "error": "access_denied"
}
```
👉 Usuário negou autorização

**Lógica de Polling**:
```javascript
for (let attempt = 1; attempt <= 30; attempt++) {
  const tokenResponse = await fetch(ACCESS_TOKEN_URL, { /* ... */ });
  const tokenData = await tokenResponse.json();

  if (tokenData.access_token) {
    return tokenData.access_token;  // ✅ Sucesso!
  }

  if (tokenData.error === "authorization_pending") {
    await sleep(5000);  // Aguardar 5s
    continue;
  }

  if (tokenData.error === "slow_down") {
    await sleep(10000);  // Aguardar 10s
    continue;
  }

  // Outros erros: falhar
  throw new Error(tokenData.error);
}
```

### **PASSO 4: Obter Token Copilot (Opcional)**

**Endpoint**: `https://api.github.com/copilot_internal/v2/token`  
**Método**: GET  
**Headers**:
```javascript
{
  "Authorization": "token gho_XXXXXXXXXXXXXXXX",  // Token do PASSO 3
  "Accept": "application/vnd.github+json",
  "X-GitHub-Api-Version": "2025-04-01",
  "User-Agent": "GitHub-Copilot-Chat/1.0.0 VSCode/1.85.0",
  "Editor-Version": "vscode/1.85.0",
  "Editor-Plugin-Version": "copilot-chat/0.12.0"
}
```

**Resposta**:
```json
{
  "token": "token_copilot_específico",
  "expires_at": 1234567890,
  "refresh_in": 600,
  "sku": "copilot_individual",
  "chat_enabled": true,
  "organization_list": [],
  "limited_user_quotas": {
    "chat": 500,
    "completions": 5000
  }
}
```

**IMPORTANTE**: 
* ✅ O token do PASSO 3 (`gho_*`) **já funciona** como token GitHub Copilot
* ⚙️ O PASSO 4 apenas converte para formato específico e retorna metadados
* 🎯 **Recomendação**: Usar diretamente o token `gho_*` do PASSO 3

## 🔑 Credenciais e URLs Importantes

### **Client ID (VS Code)**
```
01ab8ac9400c4e429b23
```
* Oficial do Visual Studio Code
* Público e amplamente usado
* Não requer client secret para Device Flow

### **Scopes Necessários**
```
repo user:email
```
* `repo`: Acesso aos repositórios (necessário para Copilot)
* `user:email`: Acesso ao email do usuário

### **URLs do Fluxo**

| Etapa | URL | Método |
|-------|-----|--------|
| 1. Device Code | `https://github.com/login/device/code` | POST |
| 2. Autorização | `https://github.com/login/device` | Browser |
| 3. Access Token | `https://github.com/login/oauth/access_token` | POST |
| 4. Copilot Token | `https://api.github.com/copilot_internal/v2/token` | GET |

## 📊 Comparação: Script vs n8n OAuth2

### **Script Atual (authenticate.js)**

✅ **Vantagens**:
* Fluxo completo automatizado
* Abre navegador automaticamente
* Polling inteligente com rate limiting
* Mostra instruções claras ao usuário
* Salva token em arquivo
* Testa token automaticamente

❌ **Desvantagens**:
* Requer execução manual em terminal
* Não integrado ao n8n
* Token expira (precisa reautenticar)

### **n8n OAuth2 Credentials (Atual)**

✅ **Vantagens**:
* Integrado na interface do n8n
* Interface visual para usuário
* Token armazenado de forma segura

❌ **Limitações Atuais**:
* Não implementa Device Flow
* Depende de input manual do token
* Não oferece automação do fluxo

## 🎯 Replicação para n8n OAuth2 Credentials

### **Opção 1: Manter Fluxo Atual (RECOMENDADO)**

**Justificativa**:
* O script `authenticate.js` **já funciona perfeitamente**
* Device Flow OAuth requer interação de usuário (não pode ser 100% automatizado)
* n8n OAuth2 nativo não suporta Device Flow (requer callback URL)

**Implementação**:
```typescript
// GitHubCopilotOAuth2Api.credentials.ts
displayName: "GitHub Copilot OAuth2 (Device Flow Helper)"

properties: [
  {
    displayName: "🎯 Como obter seu token",
    name: "instructions",
    type: "notice",
    default: "",
    description: `
      <h3>Execute o script de autenticação:</h3>
      <ol>
        <li>Abra terminal na pasta do projeto</li>
        <li>Execute: <code>node scripts/authenticate.js</code></li>
        <li>Siga as instruções do script</li>
        <li>Copie o token exibido</li>
        <li>Cole abaixo</li>
      </ol>
      
      <p><strong>O script faz automaticamente:</strong></p>
      <ul>
        <li>✅ Inicia OAuth Device Flow</li>
        <li>✅ Abre navegador para autorização</li>
        <li>✅ Aguarda sua confirmação</li>
        <li>✅ Obtém e testa o token</li>
      </ul>
    `
  },
  {
    displayName: "Access Token",
    name: "accessToken",
    type: "string",
    typeOptions: { password: true },
    default: "",
    required: true,
    description: "Token obtido via script de autenticação"
  }
]
```

### **Opção 2: Criar Helper Web (AVANÇADO)**

Criar endpoint web no n8n que implementa Device Flow:

1. **n8n expõe endpoint**: `/oauth/github-copilot/device-flow`
2. **Frontend n8n** chama endpoint e exibe instruções
3. **Polling no backend** aguarda autorização
4. **Token retornado** e salvo automaticamente

**Complexidade**: Alta  
**Benefício**: Fluxo completamente integrado  
**Risco**: Requer modificações no core do n8n

### **Opção 3: Criar Workflow n8n (INTERMEDIÁRIO)**

Criar workflow n8n que implementa o Device Flow:

1. **Webhook trigger** inicia o fluxo
2. **HTTP Request nodes** implementam os 4 passos
3. **Wait node** aguarda autorização do usuário
4. **Set node** retorna token

**Complexidade**: Média  
**Benefício**: Não requer modificações de código  
**Limitação**: Usuário precisa executar workflow separadamente

## 🔒 Segurança e Best Practices

### **Client ID Público**
```
01ab8ac9400c4e429b23
```
* ✅ É seguro usar este Client ID (oficial do VS Code)
* ✅ Device Flow não requer client secret
* ✅ Token é vinculado ao usuário que autorizou

### **Token Storage**
* ❌ **NUNCA** comitar tokens em Git
* ✅ Usar `.token` file (gitignored)
* ✅ n8n encripta tokens no banco de dados
* ✅ Tokens expiram em ~8 horas (renovar quando necessário)

### **Scopes Mínimos**
```
repo user:email
```
* São os **mínimos necessários** para Copilot
* Não solicitar permissões extras desnecessárias

### **Rate Limiting**
* Respeitar `interval` retornado no device code (5s)
* Aumentar intervalo se receber `slow_down` (10s)
* Limitar tentativas (máximo 30 = 2.5 minutos)

### **Error Handling**
```javascript
// Sempre tratar todos os erros possíveis
const ERROR_HANDLERS = {
  "authorization_pending": () => waitAndRetry(5000),
  "slow_down": () => waitAndRetry(10000),
  "expired_token": () => restartFlow(),
  "access_denied": () => userDeniedAccess(),
  "invalid_grant": () => invalidParameters(),
};
```

## 📝 Implementação Recomendada

### **Para n8n Credentials**

Manter o fluxo atual com melhorias na UI:

```typescript
export class GitHubCopilotOAuth2Api implements ICredentialType {
  name = "githubCopilotOAuth2Api";
  displayName = "GitHub Copilot OAuth2 API";
  
  properties: INodeProperties[] = [
    {
      displayName: "🚀 OBTER TOKEN AUTOMATICAMENTE",
      name: "authHelper",
      type: "notice",
      default: "",
      description: `
        <div style="background: #e8f5e8; padding: 20px; border-radius: 8px;">
          <h3 style="margin-top: 0;">Passo a Passo:</h3>
          
          <h4>1. Execute o Script:</h4>
          <pre style="background: #f0f0f0; padding: 10px; border-radius: 4px;">
cd z:\\Desenvolvimento\\n8n-nodes-copilot
node scripts/authenticate.js
          </pre>
          
          <h4>2. O que o script faz:</h4>
          <ul>
            <li>✅ Solicita device code ao GitHub</li>
            <li>✅ Mostra código de autorização (XXXX-XXXX)</li>
            <li>✅ Abre navegador automaticamente</li>
            <li>✅ Aguarda sua autorização</li>
            <li>✅ Obtém token GitHub OAuth</li>
            <li>✅ Converte para token Copilot</li>
            <li>✅ Testa e valida o token</li>
            <li>✅ Exibe token completo na tela</li>
          </ul>
          
          <h4>3. Copie o token e cole abaixo</h4>
          
          <hr/>
          
          <h4>📋 Processo Manual (alternativa):</h4>
          <ol>
            <li>Acesse: <a href="https://github.com/login/device" target="_blank">github.com/login/device</a></li>
            <li>Client ID: <code>01ab8ac9400c4e429b23</code></li>
            <li>Scopes: <code>repo user:email</code></li>
            <li>Autorize e copie o token</li>
          </ol>
        </div>
      `
    },
    {
      displayName: "Access Token",
      name: "accessToken",
      type: "string",
      typeOptions: {
        password: true
      },
      default: "",
      required: true,
      placeholder: "gho_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      description: "Token obtido via script ou processo manual"
    }
  ];
  
  authenticate: IAuthenticateGeneric = {
    type: "generic",
    properties: {
      headers: {
        "Authorization": "=Bearer {{$credentials.accessToken}}",
        "Accept": "application/json",
        "User-Agent": "n8n-GitHub-Copilot/1.0"
      }
    }
  };
  
  test: ICredentialTestRequest = {
    request: {
      baseURL: "https://api.githubcopilot.com",
      url: "/models"
    }
  };
}
```

## 🎓 Referências

### **Documentação Oficial**
* [GitHub OAuth Device Flow](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps#device-flow)
* [GitHub Copilot API](https://docs.github.com/en/copilot)
* [n8n Custom Credentials](https://docs.n8n.io/integrations/creating-nodes/build/reference/credentials/)

### **URLs de Teste**
* Device Code: `https://github.com/login/device/code`
* Autorização: `https://github.com/login/device`
* Access Token: `https://github.com/login/oauth/access_token`
* Test API: `https://api.githubcopilot.com/models`

## 📞 Contato

* **Developer**: hugodeco@sufficit.com.br
* **Team**: development@sufficit.com.br
