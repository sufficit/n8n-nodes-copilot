# Conhecendo os Endpoints GitHub Copilot - URLs Descobertas

Este documento lista URLs e endpoints descobertos durante investigações das extensões oficiais do GitHub Copilot para VS Code.

**Última atualização:** 17 de setembro de 2025  
**Fonte:** Análise completa dos arquivos das extensões `github.copilot` e `github.copilot-chat`

## 🔗 **Endpoints Principais da API**

### APIs Core do Copilot
- `https://api.githubcopilot.com` - **Endpoint principal da API do Copilot**
- `https://api.githubcopilot.com/models` - Lista de modelos disponíveis
- `https://api.githubcopilot.com/chat/completions` - Chat completions
- `https://api.githubcopilot.com/responses` - API de respostas
- `https://api.githubcopilot.com/embeddings` - Embeddings
- `https://api.githubcopilot.com/agents` - Agentes remotos
- `https://api.githubcopilot.com/skills` - Lista de skills
- `https://api.githubcopilot.com/search` - Busca

### APIs GitHub
- `https://api.github.com` - API oficial do GitHub  
- `https://api.github.com/copilot/mcp_registry` - Registro de MCP (Model Context Protocol)
- `https://api.github.com/copilot_internal/content_exclusion` - Exclusão de conteúdo
- `https://api.github.com/copilot_internal/user` - Informações do usuário
- `https://api.github.com/copilot_internal/v2/token` - Endpoint de token v2

### Proxy e Chat Completions
- `https://copilot-proxy.githubusercontent.com` - **Proxy principal**
- `https://copilot-proxy.githubusercontent.com/chat/completions` - **Proxy para chat completions**
- `https://copilot-telemetry.githubusercontent.com` - Endpoint de telemetria
- `https://copilot-telemetry.githubusercontent.com/telemetry` - Telemetria específica
- `https://origin-tracker.githubusercontent.com` - Origin tracker
- `https://uploads.github.com/copilot/chat/attachments` - Upload de anexos do chat

### Recursos GitHub User Content
- `https://avatars.githubusercontent.com` - Avatars dos usuários
- `https://avatars.githubusercontent.com/u/147005046?v=4` - Avatar específico encontrado
- `https://raw.githubusercontent.com` - Conteúdo raw do GitHub
- `https://private-user-images.githubusercontent.com` - Imagens privadas de usuários

## 🛠️ **Configurações de Debug Avançado**

As extensões incluem configurações para override de endpoints:

### Configurações Disponíveis
- `github.copilot.advanced.debug.overrideProxyUrl` - Substituir URL do proxy
- `github.copilot.advanced.debug.overrideCapiUrl` - Substituir URL da API Copilot  
- `github.copilot.advanced.debug.testOverrideProxyUrl` - URL de teste do proxy
- `github.copilot.advanced.debug.testOverrideCapiUrl` - URL de teste da API

### URLs Padrão dos Endpoints
```javascript
const DEFAULT_ENDPOINTS = {
  api: "https://api.githubcopilot.com",
  proxy: "https://copilot-proxy.githubusercontent.com", 
  telemetry: "https://copilot-telemetry.githubusercontent.com",
  "origin-tracker": "https://origin-tracker.githubusercontent.com"
};
```

### URLs Alternativas (Model Lab)
- `https://api-model-lab.githubcopilot.com` - **Endpoint para testes de modelo**

## 🔍 **URLs de Recursos e Documentação**

### Sites Oficiais
- `https://copilot.github.com` - Site oficial do GitHub Copilot
- `https://github.com/features/copilot?editor=vscode` - Página de features do Copilot

### Documentação e Suporte
- `https://docs.github.com/copilot/using-github-copilot/getting-started-with-github-copilot` - Documentação oficial
- `https://docs.github.com/en/copilot/troubleshooting-github-copilot/troubleshooting-firewall-settings-for-github-copilot` - Troubleshooting firewall
- `https://gh.io/copilot-firewall` - Informações sobre configurações de firewall
- `https://gh.io/copilot-network-errors` - Troubleshooting de erros de rede
- `https://aka.ms/github-copilot-rate-limit-error` - Informações sobre rate limit
- `https://aka.ms/github-copilot-match-public-code` - Correspondência com código público
- `https://aka.ms/copilot-chat-workspace-remote-index` - Indexação remota do workspace

### OAuth e Autenticação  
- `https://github.com/login/oauth` - Endpoint OAuth do GitHub
- `https://github.com/github-copilot/signup/copilot_individual` - Signup individual
- `https://github.com/apps/github-copilot-ide-plugin` - Plugin IDE
- `https://github.com/apps/claude` - App Claude

## 🧪 **Endpoints de Modelos e APIs Externas**

### OpenAI
- `https://api.openai.com` - API da OpenAI
- `https://api.openai.com/v1` - API v1 da OpenAI
- `https://openaipublic.blob.core.windows.net/encodings/o200k_base.tiktoken` - Tokenizer

### Anthropic
- `https://api.anthropic.com/api/organizations/*/claude_code_data_sharing` - API do Claude
- `https://docs.anthropic.com/en/docs/claude-code/mcp` - Documentação MCP
- `https://docs.anthropic.com/en/docs/claude-code/sdk#command-line` - SDK CLI
- `https://docs.anthropic.com/en/docs/claude-code/settings` - Configurações
- `https://console.anthropic.com/settings/billing` - Console de billing
- `https://console.anthropic.com/settings/keys` - Configuração de chaves

### Azure e Outros
- `https://almsearch.dev.azure.com/{org}/{project}/_apis/search/semanticsearchstatus/{repo}?api-version=7.1-preview` - Azure DevOps Search
- `https://bedrock-runtime-fips.{Region}.{PartitionResult#dualStackDnsSuffix}` - AWS Bedrock
- `https://ces-dev1.azurewebsites.net/api/proxy/{n}` - Proxy de desenvolvimento
- `https://mobile.events.data.microsoft.com/OneCollector/1.0` - Telemetria Microsoft

### Outras APIs
- `https://default.exp-tas.com/` - Serviço de experimentação
- `https://registry.npmjs.org/${encodeURIComponent(t.name)}` - NPM Registry

## 🎯 **Descobertas Importantes**

### Consistência de Endpoints
- **O VS Code usa exatamente os mesmos endpoints que testamos nos nossos scripts**
- As diferenças de acesso podem estar relacionadas a:
  - Headers de autenticação específicos
  - Parâmetros de requisição particulares  
  - Métodos de autenticação (OAuth vs token pessoal)
  - Scopes de permissões diferentes

### Configurações de Permissões
As extensões usam dois modos de autenticação:
- `default` - Permissões completas (recomendado) - Inclui `read:user`, `user:email`, `repo`, `workflow`
- `minimal` - Permissões mínimas necessárias - Apenas `read:user`, `user:email`

### Headers Importantes Identificados
Durante a análise, foram encontradas referências a headers específicos:
- `Authorization: Bearer {token}`
- `Content-Type: application/json`
- `Accept: application/json`
- `User-Agent: [específico do VS Code]`
- `Integration-Id: [identificador específico]`

## 🔧 **Implementação nos Nodes n8n**

### Configurações Relevantes para n8n
Com base nas descobertas, os nodes podem implementar:

1. **Fallback de Endpoints:** Testar múltiplos endpoints na ordem de prioridade
2. **Headers Específicos:** Implementar headers encontrados nas extensões  
3. **Debug Override:** Permitir configuração de endpoints alternativos
4. **Telemetria Opcional:** Implementar telemetria se necessário

### URLs Prioritárias para Teste
1. `https://api.githubcopilot.com` - Principal
2. `https://copilot-proxy.githubusercontent.com` - Fallback
3. `https://api-model-lab.githubcopilot.com` - Desenvolvimento

### Próximos Passos Sugeridos
1. Monitorar requisições do VS Code em tempo real
2. Investigar diferenças entre autenticação OAuth e token pessoal
3. Testar com diferentes combinações de headers
4. Implementar sistema de fallback de endpoints
5. Verificar se o acesso via OAuth tem privilégios diferentes do token pessoal

## 📝 **Notas de Implementação**

### Padrões Encontrados
- Todas as URLs seguem padrão HTTPS
- Endpoints principais em `*.githubcopilot.com`
- Proxies em `*.githubusercontent.com`  
- Documentação em `docs.github.com` e `aka.ms/*`

### Considerações de Segurança
- Tokens devem ser mantidos seguros
- Endpoints de debug só para desenvolvimento
- Telemetria é opcional mas recomendada
- Rate limits aplicam-se a todos os endpoints

---

**Status:** ✅ Documentação completa baseada em análise sistemática das extensões oficiais VS Code Copilot
