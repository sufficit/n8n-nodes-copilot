# Test Suite - n8n GitHub Copilot Nodes

Esta pasta contém testes completos para validar funcionalidades do pacote n8n-nodes-github-copilot.

## 🧪 Tipos de Testes

### 1. Testes de API (`test-all-models.js`)
Valida modelos GitHub Copilot via API.

**Como executar:**
```bash
node tests/test-all-models.js
```

### 2. Testes Unitários (`unit/`)
Valida componentes individuais do sistema de Runtime Provider Injection.

#### `version-detection.test.js`
Testa detecção de versão do n8n.

**Como executar:**
```bash
node tests/unit/version-detection.test.js
```

**O que testa:**
- ✓ Detecção de n8n v1.x vs v2+
- ✓ Verificação de Chat Hub disponível
- ✓ Múltiplos métodos de detecção
- ✓ Mock de versões

**Resultado esperado**: 8-9 testes passando

#### `provider-injection.test.js`
Testa lógica de injeção do provider.

**Como executar:**
```bash
node tests/unit/provider-injection.test.js
```

**O que testa:**
- ✓ Status de injeção
- ✓ Idempotência
- ✓ Force injection
- ✓ Compatibilidade de versão
- ✓ Auto-injection

**Resultado esperado**: 8-9 testes passando

### 3. Teste de Integração (`integration-test.js`)
Teste end-to-end com ambiente simulado.

**Como executar:**
```bash
# Básico
node tests/integration-test.js

# Com simulação de versão
node tests/integration-test.js --version=2.15.3 --debug
```

**Opções:**
- `--version=X.X.X` - Simula versão do n8n
- `--debug` - Logging detalhado
- `--auto-inject` - Simula auto-injection

**Resultado esperado**: 7/7 testes passando

### 4. Debug Interativo (`debug-provider-injection.js`)
Script step-by-step para diagnóstico.

**Como executar:**
```bash
node tests/debug-provider-injection.js
```

**Features:**
- ✓ Inspeção interativa do ambiente
- ✓ Mock de versões
- ✓ Colored output
- ✓ Gera `diagnostic-report.json`

---

## 📊 Status dos Testes

| Componente | Status | Cobertura |
|------------|--------|-----------|
| version-detection | ✅ OK | 8/9 testes |
| provider-injection | ✅ OK | 8/9 testes |
| integration-test | ✅ OK | 7/7 testes |
| API models | ✅ OK | Funcionando |

---

## 🎯 Executando Todos os Testes

```bash
# Testes unitários
node tests/unit/version-detection.test.js
node tests/unit/provider-injection.test.js

# Integração
node tests/integration-test.js --version=2.15.3 --debug

# API (opcional)
node tests/test-all-models.js
```

---

## 📋 Requisitos

1. **Build**: Execute `npm run build` antes dos testes
2. **Token**: Arquivo `.token` na raiz (para testes de API)
3. **Node.js**: v18+ recomendado

---

## 🐛 Troubleshooting

### "Cannot find module './dist/shared/utils/version-detection'"
**Solução**: Execute `npm run build`

### "n8n version not detected"
**Solução**: Normal em dev. Use `--version=2.15.3` para simular

### "Injection skipped: n8n v2+ required"
**Solução**: Use `--version=2.15.3` ou teste em n8n v2+ real

### Provider não aparece no n8n
**Solução**: Veja [troubleshooting docs](../docs/202601230030-provider-injection-troubleshooting.md)

---

## 📄 Relatórios Gerados

- `integration-test-report.json` - Resultado de integração
- `diagnostic-report.json` - Debug interativo
- `test-results-[timestamp].json` - Testes de API

---

## 🎯 Próximos Passos

Para validação completa, teste em n8n v2+ real:

```bash
# Instalar n8n v2+
npm install -g n8n@latest

# Instalar pacote
cd ~/.n8n/nodes
npm install n8n-nodes-github-copilot@4.2.0

# Configurar
export GITHUB_COPILOT_AUTO_INJECT=true
export GITHUB_COPILOT_DEBUG=true

# Iniciar e verificar logs
n8n start
```

---
- Comum para Anthropic/Google em contas básicas

### ❌ **Erro 401 (Unauthorized)**
- Token inválido ou expirado
- Verificar arquivo `.token`

### ❌ **Erro 429 (Rate Limited)**
- Muitas requisições
- Aguardar e tentar novamente

## 🔧 **Desenvolvimento**

Para criar novos testes, seguir o padrão:
1. Carregar dados dos arquivos: `../models.json` e `../.token`
2. Usar caminhos relativos sempre
3. Não hardcodar modelos ou tokens
4. Salvar resultados em arquivos JSON
5. Incluir validação de segurança

---

**Nota**: Todos os testes seguem as diretrizes de segurança documentadas em `../.github/copilot-instructions.md`