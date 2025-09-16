# GitHub Copilot Chat API Node

## Visão Geral

O **GitHub Copilot Chat API** é um node avançado que oferece acesso direto à API oficial do GitHub Copilot, permitindo que você use seus créditos existentes do Copilot para acessar modelos de IA de última geração diretamente no n8n.

## 🎯 Principais Funcionalidades

### ✅ Chat Completion
- Conversas diretas com modelos avançados de IA
- Suporte a system prompts personalizados
- Controle fino de temperatura e tokens máximos
- Respostas estruturadas com metadados de uso

### ✅ Análise de Imagens
- Processamento de imagens com modelos de visão computacional
- Suporte a múltiplos formatos: JPG, PNG, WebP, GIF
- Análise de imagens via arquivo local ou base64
- Prompts personalizados para análise específica

### 🔄 Transcrição de Áudio (Em Desenvolvimento)
- Conversão de áudio para texto
- Suporte a múltiplos idiomas
- Detecção automática de idioma
- Formatos suportados: MP3, WAV, M4A, FLAC, OGG

## 🤖 Modelos Disponíveis

| Modelo | Desenvolvedor | Especialidade |
|--------|-------------|---------------|
| **GPT-5** | OpenAI | Modelo mais avançado, uso geral |
| **GPT-5 Mini** | OpenAI | Versão otimizada, mais rápida |
| **Claude Opus 4.1** | Anthropic | Raciocínio avançado, análise complexa |
| **Gemini 2.5 Pro** | Google | Capacidades multimodais |
| **Grok Code Fast 1** | xAI | Otimizado para tarefas de código |
| **GPT-4.1 Copilot** | OpenAI/GitHub | Versão especializada para Copilot |

## 🔧 Configuração

### Autenticação
1. Use as credenciais **GitHub API** existentes
2. O token deve ser gerado via GitHub CLI: `gh auth token`
3. Tokens PAT (Personal Access Token) **NÃO funcionam** com esta API

### Parâmetros Principais

#### Operation (Operação)
- **Chat Completion**: Conversa com IA
- **Audio Transcription**: Transcrição de áudio (em desenvolvimento)
- **Image Analysis**: Análise de imagens

#### Model (Modelo)
Escolha entre os modelos disponíveis baseado na sua necessidade:
- **GPT-5**: Para tarefas complexas e uso geral
- **Claude Opus 4.1**: Para análise e raciocínio avançado
- **Gemini 2.5 Pro**: Para tarefas multimodais

#### Parâmetros Avançados
- **Temperature** (0-2): Controla criatividade vs precisão
- **Max Tokens**: Limite de tokens na resposta
- **System Prompt**: Define comportamento da IA

## 📖 Exemplos de Uso

### 1. Chat Completion Básico
```json
{
  "operation": "chatCompletion",
  "model": "gpt-5",
  "message": "Explique o conceito de promises em JavaScript",
  "temperature": 0.7,
  "maxTokens": 1000
}
```

### 2. Análise de Código com System Prompt
```json
{
  "operation": "chatCompletion",
  "model": "claude-opus-4.1",
  "message": "function fibonacci(n) { return n <= 1 ? n : fibonacci(n-1) + fibonacci(n-2); }",
  "systemPrompt": "Você é um especialista em performance de código. Analise o código fornecido e sugira otimizações.",
  "temperature": 0.3,
  "maxTokens": 1500
}
```

### 3. Análise de Imagem
```json
{
  "operation": "imageAnalysis",
  "model": "gemini-2.5-pro",
  "message": "Descreva o que você vê nesta imagem e identifique possíveis problemas",
  "imageFile": "/path/to/image.jpg",
  "temperature": 0.5,
  "maxTokens": 1000
}
```

### 4. Transcrição de Áudio (Planejado)
```json
{
  "operation": "audioTranscription",
  "model": "gpt-5",
  "audioFile": "/path/to/audio.mp3",
  "audioLanguage": "pt",
  "temperature": 0.1
}
```

## 🔄 Resposta do Node

### Estrutura de Resposta - Chat Completion
```json
{
  "response": "As promises em JavaScript são objetos que representam...",
  "model": "gpt-5",
  "usage": {
    "prompt_tokens": 15,
    "completion_tokens": 245,
    "total_tokens": 260
  },
  "finish_reason": "stop",
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

### Estrutura de Resposta - Audio Transcription
```json
{
  "transcription": "Olá, este é um teste de transcrição de áudio...",
  "language": "pt",
  "model": "gpt-5",
  "usage": { ... },
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

## 💡 Dicas e Melhores Práticas

### Para Chat Completion
- Use **temperature baixa** (0.1-0.3) para respostas precisas
- Use **temperature alta** (0.7-1.5) para respostas criativas
- System prompts ajudam a definir o contexto e comportamento da IA

### Para Análise de Imagens
- **Gemini 2.5 Pro** é excelente para análise multimodal
- Forneça prompts específicos sobre o que procurar na imagem
- Suporte a imagens em base64 ou caminho do arquivo

### Para Transcrição de Áudio
- Use **temperature baixa** (0.1) para máxima precisão
- Especifique o idioma quando conhecido para melhor resultado
- Arquivos de áudio menores têm melhor taxa de sucesso

## ⚠️ Limitações Conhecidas

1. **Autenticação**: Apenas tokens gerados via GitHub CLI funcionam
2. **Transcrição de Áudio**: Ainda em desenvolvimento (implementação via prompt)
3. **Rate Limits**: Limitado pelos limites da sua assinatura GitHub Copilot
4. **Tamanho de Arquivo**: Imagens e áudios têm limites de tamanho

## 🆚 Diferenças vs Node CLI

| Recurso | CLI Node | Chat API Node |
|---------|----------|---------------|
| Autenticação | GitHub CLI obrigatório | Token via CLI |
| Modelos | Limitado ao Copilot padrão | GPT-5, Claude, Gemini, etc. |
| Funcionalidades | Código, explicação, shell | Chat, imagem, áudio |
| Configuração | Mais simples | Mais flexível |
| Performance | Depende do CLI | API direta |

## 🔗 Links Úteis

- [GitHub Copilot Documentation](https://docs.github.com/en/copilot)
- [GitHub CLI](https://cli.github.com/)
- [n8n Community Nodes](https://n8n.io/integrations/)

---

**💰 Importante**: Este node usa seus créditos existentes do GitHub Copilot. Não há custos adicionais além da sua assinatura Copilot.