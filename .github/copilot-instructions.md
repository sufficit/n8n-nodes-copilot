# Copilot Instructions - n8n GitHub Copilot Nodes
* **Version**: 202509171200
* **Description**: Este arquivo fornece diretrizes e instruções para o desenvolvimento dos nodes n8n do GitHub Copilot.
* **Repository**: https://github.com/sufficit/n8n-nodes-copilot
* **VS Code Copilot Chat Repository**: https://github.com/microsoft/vscode-copilot-chat

## Table of Contents
- [Diretrizes Gerais](#diretrizes-gerais)
- [Configuração de Token](#configuração-de-token)
- [Segurança e Melhores Práticas](#segurança-e-melhores-práticas)
- [Arquitetura dos Nodes](#arquitetura-dos-nodes)
- [Modelos GitHub Copilot](#modelos-github-copilot)
- [Testes e Debugging](#testes-e-debugging)
- [GitHub Copilot API](#github-copilot-api)

## Diretrizes Gerais
* Comentários de código sempre em inglês
* Mensagens de commit em inglês
* Respostas ao usuário no idioma do IDE
* Evitar mudanças em código não relacionado à query
* Usar TypeScript com tipagem rigorosa
* Seguir padrões do n8n community nodes

## Configuração de Token

### 🔑 **Localização do Token**
O token GitHub Copilot está armazenado no arquivo:
```
./.token
```

### 🔐 **Regras de Segurança para Token**
* ❌ **NUNCA** coloque tokens explicitamente em documentação, código de exemplo, ou commits
* ✅ **SEMPRE** referencie o arquivo `.token` usando caminho relativo (`./`)
* ✅ **SEMPRE** use `fs.readFileSync('./.token', 'utf8').trim()` para carregar token em scripts de teste
* ❌ **NUNCA** use caminhos absolutos para arquivos de token (ex: `Z:/Desenvolvimento/...`)
* ✅ **SEMPRE** use caminhos relativos para compatibilidade entre sistemas

### 📋 **Padrão para Carregamento de Token**
```javascript
// MÉTODO CORRETO - usar em todos os scripts de teste
const fs = require('fs');
const token = fs.readFileSync('./.token', 'utf8').trim();

// Validação de formato
if (!token.startsWith('gho_')) {
    throw new Error('Token deve ser um GitHub Copilot token (formato: gho_*)');
}
```

### 🧪 **Scripts de Teste**
* Todos os scripts de teste devem apontar para `./.token`
* Incluir validação de formato do token (`gho_*`)
* Nunca expor token completo em logs (apenas primeiros 10 caracteres)
* Usar debug seguro: `token.substring(0, 10) + '...'`

## Segurança e Melhores Práticas

### 🔒 **Manuseio de Tokens**
1. **Arquivo .token**: Deve conter apenas o token GitHub Copilot (formato `gho_*`)
2. **Logging Seguro**: Sempre mascarar tokens em logs e debug
3. **Validação**: Verificar formato antes de usar
4. **Erro Handling**: Mensagens de erro não devem expor tokens

### 📝 **Documentação**
1. **Exemplos de Código**: Usar placeholders como `gho_XXXXX` ou referenciar arquivo
2. **Caminhos**: Sempre relativos, nunca absolutos
3. **Scripts**: Incluir comentários sobre segurança
4. **README**: Instruções claras sobre configuração de token

## Arquitetura dos Nodes

### 🏗️ **Estrutura do Projeto**
```
n8n-nodes-copilot/
├── .token                          # Token GitHub Copilot (gho_*)
├── nodes/
│   ├── GitHubCopilotChatModel/     # AI Chat Model node
│   └── GitHubCopilotChatAPI/       # Direct API node
├── credentials/
│   └── GitHubCopilotApi.credentials.ts
├── utils/
│   └── GitHubCopilotModels.ts      # Centralized model management
└── docs/                           # Documentação interna
```

### 🎯 **Node Types**
1. **GitHubCopilotChatModel**: AI Chat Model compatível com LangChain
2. **GitHubCopilotChatAPI**: Acesso direto à API GitHub Copilot

### 🔧 **Features Implementadas**
* Token validation com formato `gho_*`
* Debug mode com logging seguro
* Error handling robusto
* Compatibility com providers: OpenAI, Anthropic, Google, Microsoft

## Modelos GitHub Copilot

### 📋 **Arquivo de Modelos**
O arquivo `./models.json` contém a **lista completa e atualizada** de todos os modelos disponíveis via GitHub Copilot API.

### 🎯 **Propriedade `model_picker_enabled`**
**Fundamental para filtrar modelos relevantes:**
- `true`: Modelo habilitado para interface (12 modelos)
- `false`: Modelo desabilitado/obsoleto (16 modelos)  
- **Usar sempre**: `model.model_picker_enabled !== false` para filtrar

### 📊 **Resumo Atual**
- ✅ **Total**: 28 modelos disponíveis na API
- ✅ **Habilitados**: 12 modelos para interface
- ✅ **Providers**: Azure OpenAI (5), Anthropic (5), Google (2)
- ✅ **Funcionais**: GPT-5, GPT-5 Mini (verificado)

### 📖 **Documentação Completa**
Para informações detalhadas sobre modelos, endpoint da API, implementações práticas e estratégias de fallback:

**➡️ Consulte: `./docs/USAGE-github-copilot-models-api.md`**

## Testes e Debugging

### 🧪 **Pasta de Testes**
A pasta `./tests/` contém scripts de teste automatizados que seguem as diretrizes de segurança.

**IMPORTANTE**:
- ✅ **Todos os testes** carregam dados automaticamente dos arquivos `./models.json` e `./.token`
- ✅ **Nunca hardcodar** modelos ou tokens nos scripts
- ✅ **Sempre usar caminhos relativos** para compatibilidade
- ✅ **Gerar relatórios** em formato JSON para análise

### 📋 **Scripts Disponíveis**
* `./tests/test-all-models.js` - Testa todos os modelos do arquivo `models.json`
* `./tests/README.md` - Documentação completa dos testes

### 🎯 **Padrão para Novos Testes**
```javascript
// Estrutura padrão para scripts de teste
const fs = require('fs');

// Carregar token (MÉTODO CORRETO)
const token = fs.readFileSync('./.token', 'utf8').trim();
if (!token.startsWith('gho_')) {
    throw new Error('Token deve ser formato gho_*');
}

// Carregar modelos (MÉTODO CORRETO)  
const modelsData = JSON.parse(fs.readFileSync('./models.json', 'utf8'));
const models = modelsData.data.filter(m => m.model_picker_enabled !== false);

// Executar testes...
// Salvar resultados em ./tests/results-*.json
```

### 🧪 **Scripts de Teste Legados**
* `verify-personal-copilot.js`: Testa acesso com conta pessoal (DEPRECADO - usar tests/)
* `verify-mcp-github-settings.js`: Verifica configurações organizacionais via MCP

### 🐛 **Debug Guidelines**
1. **Token Masking**: Sempre usar `token.substring(0, 10) + '...'`
2. **Error Logging**: Incluir status codes e headers relevantes
3. **API Testing**: Testar modelos individuais para identificar limitações
4. **Organization Access**: Verificar billing e seats disponíveis

### 📊 **Monitoramento**
* Verificação automática de organizações com 0 seats
* Cache de modelos disponíveis (5 minutos)
* Detecção de providers restritos por subscription

## GitHub Copilot API

###  **Endpoints Principais**
* **Models**: `https://api.githubcopilot.com/models`
* **Chat Completions**: `https://api.githubcopilot.com/chat/completions`
* **Organization Billing**: `https://api.github.com/orgs/{org}/copilot/billing`

### 🔑 **Autenticação**
```javascript
headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
}
```

### 📋 **Limitações Conhecidas**
1. **Conta Pessoal vs Organizacional**: Modelos disponíveis variam
2. **Provider Restrictions**: Anthropic/Google podem requerer subscription específica
3. **Rate Limits**: Aplicados por provider e subscription
4. **Organization Seats**: Necessário para acesso completo aos modelos premium

---

**Nota**: Este projeto implementa integração completa com GitHub Copilot API, seguindo práticas de segurança rigorosas para manuseio de tokens e compatibilidade máxima com diferentes tipos de subscription.
