# GitHub Copilot Tests

Esta pasta contém scripts de teste para validar o funcionamento dos modelos GitHub Copilot.

## 🧪 **Scripts Disponíveis**

### `test-all-models.js`
Script principal que testa todos os modelos disponíveis automaticamente.

**Características:**
- ✅ Carrega modelos automaticamente do `../models.json`
- ✅ Carrega token automaticamente do `../.token`
- ✅ Testa modelos representativos de cada provider
- ✅ Gera relatório detalhado em `test-results.json`
- ✅ Identifica problemas de subscription/acesso

**Como executar:**
```bash
# Da raiz do projeto
node ./tests/test-all-models.js
```

**Saída esperada:**
- Lista de modelos funcionais
- Erros de acesso por provider
- Recomendações baseadas nos resultados
- Arquivo `test-results.json` com dados completos

## 📋 **Requisitos**

1. **Token válido**: Arquivo `../.token` com token GitHub Copilot (formato `gho_*`)
2. **Modelos atualizados**: Arquivo `../models.json` com lista atual da API
3. **Acesso à internet**: Para testar API GitHub Copilot

## 🎯 **O que o teste verifica**

1. **Formato do token**: Validação `gho_*`
2. **Acesso à API**: Endpoint `/models`
3. **Modelos individuais**: Chat completions para cada modelo
4. **Restrições de acesso**: Headers de erro 403/401
5. **Performance**: Rate limiting e timeouts

## 📊 **Interpretação dos Resultados**

### ✅ **Sucesso**
- Modelo responde corretamente
- Disponível para uso em produção

### ❌ **Erro 403 (Forbidden)**
- Modelo requer subscription premium
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