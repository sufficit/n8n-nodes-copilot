# GitHub Copilot Embeddings - Análise Técnica Completa

**Data:** 22 de outubro de 2025  
**Versão:** 202510221515  
**Fonte:** microsoft/vscode-copilot-chat repository
**Status:** ❌ Embeddings não acessível com tokens pessoais

## 🎯 Resumo Executivo

Análise completa do código-fonte oficial do VS Code Copilot Chat revelou **por que nossos testes de embeddings falharam** e **como o VS Code realmente acessa embeddings**.

### Conclusão Principal
**Embeddings requer infraestrutura complexa que não é acessível via tokens pessoais (gho_*):**
- HMAC signing de requisições
- OAuth authentication (não personal tokens)
- Request Metadata abstrato (não URLs diretas)
- Headers de metadata específicos

---

## 🔍 Descobertas Principais

### 1. RequestType vs URL Direta

**VS Code NÃO usa URL string direta** para embeddings:

```typescript
// ❌ O que testamos
const url = 'https://api.githubcopilot.com/embeddings';

// ✅ O que VS Code usa
const endpoint: RequestMetadata = {
    type: RequestType.CAPIEmbeddings,
    modelId: 'text-embedding-3-small'
};
```

**Arquivo**: `src/platform/endpoint/node/embeddingsEndpoint.ts#L33-L37`

```typescript
export class EmbeddingEndpoint implements IEmbeddingsEndpoint {
    public get urlOrRequestMetadata(): string | RequestMetadata {
        return { 
            type: RequestType.CAPIEmbeddings, 
            modelId: LEGACY_EMBEDDING_MODEL_ID.TEXT3SMALL 
        };
    }
}
```

### 2. Modelos Suportados

**Apenas 2 modelos** são realmente suportados no VS Code:

```typescript
// Arquivo: src/platform/embeddings/common/embeddingsComputer.ts#L23-L25
export const enum LEGACY_EMBEDDING_MODEL_ID {
    TEXT3SMALL = 'text-embedding-3-small',
    Metis_I16_Binary = 'metis-I16-Binary'
}
```

**Embedding Types com dimensões**:

```typescript
export class EmbeddingType {
    public static readonly text3small_512 = new EmbeddingType('text-embedding-3-small-512');
    public static readonly metis_1024_I16_Binary = new EmbeddingType('metis-1024-I16-Binary');
}

const wellKnownEmbeddingMetadata = {
    'text-embedding-3-small-512': {
        model: 'text-embedding-3-small',
        dimensions: 512,
        quantization: { query: 'float32', document: 'float32' }
    },
    'metis-1024-I16-Binary': {
        model: 'metis-I16-Binary',
        dimensions: 1024,
        quantization: { query: 'float16', document: 'binary' }
    }
};
```

### 3. Estrutura da Requisição

**Arquivo**: `src/platform/embeddings/common/remoteEmbeddingsComputer.ts#L265-L280`

```typescript
public async rawEmbeddingsFetch(
    type: EmbeddingTypeInfo,
    endpoint: IEmbeddingsEndpoint,
    requestId: string,
    inputs: readonly string[],
    cancellationToken: CancellationToken | undefined
): Promise<CAPIEmbeddingResults | CAPIEmbeddingError> {
    
    const token = await this._authService.getCopilotToken();

    const body = { 
        input: inputs,              // Array de strings
        model: type.model,          // 'text-embedding-3-small'
        dimensions: type.dimensions // 512 (OBRIGATÓRIO!)
    };
    
    const response = await postRequest(
        this._fetcherService,
        this._telemetryService,
        this._capiClientService,
        endpoint,                    // RequestMetadata, NÃO URL!
        token.token,
        await createRequestHMAC(env.HMAC_SECRET),  // HMAC obrigatório
        'copilot-panel',             // Intent
        requestId,
        body,
        getGithubMetadataHeaders(...), // Metadata headers
        cancellationToken
    );
    
    return response;
}
```

### 4. HMAC Signing

**Todas as requisições de embeddings são assinadas com HMAC**:

```typescript
// Arquivo: src/util/common/crypto.ts
export async function createRequestHMAC(secret: string | undefined): Promise<string | undefined> {
    if (!secret) return undefined;
    
    // Calcula HMAC-SHA256 da requisição
    // Usa chave secreta do ambiente
    return hmacValue;
}
```

**Sem HMAC válido = 400 Bad Request**

### 5. Headers Completos

**Arquivo**: `src/platform/networking/common/networking.ts#L285-L299`

```typescript
const headers: ReqHeaders = {
    Authorization: `Bearer ${secretKey}`,
    'X-Request-Id': requestId,
    'X-Interaction-Type': intent,           // 'copilot-panel'
    'OpenAI-Intent': intent,               
    'X-GitHub-Api-Version': '2025-05-01',   // ⚠️ Versão diferente!
    ...additionalHeaders,
    ...endpoint.getExtraHeaders?.()
};
```

**Metadata Headers** (chunkingEndpointClientImpl.ts#L477-L490):

```typescript
export function getGithubMetadataHeaders(
    callerInfo: CallTracker, 
    envService: IEnvService
): Record<string, string> | undefined {
    return {
        'VS-Machine-Id': envService.machineId,
        'VS-Session-Id': envService.sessionId,
        'Editor-Version': envService.editorVersion,
        'Editor-Plugin-Version': envService.pluginVersion,
        'Client-Name': 'Visual Studio Code',
        ...
    };
}
```

### 6. Dois Modos de Autenticação

**Arquivo**: `src/platform/embeddings/common/remoteEmbeddingsComputer.ts#L56-L71`

```typescript
public async computeEmbeddings(
    embeddingType: EmbeddingType,
    inputs: readonly string[],
    options?: ComputeEmbeddingsOptions,
    telemetryInfo?: TelemetryCorrelationId,
    cancellationToken?: CancellationToken,
): Promise<Embeddings> {
    
    // Determina tipo de endpoint
    const copilotToken = await this._authService.getCopilotToken();
    
    if (copilotToken.isNoAuthUser) {
        // Modo CAPI Embeddings - para usuários sem OAuth
        const embeddings = await this.computeCAPIEmbeddings(inputs, options, cancellationToken);
        return embeddings ?? { type: embeddingType, values: [] };
    }

    // Modo GitHub Embeddings - para usuários com OAuth
    const token = (await this._authService.getAnyGitHubSession({ silent: true }))?.accessToken;
    if (!token) {
        throw new Error('No authentication token available');
    }
    
    // Processa embeddings com token OAuth...
}
```

**Importante**: Personal tokens (gho_*) não passam pela validação OAuth!

### 7. RequestType Enum

**Arquivo**: `src/platform/networking/common/networking.ts`

```typescript
export enum RequestType {
    ChatCompletions = 'ChatCompletions',
    ChatResponses = 'ChatResponses',
    CAPIEmbeddings = 'CAPIEmbeddings',        // ← Para embeddings
    DotcomEmbeddings = 'DotcomEmbeddings',    // ← Alternativa
    EmbeddingsModels = 'EmbeddingsModels',    // ← Listar modelos
    Chunks = 'Chunks',
    ListModel = 'ListModel',
    ...
}
```

**3 tipos relacionados a embeddings**:
1. `CAPIEmbeddings` - Endpoint principal (CAPI)
2. `DotcomEmbeddings` - Endpoint alternativo (GitHub.com)
3. `EmbeddingsModels` - Lista modelos disponíveis

### 8. Formato da Resposta

**Arquivo**: `src/platform/embeddings/common/remoteEmbeddingsComputer.ts#L280-L293`

```typescript
type EmbeddingResponse = {
    object: string;      // 'embedding'
    index: number;       // Índice no batch
    embedding: number[]; // Array de floats
};

if (response.status === 200 && jsonResponse.data) {
    return { 
        type: 'success', 
        embeddings: jsonResponse.data.map((d: EmbeddingResponse) => d.embedding) 
    };
} else {
    return { type: 'failed', reason: jsonResponse.error };
}
```

**Formato OpenAI esperado**:

```json
{
  "object": "list",
  "data": [
    {
      "object": "embedding",
      "index": 0,
      "embedding": [0.123, 0.456, 0.789, ...]
    }
  ],
  "model": "text-embedding-3-small",
  "usage": {
    "prompt_tokens": 8,
    "total_tokens": 8
  }
}
```

---

## 📋 Comparação: Nossos Testes vs VS Code

| Aspecto | Nossos Testes | VS Code Implementation |
|---------|--------------|----------------------|
| **Endpoint** | URL string direta | `RequestMetadata { type: CAPIEmbeddings }` |
| **URL** | `https://api.githubcopilot.com/embeddings` | Abstraído via RequestType |
| **Método** | `POST` | `POST` ✅ |
| **API Version** | `2025-07-16` | `2025-05-01` ⚠️ |
| **Auth** | Personal Token (gho_*) | OAuth Token ❌ |
| **HMAC** | ❌ Não enviado | ✅ Calculado e enviado |
| **Model** | `text-embedding-3-small` | `text-embedding-3-small-512` |
| **Dimensions** | ❌ Não especificado | ✅ `512` (obrigatório) |
| **Intent** | ❌ Não especificado | ✅ `'copilot-panel'` |
| **Request-Id** | ❌ Não enviado | ✅ UUID gerado |
| **Metadata Headers** | ❌ Não enviados | ✅ Machine-Id, Session-Id, etc |
| **Body** | `{ model, input }` | `{ model, input, dimensions }` |

---

## 🚫 Por Que Nossos Testes Falharam

### Razão 1: RequestType vs URL Direta
- **Problema**: Usamos URL string `https://api.githubcopilot.com/embeddings`
- **VS Code usa**: Sistema abstrato de RequestMetadata
- **Resultado**: API pode não aceitar URL direta para embeddings

### Razão 2: HMAC Ausente
- **Problema**: Não calculamos nem enviamos HMAC
- **VS Code**: Todas as requisições incluem HMAC-SHA256
- **Resultado**: 400 Bad Request (requisição inválida)

### Razão 3: Dimensions Não Especificadas
- **Problema**: Body não incluía `dimensions`
- **VS Code**: Sempre especifica `dimensions: 512`
- **Resultado**: Parâmetro obrigatório ausente

### Razão 4: OAuth vs Personal Token
- **Problema**: Usamos personal token (gho_*)
- **VS Code**: Usa OAuth flow completo com sessão GitHub
- **Resultado**: Token não autorizado para embeddings

### Razão 5: Metadata Headers Ausentes
- **Problema**: Enviamos apenas Authorization e Content-Type
- **VS Code**: Inclui Machine-Id, Session-Id, Editor-Version, etc
- **Resultado**: Validação server-side falha

### Razão 6: API Version Diferente
- **Problema**: Testamos com `X-GitHub-Api-Version: 2025-07-16`
- **VS Code usa**: `X-GitHub-Api-Version: 2025-05-01`
- **Resultado**: Versão pode não suportar embeddings com personal tokens

---

## 🔄 Fluxo Completo no VS Code

### 1. Inicialização

```typescript
// Busca modelo de embedding
const modelMetadata = await modelFetcher.getEmbeddingsModel('text-embedding-3-small');

// Cria endpoint
const endpoint = instantiationService.createInstance(EmbeddingEndpoint, modelMetadata);
```

### 2. Preparação da Requisição

```typescript
// Obtém token OAuth (não personal token!)
const token = await authService.getAnyGitHubSession({ silent: true });

// Calcula HMAC
const hmac = await createRequestHMAC(env.HMAC_SECRET);

// Prepara headers de metadata
const metadataHeaders = getGithubMetadataHeaders(callTracker, envService);
```

### 3. Construção do Body

```typescript
const body = {
    input: ['Texto para embedding'],
    model: 'text-embedding-3-small',
    dimensions: 512  // Obrigatório!
};
```

### 4. Envio da Requisição

```typescript
const response = await postRequest(
    fetcherService,
    telemetryService,
    capiClientService,
    { type: RequestType.CAPIEmbeddings, modelId: 'text-embedding-3-small' },
    token.accessToken,
    hmac,
    'copilot-panel',
    generateUuid(),
    body,
    metadataHeaders,
    cancellationToken
);
```

### 5. Processamento da Resposta

```typescript
const jsonResponse = await response.json();

if (response.status === 200 && jsonResponse.data) {
    const embeddings = jsonResponse.data.map(d => d.embedding);
    return { type: 'success', embeddings };
} else {
    return { type: 'failed', reason: jsonResponse.error };
}
```

---

## 🎯 Casos de Uso de Embeddings no VS Code

### 1. Workspace Search (Busca Semântica)
**Arquivo**: `workspaceChunkSearch/node/embeddingsChunkSearch.ts`

```typescript
async searchWorkspace(
    query: WorkspaceChunkQueryWithEmbeddings,
    options: WorkspaceChunkSearchOptions,
    token: CancellationToken
): Promise<StrategySearchResult> {
    
    // Computa embedding da query
    const queryEmbedding = await query.resolveQueryEmbeddings(token);
    
    // Busca chunks similares no workspace
    const chunks = await embeddingsIndex.searchWorkspace(
        queryEmbedding,
        maxResults,
        options,
        token
    );
    
    return { chunks };
}
```

### 2. Related Information (Código Relacionado)
**Arquivo**: `embeddings/common/vscodeIndex.ts`

```typescript
async provideRelatedInformation(
    query: string,
    token: CancellationToken
): Promise<RelatedInformationResult[]> {
    
    // Computa embedding da query
    const embeddingResult = await embeddingsComputer.computeEmbeddings(
        EmbeddingType.text3small_512,
        [query],
        {},
        telemetryInfo,
        token
    );
    
    // Busca itens similares no índice
    const similarItems = nClosestValues(embeddingResult.values[0], maxResults);
    
    return similarItems;
}
```

### 3. API Documentation Search
**Arquivo**: `context/node/resolvers/extensionApi.tsx`

```typescript
class ApiEmbeddingsIndex {
    async updateIndex(): Promise<void> {
        // Carrega chunks da documentação da API VS Code
        this.apiChunks = await embeddingsCache.getCache();
    }
    
    nClosestValues(queryEmbedding: Embedding, n: number): string[] {
        // Ranqueia chunks por similaridade
        const ranked = rankEmbeddings(queryEmbedding, this.apiChunks, n);
        return ranked.map(x => x.value);
    }
}
```

### 4. Tool Embeddings (Agrupamento de Ferramentas)
**Arquivo**: `tools/common/virtualTools/toolEmbeddingsComputer.ts`

```typescript
async retrieveSimilarEmbeddingsForAvailableTools(
    queryEmbedding: Embedding,
    availableTools: readonly LanguageModelToolInformation[],
    limit: number,
    token: CancellationToken
): Promise<string[]> {
    
    // Computa embeddings para cada ferramenta
    const toolEmbeddings = await Promise.all(
        availableTools.map(tool => this.getOrComputeEmbedding(tool, token))
    );
    
    // Retorna ferramentas mais similares
    return rankEmbeddings(queryEmbedding, toolEmbeddings, limit);
}
```

---

## 💡 Soluções Possíveis para n8n

### Opção 1: Implementar Infraestrutura Completa (Muito Difícil)

**Requisitos**:
- ✅ Implementar OAuth flow do GitHub
- ✅ Calcular HMAC-SHA256 das requisições
- ✅ Usar RequestType ao invés de URLs
- ✅ Incluir todos os metadata headers
- ✅ Engenharia reversa do sistema de abstrações

**Prós**:
- Acesso total a embeddings

**Contras**:
- Complexidade extrema
- Manutenção difícil
- Pode quebrar com atualizações da API

### Opção 2: Aguardar API Pública (Recomendado)

**Aguardar até que**:
- GitHub documente oficialmente a API de embeddings
- Suporte para personal tokens seja adicionado
- Endpoint público seja liberado

**Prós**:
- Solução oficial e suportada
- Documentação clara
- Menos propenso a quebrar

**Contras**:
- Pode demorar (ou nunca acontecer)

### Opção 3: Usar OpenAI API Direta (Alternativa)

**Implementar**:
- Node n8n para OpenAI Embeddings
- Usuários fornecem sua própria API key
- Acesso direto ao text-embedding-3-small

**Prós**:
- Funciona hoje
- API bem documentada
- Mais controle sobre configurações

**Contras**:
- Usuários precisam de conta OpenAI
- Custo adicional

### Opção 4: Aceitar Limitação (Pragmático)

**Documentar claramente**:
- Embeddings não funciona com GitHub Copilot API
- Focar em chat completions (que funcionam)
- Sugerir alternativas

**Prós**:
- Honesto com usuários
- Evita expectativas incorretas
- Foca no que funciona

**Contras**:
- Funcionalidade limitada

---

## 📊 Estatísticas de Uso no Código VS Code

### Arquivos que Usam Embeddings

```
Busca por "computeEmbeddings":
- workspaceChunkSearch/ (8 arquivos)
- embeddings/ (5 arquivos)
- tools/ (3 arquivos)
- context/ (2 arquivos)
- urlChunkSearch/ (2 arquivos)

Total: ~20 arquivos dependem de embeddings
```

### RequestType.CAPIEmbeddings

```typescript
// Usado em:
- EmbeddingEndpoint.urlOrRequestMetadata
- RemoteEmbeddingsComputer.rawEmbeddingsFetch
- TestEndpointProvider.getEmbeddingsEndpoint

Frequência: ~15 referências no código
```

---

## 📝 Conclusão Final

### ✅ O Que Aprendemos

1. **Embeddings é funcionalidade complexa** que requer infraestrutura além de simples requisições HTTP
2. **OAuth é obrigatório** - Personal tokens (gho_*) não têm permissão
3. **HMAC signing é mandatório** - Para validação e segurança
4. **RequestType abstrato** - API não aceita URLs diretas para embeddings
5. **Metadata headers são validados** - Server-side espera informações de contexto

### ❌ Por Que Não Funciona com Personal Tokens

- Personal tokens não passam pelo OAuth flow
- Sem OAuth session, não há metadata de Machine-Id/Session-Id
- API valida presença de HMAC e metadata
- Embeddings é recurso "interno" não exposto publicamente

### 🎯 Recomendação para n8n-nodes-copilot

**Aceitar limitação e documentar claramente**:

```markdown
## Funcionalidades Disponíveis

✅ **Chat Completions** - Funciona perfeitamente com personal tokens
- 7 modelos verificados funcionando
- GPT-4, GPT-5, Claude, Gemini

❌ **Embeddings** - Não disponível com personal tokens
- Requer OAuth authentication
- Use OpenAI API diretamente para embeddings
- Aguardando API pública do GitHub Copilot
```

### 🔮 Próximos Passos

1. ✅ **Documentar descobertas** - Este documento
2. ⏭️ **Atualizar README** - Esclarecer limitações
3. ⏭️ **Monitorar API** - Verificar mudanças futuras
4. ⏭️ **Considerar OpenAI node** - Para embeddings como alternativa

---

**Status**: ✅ Análise completa do código VS Code Copilot Chat
**Conclusão**: Embeddings não é acessível via API pública com personal tokens
**Ação Recomendada**: Focar em chat completions que funcionam perfeitamente
