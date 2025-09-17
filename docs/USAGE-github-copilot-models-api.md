# USAGE - GitHub Copilot Models API

**Data**: 17 de setembro de 2025  
**Projeto**: n8n-nodes-github-copilot  
**Objetivo**: Documentação do endpoint de modelos GitHub Copilot e uso da propriedade `model_picker_enabled`

## 🌐 **Endpoint GitHub Copilot Models**

### **URL**
```
GET https://api.githubcopilot.com/models
```

### **Autenticação**
```javascript
headers: {
    'Authorization': `Bearer ${gho_token}`,
    'Accept': 'application/json'
}
```

### **Resposta da API**
```json
{
  "data": [
    {
      "id": "gpt-5-mini",
      "name": "GPT-5 mini",
      "vendor": "Azure OpenAI",
      "model_picker_enabled": true,
      "model_picker_category": "lightweight",
      "capabilities": { ... },
      "policy": { ... }
    }
  ],
  "object": "list"
}
```

## 🎯 **Propriedade `model_picker_enabled`**

### **Definição**
A propriedade `model_picker_enabled` controla **quais modelos aparecem na interface de seleção** do GitHub Copilot.

### **Valores Possíveis**
- `true`: Modelo **habilitado** para seleção na interface
- `false`: Modelo **desabilitado** (não aparece na interface)
- `undefined/null`: **Padrão** (tratado como habilitado)

### **Uso no Projeto**
```javascript
// Filtrar apenas modelos habilitados para interface
const enabledModels = allModels.filter(model => 
    model.model_picker_enabled !== false
);
```

## 📊 **Análise dos 28 Modelos (Estado Atual)**

### ✅ **Modelos Habilitados** (`model_picker_enabled: true`) - **12 modelos**

#### **Azure OpenAI (5 modelos)**
- `gpt-4.1` - GPT-4.1 (versatile)
- `gpt-5-mini` - GPT-5 mini (lightweight)  
- `gpt-5` - GPT-5 (versatile)
- `gpt-4o` - GPT-4o (versatile)
- `o3-mini` - o3-mini (lightweight)

#### **Anthropic (5 modelos)**
- `claude-3.5-sonnet` - Claude Sonnet 3.5 (versatile)
- `claude-3.7-sonnet` - Claude Sonnet 3.7 (versatile)
- `claude-3.7-sonnet-thought` - Claude Sonnet 3.7 Thinking (powerful)
- `claude-sonnet-4` - Claude Sonnet 4 (versatile)
- `claude-opus-4` - Claude Opus 4 (powerful)

#### **Google (2 modelos)**
- `gemini-2.0-flash-001` - Gemini 2.0 Flash (lightweight)
- `gemini-2.5-pro` - Gemini 2.5 Pro (powerful)

### ❌ **Modelos Desabilitados** (`model_picker_enabled: false`) - **16 modelos**

#### **Versões Antigas/Superseded**
- `gpt-3.5-turbo` / `gpt-3.5-turbo-0613` - Substituídos por GPT-4+
- `gpt-4` / `gpt-4-0613` - Substituídos por GPT-4.1/GPT-5
- `gpt-4o-mini` / `gpt-4o-mini-2024-07-18` - Versão mini desabilitada

#### **Versões Específicas com Data**
- `gpt-4o-2024-11-20` - Versão específica (genérica `gpt-4o` habilitada)
- `gpt-4o-2024-05-13` - Versão antiga
- `gpt-4o-2024-08-06` - Versão antiga
- `gpt-4-o-preview` - Preview desabilitado
- `o3-mini-2025-01-31` - Versão específica (genérica `o3-mini` habilitada)
- `o3-mini-paygo` - Versão pay-as-you-go
- `gpt-4.1-2025-04-14` - Versão específica (genérica `gpt-4.1` habilitada)

#### **Modelos de Embedding**
- `text-embedding-ada-002` - Embedding V2 Ada
- `text-embedding-3-small` - Embedding V3 small
- `text-embedding-3-small-inference` - Embedding V3 small (Inference)

## 🔧 **Implementação Prática**

### **Carregamento de Modelos**
```javascript
// Carregar modelos do arquivo local
const fs = require('fs');
const modelsData = JSON.parse(fs.readFileSync('./models.json', 'utf8'));

// Filtrar apenas modelos habilitados
const enabledModels = modelsData.data.filter(model => 
    model.model_picker_enabled !== false
);

console.log(`Total modelos: ${modelsData.data.length}`);
console.log(`Modelos habilitados: ${enabledModels.length}`);
```

### **Categorização por Provider**
```javascript
const modelsByProvider = {};
enabledModels.forEach(model => {
    if (!modelsByProvider[model.vendor]) {
        modelsByProvider[model.vendor] = [];
    }
    modelsByProvider[model.vendor].push(model);
});

// Resultado:
// Azure OpenAI: 5 modelos
// Anthropic: 5 modelos  
// Google: 2 modelos
```

### **Geração de Lista para UI**
```javascript
// Para dropdowns/selects na interface
const modelOptions = enabledModels.map(model => ({
    name: `${model.name} (${model.vendor})`,
    value: model.id,
    category: model.model_picker_category || 'general',
    description: `${model.vendor} - ${model.model_picker_category || 'general'}`
}));
```

## 📋 **Categorias de Modelos**

### **model_picker_category**
- `"versatile"` - Modelos equilibrados para uso geral
- `"lightweight"` - Modelos rápidos e eficientes
- `"powerful"` - Modelos mais avançados para tarefas complexas

### **Distribuição por Categoria**
```javascript
const byCategory = {
    versatile: ['gpt-4.1', 'gpt-5', 'gpt-4o', 'claude-3.5-sonnet', 'claude-3.7-sonnet', 'claude-sonnet-4'],
    lightweight: ['gpt-5-mini', 'o3-mini', 'gemini-2.0-flash-001'],
    powerful: ['claude-3.7-sonnet-thought', 'claude-opus-4', 'gemini-2.5-pro']
};
```

## 🚀 **Uso Futuro Recomendado**

### **1. Cache de Modelos**
```javascript
// Implementar cache para evitar chamadas repetidas à API
class ModelsCache {
    static cache = null;
    static lastUpdate = 0;
    static CACHE_DURATION = 300000; // 5 minutos

    static async getModels(token) {
        if (this.cache && Date.now() - this.lastUpdate < this.CACHE_DURATION) {
            return this.cache;
        }

        const response = await fetch('https://api.githubcopilot.com/models', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        this.cache = await response.json();
        this.lastUpdate = Date.now();
        return this.cache;
    }
}
```

### **2. Detecção Automática de Modelos Disponíveis**
```javascript
// Testar automaticamente quais modelos funcionam
async function getWorkingModels(token) {
    const allModels = await ModelsCache.getModels(token);
    const enabledModels = allModels.data.filter(m => m.model_picker_enabled !== false);
    
    const workingModels = [];
    for (const model of enabledModels) {
        const isWorking = await testModel(token, model.id);
        if (isWorking) workingModels.push(model);
    }
    
    return workingModels;
}
```

### **3. UI Dinâmica por Subscription**
```javascript
// Mostrar apenas modelos que funcionam para o usuário
export async function getAvailableModelOptions(context) {
    const token = await getToken(context);
    const workingModels = await getWorkingModels(token);
    
    return workingModels.map(model => ({
        name: `${model.name} (${model.vendor})`,
        value: model.id,
        description: `Available - ${model.model_picker_category}`
    }));
}
```

## ⚠️ **Observações Importantes**

### **Limitações por Subscription**
- Nem todos os modelos habilitados (`model_picker_enabled: true`) funcionam em todas as contas
- Anthropic e Google podem requerer subscription premium
- Alguns modelos Azure OpenAI também têm restrições específicas

### **Fallback Strategy**
```javascript
// Sempre ter fallback para modelos que funcionam
const FALLBACK_MODELS = ['gpt-5-mini', 'gpt-5']; // Verificadamente funcionais

async function getChatCompletion(token, model, messages) {
    try {
        return await callModel(token, model, messages);
    } catch (error) {
        if (error.status === 403) {
            // Tentar fallback
            for (const fallback of FALLBACK_MODELS) {
                try {
                    return await callModel(token, fallback, messages);
                } catch (fallbackError) {
                    continue;
                }
            }
        }
        throw error;
    }
}
```

---

**Conclusão**: A propriedade `model_picker_enabled` é fundamental para filtrar modelos relevantes e evitar versões duplicadas/obsoletas. Sempre usar esta propriedade como base para seleção de modelos na interface.