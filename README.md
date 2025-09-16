# n8n-nodes-github-copilot

![GitHub Copilot](https://img.shields.io/badge/GitHub-Copilot-blue?logo=github)
![n8n](https://img.shields.io/badge/n8n-Community%20Node-red?logo=n8n)
![License](https://img.shields.io/badge/license-MIT-green)

Este é um **community node** para [n8n](https://n8n.io/) que integra o **GitHub Copilot** de duas formas: através do CLI tradicional e da nova **API oficial do GitHub Copilot**, permitindo acesso direto aos modelos avançados de IA como GPT-5, Claude Opus 4.1, Gemini 2.5 Pro e muito mais usando seus créditos existentes do Copilot.

## 🚀 Nodes Disponíveis

### 1. GitHub Copilot (CLI)
- **Sugestões de Código**: Gere código em múltiplas linguagens de programação
- **Explicação de Código**: Obtenha explicações detalhadas sobre funcionalidades de código
- **Comandos Shell**: Receba sugestões de comandos para Git, Docker, NPM e muito mais
- **Múltiplas Linguagens**: Suporte para JavaScript, TypeScript, Python, Ruby, Java, C#, Go, PHP, C++, Rust, SQL, HTML, CSS

### 2. GitHub Copilot Chat API (Novo! ⭐)
- **Chat Completion**: Conversas diretas com modelos avançados de IA
- **Análise de Imagens**: Processamento de imagens com modelos de visão
- **Transcrição de Áudio**: Conversão de áudio para texto (planejado)
- **Modelos Disponíveis**: GPT-5, GPT-5 Mini, Claude Opus 4.1, Gemini 2.5 Pro, Grok Code Fast 1, GPT-4.1 Copilot
- **Sem Custos Extras**: Usa seus créditos existentes do GitHub Copilot

## 🎯 Funcionalidades

- **Integração Dual**: CLI tradicional + API oficial do GitHub Copilot
- **Modelos Premium**: Acesso a GPT-5, Claude, Gemini através de sua assinatura Copilot

## 📋 Pré-requisitos

### 1. Assinatura do GitHub Copilot
Você precisa ter uma assinatura ativa do GitHub Copilot:
- **GitHub Copilot Individual**: $10/mês
- **GitHub Copilot Business**: $19/usuário/mês
- **GitHub Copilot Enterprise**: $39/usuário/mês

### 2. GitHub CLI Instalado
O node usa o GitHub CLI (`gh`) e a extensão Copilot:

#### Linux/Ubuntu:
```bash
# Instalar GitHub CLI
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh

# Instalar extensão Copilot
gh extension install github/gh-copilot

# Autenticar
gh auth login
```

#### macOS:
```bash
# Usando Homebrew
brew install gh

# Instalar extensão Copilot
gh extension install github/gh-copilot

# Autenticar
gh auth login
```

#### Windows:
```powershell
# Usando Chocolatey
choco install gh

# Ou usando Scoop
scoop install gh

# Instalar extensão Copilot
gh extension install github/gh-copilot

# Autenticar
gh auth login
```

### 3. Token de Acesso GitHub
Crie um Personal Access Token no GitHub com as seguintes permissões:
- `read:user`
- `user:email`
- Acesso ao GitHub Copilot (incluído automaticamente se você tem assinatura)

## 🚀 Instalação

### Opção 1: Via npm (Recomendado)
```bash
npm install n8n-nodes-github-copilot
```

### Opção 2: Via Interface do n8n
1. Vá para **Settings > Community Nodes**
2. Clique em **Install a community node**
3. Digite: `n8n-nodes-github-copilot`
4. Clique em **Install**

### Opção 3: Instalação Manual
1. Clone este repositório
2. Execute `npm run build`
3. Copie a pasta `dist` para o diretório de nodes do n8n

## ⚙️ Configuração

### 🔐 IMPORTANTE: Autenticação

**GitHub Copilot CLI tem requisitos específicos de autenticação:**

#### ✅ **O que FUNCIONA:**
- **Autenticação Local**: `gh auth login` (recomendado para servidores)
- **Tokens do GitHub CLI**: Gerados por `gh auth token` após fazer login

#### ❌ **O que NÃO FUNCIONA:**
- **Personal Access Tokens** criados no site do GitHub
- **OAuth App Tokens** de aplicações externas
- **GitHub App Tokens** de aplicações personalizadas

### 🛠️ **Configuração Recomendada:**

#### **Opção 1: Autenticação Local (Servidores)**
```bash
# No servidor onde roda o n8n
gh auth login
gh extension install github/gh-copilot

# Testar se funciona
gh copilot explain "ls -la"
```

#### **Opção 2: Token Manual (Para workflows específicos)**
```bash
# Primeiro faça login local
gh auth login

# Depois obtenha o token
gh auth token
# Resultado: gho_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Use este token no campo "GitHub Token (Optional)" do node
```

### 1. Adicionar o Node
1. Crie um novo workflow
2. Procure por **GitHub Copilot** na lista de nodes
3. Arraste para o canvas
4. **Deixe o campo token vazio** (se o servidor tem `gh auth login`)
5. **OU** insira um token gerado por `gh auth token`

## 🎮 Como Usar

### Operações Disponíveis

#### 1. **Suggest Code** (Sugerir Código)
Gera sugestões de código em linguagens específicas.

**Parâmetros:**
- **Prompt**: Descreva o que você quer criar
- **Language**: Selecione a linguagem de programação
- **Additional Context**: Contexto adicional (opcional)

**Exemplo:**
```
Prompt: "create a function to validate email addresses"
Language: "JavaScript"
```

#### 2. **Explain Code** (Explicar Código)
Explica funcionalidades de código existente.

**Parâmetros:**
- **Prompt**: Cole o código que quer explicar
- **Additional Context**: Contexto adicional (opcional)

**Exemplo:**
```
Prompt: "function validateEmail(email) { return /\S+@\S+\.\S+/.test(email); }"
```

#### 3. **Shell Command** (Comando Shell)
Sugere comandos shell para tarefas específicas.

**Parâmetros:**
- **Prompt**: Descreva a tarefa que quer executar
- **Command Type**: Tipo de comando (Git, Docker, NPM, etc.)
- **Additional Context**: Contexto adicional (opcional)

**Exemplo:**
```
Prompt: "commit all changes with message"
Command Type: "Git Command"
```

### Dados de Saída

O node retorna um objeto JSON com:
```json
{
  "operation": "suggest",
  "prompt": "create a REST API endpoint",
  "language": "javascript",
  "suggestion": "// Código sugerido pelo Copilot",
  "rawOutput": "Saída completa do CLI",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🔧 Exemplo de Workflow

### Gerador de Código Automático
```
Webhook (POST) → GitHub Copilot (Suggest) → HTTP Response
```

**Payload do Webhook:**
```json
{
  "prompt": "create a login function",
  "language": "python",
  "context": "using Flask framework"
}
```

### Bot de Ajuda para Comandos
```
Telegram Bot → GitHub Copilot (Shell) → Telegram Bot (Reply)
```

## 🐳 Docker

### Dockerfile para n8n com GitHub Copilot
```dockerfile
FROM n8nio/n8n:latest

USER root

# Instalar GitHub CLI
RUN apt-get update && apt-get install -y curl gnupg
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
RUN echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null
RUN apt-get update && apt-get install -y gh

# Instalar o community node
RUN npm install -g n8n-nodes-github-copilot

USER node

# Definir variáveis de ambiente
ENV GITHUB_TOKEN=""
ENV N8N_COMMUNITY_PACKAGES="n8n-nodes-github-copilot"
```

### docker-compose.yml
```yaml
version: '3.8'
services:
  n8n:
    build: .
    ports:
      - "5678:5678"
    environment:
      - GITHUB_TOKEN=${GITHUB_TOKEN}
      - N8N_COMMUNITY_PACKAGES=n8n-nodes-github-copilot
    volumes:
      - n8n_data:/home/node/.n8n

volumes:
  n8n_data:
```

## 🔒 Segurança

- **Dados Sensíveis**: Evite enviar informações confidenciais nos prompts
- **Rate Limiting**: O GitHub Copilot tem limites de uso - monitore seu consumo
- **Tokens**: Mantenha seus tokens seguros e com permissões mínimas necessárias
- **Logs**: O node registra atividades para auditoria

## 🚨 Limitações

- **Requer Assinatura**: Necessário ter GitHub Copilot ativo
- **Dependência CLI**: Requer GitHub CLI instalado no sistema
- **Rate Limits**: Sujeito aos limites de uso do GitHub Copilot
- **Contexto**: Limitado pelo contexto que o Copilot CLI suporta

## 🛠️ Desenvolvimento

### Construir do Código Fonte
```bash
# Clonar repositório
git clone https://github.com/sufficit/n8n-nodes-github-copilot.git
cd n8n-nodes-github-copilot

# Instalar dependências
npm install

# Construir
npm run build

# Lint
npm run lint

# Formatar código
npm run format
```

### Estrutura do Projeto
```
├── credentials/
│   └── GitHubApi.credentials.ts
├── nodes/
│   └── GitHubCopilot/
│       ├── GitHubCopilot.node.ts
│       └── githubcopilot.svg
├── package.json
├── tsconfig.json
├── gulpfile.js
└── README.md
```

## 📄 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Suporte

- **Email**: development@sufficit.com.br
- **Issues**: [GitHub Issues](https://github.com/sufficit/n8n-nodes-github-copilot/issues)
- **Documentação**: [n8n Community Nodes](https://docs.n8n.io/integrations/community-nodes/)

## 🙏 Agradecimentos

- [n8n.io](https://n8n.io/) - Plataforma de automação incrível
- [GitHub Copilot](https://copilot.github.com/) - IA que torna este node possível
- [GitHub CLI](https://cli.github.com/) - Interface de linha de comando essencial

---

**Feito com ❤️ pela equipe [Sufficit](https://sufficit.com.br)**