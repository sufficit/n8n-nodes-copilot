# Análise das Requisições do GitHub Copilot Chat

## 📋 Resumo

Este documento analisa o código-fonte do repositório oficial `microsoft/vscode-copilot-chat` para entender como o Copilot faz requisições HTTP/HTTPS com os servidores de IA.

**Repositório**: https://github.com/microsoft/vscode-copilot-chat
**Linguagem**: TypeScript
**Arquitetura**: Serviços injetáveis com camadas de rede abstraídas

---

## 🏗️ Arquitetura de Requisições

### Camadas Principais

```
┌─────────────────────────────────────┐
│  ChatEndpoint / RemoteSearch        │  (Lógica de negócio)
├─────────────────────────────────────┤
│  networking.ts (postRequest)        │  (Orquestração)
├─────────────────────────────────────┤
│  FetcherService                     │  (Abstração HTTP)
├─────────────────────────────────────┤
│  NodeFetcher / BrowserFetcher       │  (Implementação específica)
└─────────────────────────────────────┘
```

---

## 🔌 Interfaces Principais

### 1. **IFetcherService** (fetcherService.ts)
Abstração de requisições HTTP/HTTPS:

```typescript
export interface IFetcherService {
    fetch(url: string, options: FetchOptions): Promise<Response>;
    makeAbortController(): IAbortController;
    getUserAgentLibrary(): string;
    isAbortError(e: any): boolean;
}

export interface FetchOptions {
    headers?: { [name: string]: string };
    body?: string;
    timeout?: number;
    json?: any;
    method?: 'GET' | 'POST';
    signal?: IAbortSignal;
    expectJSON?: boolean;
}
```

### 2. **Headers Padrão** (networking.ts - linha 285)

As requisições incluem headers obrigatórios:

```typescript
const headers: ReqHeaders = {
    Authorization: `Bearer ${secretKey}`,          // Token de autenticação
    'X-Request-Id': requestId,                    // ID único da requisição
    'X-Interaction-Type': intent,                 // Tipo de interação (copilot-panel, codesearch)
    'OpenAI-Intent': intent,                      // Para rastreamento interno
    'X-GitHub-Api-Version': '2025-05-01',        // Versão da API
    ...additionalHeaders,                         // Headers customizados
};
```

---

## 💬 Fluxo de Chat (Chat Completions)

### 1. **Ponto de Entrada**
- Arquivo: `endpoint/node/chatEndpoint.ts`
- Método: `makeChatRequest()`

### 2. **Construção da Requisição** (endpoint/node/responsesApi.ts)

**Tipo de API**: OpenAI Responses API

```typescript
export function createResponsesRequestBody(
    accessor: ServicesAccessor, 
    options: ICreateEndpointBodyOptions, 
    model: string, 
    modelInfo: IChatModelInformation
): IEndpointBody {
    
    const body: IEndpointBody = {
        model,
        stream: true,
        messages: rawMessagesToResponseAPI(model, options.messages),
        max_output_tokens: options.postOptions.max_tokens,
        top_p: options.postOptions.top_p,
        temperature: options.postOptions.temperature,
        tools: options.requestOptions?.tools?.map(tool => ({
            type: 'function',
            function: tool.function,
            strict: false,
            parameters: tool.function.parameters || {}
        })),
        tool_choice: options.postOptions.tool_choice,
        truncation: 'auto' | 'disabled',
        reasoning: {
            effort: 'low' | 'medium' | 'high',  // Se habilitado
            summary: 'on' | 'off'                 // Se habilitado
        }
    };
    
    return body;
}
```

### 3. **Envio da Requisição** (networking.ts - postRequest)

```typescript
export function postRequest(
    fetcherService: IFetcherService,
    telemetryService: ITelemetryService,
    capiClientService: ICAPIClientService,
    endpointOrUrl: IEndpoint | string | RequestMetadata,
    secretKey: string,
    hmac: string | undefined,
    intent: string,
    requestId: string,
    body?: IEndpointBody,
    additionalHeaders?: Record<string, string>,
    cancelToken?: CancellationToken,
    useFetcher?: FetcherId,
): Promise<Response>
```

---

## 🔍 Tipos de Requisições

### 1. **Chat (Completions/Responses API)**
- **Endpoint**: `RequestType.ChatCompletions` ou `RequestType.ChatResponses`
- **Método**: POST
- **Intent**: `'copilot-panel'`
- **Modelo**: gpt-4, gpt-4-turbo, o1, etc.

### 2. **Embeddings** (remoteEmbeddingsComputer.ts)
- **Endpoint**: `RequestType.Embeddings`
- **Método**: POST
- **Intent**: `'copilot-panel'`
- **Body**:
```typescript
{
    input: string[],           // Textos para embeddings
    model: string,             // Modelo de embeddings
    dimensions: number         // Dimensões (opcional)
}
```

### 3. **Code Search / Docs Search** (remoteSearch/codeOrDocsSearchClientImpl.ts)
- **Endpoint**: Code/Docs Search endpoint
- **Método**: POST
- **Intent**: `'codesearch'`
- **Body**:
```typescript
{
    query: string,             // Query de busca
    scopingQuery: {            // Filtros
        repositories?: string[],
        paths?: string[]
    },
    limit: number,             // Máximo de resultados
    similarity: number         // Threshold de similaridade
}
```

### 4. **Chunking / File Analysis** (chunking/chunkingEndpointClientImpl.ts)
- **Endpoint**: `RequestType.Chunks`
- **Método**: POST
- **Intent**: `'copilot-panel'`
- **Body**:
```typescript
{
    content: string,           // Conteúdo do arquivo
    embed: boolean,            // Computar embeddings?
    qos: 'Batch' | 'Online',  // Qualidade de serviço
}
```

---

## 🔐 Autenticação e Segurança

### 1. **HMAC (Hash-based Message Authentication)**
- Arquivo: `util/common/crypto.ts`
- Função: `createRequestHMAC()`
- Header: Incluído em requisições sensíveis

```typescript
const hmac = await createRequestHMAC(env.HMAC_SECRET);
// Enviado em header ou body
```

### 2. **Bearer Token**
- Obtido de: `authService.getCopilotToken()`
- Formato: `Authorization: Bearer <token>`
- Token vem do GitHub

### 3. **Nonce / Validation**
- Para requisições internas (OpenAI Language Model Server)
- Endpoint `/v1/responses` valida nonce de autenticação

---

## 📊 Rate Limiting

### RequestRateLimiter (chunking/chunkingEndpointClientImpl.ts - linha 35)

```typescript
class RequestRateLimiter extends Disposable {
    // 40 requisições por segundo máximo
    private static readonly _abuseLimit = 1000.0 / 40.0;
    
    // Máximo de requisições paralelas
    private readonly _maxParallelChunksRequests = 8;
    
    // Máximo de tentativas
    private readonly _maxAttempts = 3;
    
    // Target de uso de quota (80%)
    private readonly targetQuota = 80;
    
    // Rate limit headers do GitHub
    private monitorRateLimit(response: Response): void {
        const remaining = Number(response.headers.get('x-ratelimit-remaining'));
        if (remaining < 1000) {
            // Danger zone - log e telemetria
        }
    }
}
```

---

## 📈 Telemetria e Logging

### Dados Coletados

1. **Request ID**: UUID único por requisição
2. **Request Logger**: `requestLogger/requestLogger.ts`
   - Registra todas as requisições e respostas
   - Suporta visualização em VS Code com esquema customizado

3. **Telemetry Events**:
   - `githubAPI.approachingRateLimit`
   - Erros de conexão e falhas
   - Performance metrics

---

## 🌐 Implementação do Fetcher

### NodeFetcher (networking/node/nodeFetcher.ts)

Usa módulos Node.js nativos (`http`, `https`):

```typescript
export class NodeFetcher implements IFetcher {
    private _fetch(
        url: string, 
        method: 'GET' | 'POST', 
        headers: { [name: string]: string }, 
        body: string | undefined, 
        signal: AbortSignal
    ): Promise<Response> {
        
        // Detecta protocolo
        const module = url.startsWith('https:') ? https : http;
        
        // Faz requisição nativa
        const req = module.request(url, { method, headers }, res => {
            // ... tratamento de resposta
        });
        
        // Timeout de 60 segundos
        req.setTimeout(60 * 1000);
    }
}
```

---

## 🔄 Ciclo Completo de Chat

1. **Usuário envia mensagem** → VS Code Chat UI
2. **ChatEndpoint.makeChatRequest()** é chamado
3. **createResponsesRequestBody()** constrói o body
4. **postRequest()** orquestra a requisição
5. **FetcherService.fetch()** executa HTTP
6. **Response stream** é processada
7. **Chunks** são parseados como Server-Sent Events (SSE)
8. **Telemetria** é registrada
9. **Resposta** é exibida ao usuário

---

## 📝 Estrutura de Resposta

### Chat Response (Server-Sent Events)

```
event: content_block_start
data: {"type": "content_block_start", "index": 0, "content_block": {"type": "text"}}

event: content_block_delta
data: {"type": "content_block_delta", "index": 0, "delta": {"type": "text_delta", "text": "..."}}

event: content_block_stop
data: {"type": "content_block_stop", "index": 0}

event: message_stop
data: {"type": "message_stop"}
```

---

## 🎯 Endpoints Principais

### API de Chat
```
POST /v1/chat/completions     (Chat Completions API)
POST /v1/responses            (OpenAI Responses API - novo)
```

### APIs de Suporte
```
POST /embeddings              (Embeddings)
POST /chunks                  (Code Analysis)
POST /codesearch              (Code Search)
POST /docssearch              (Docs Search)
```

### GitHub API
```
GET  /repos/{owner}/{repo}
GET  /search/issues
POST /repos/{owner}/{repo}/pulls
```

---

## 🔗 Arquivos-Chave

| Arquivo | Descrição |
|---------|-----------|
| `networking/common/networking.ts` | Orquestrador principal |
| `networking/common/fetcherService.ts` | Interface abstrata |
| `networking/node/nodeFetcher.ts` | Implementação Node.js |
| `endpoint/node/chatEndpoint.ts` | Lógica de chat |
| `endpoint/node/responsesApi.ts` | Construção de requests |
| `chunking/chunkingEndpointClientImpl.ts` | Análise de código |
| `remoteSearch/codeOrDocsSearchClientImpl.ts` | Busca |

---

## 💡 Insights Principais

1. **Requisições são abstradas** - Permite múltiplas implementações (Node.js, Web, etc.)
2. **Rate limiting automático** - Respeita limites de API
3. **HMAC + Bearer tokens** - Autenticação em camadas
4. **Server-Sent Events** - Streaming de respostas em tempo real
5. **Telemetria integrada** - Todas as requisições são registradas
6. **Retry automático** - Tentativas com backoff exponencial
7. **Cancellation tokens** - Suporte a cancelamento de requisições
8. **Headers customizados** - Rastreamento de intent e request ID

---

## 📚 Referências

- Repository: https://github.com/microsoft/vscode-copilot-chat
- Docs: https://code.visualstudio.com/docs/copilot/overview
- OpenAI Responses API: https://platform.openai.com/docs/api-reference/responses
- GitHub API: https://docs.github.com/en/rest
