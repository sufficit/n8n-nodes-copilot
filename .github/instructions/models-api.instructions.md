# GitHub Copilot Models API - Usage Instructions

**Project**: n8n-nodes-github-copilot  
**Purpose**: Documentation of GitHub Copilot models endpoint and usage of `model_picker_enabled` property

## GitHub Copilot Models Endpoint

### URL
```
GET https://api.githubcopilot.com/models
```

### Authentication
```javascript
headers: {
    'Authorization': `Bearer ${gho_token}`,
    'Accept': 'application/json',
    'X-GitHub-Api-Version': '2025-07-16'
}
```

### API Response
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

## Property `model_picker_enabled`

### Definition
Property `model_picker_enabled` controls **which models appear in GitHub Copilot selection interface**.

### Possible Values
- `true`: Model **enabled** for interface selection
- `false`: Model **disabled** (does not appear in interface)
- `undefined/null`: **Default** (treated as enabled)

### Project Usage
```javascript
// Filter only interface-enabled models
const enabledModels = allModels.filter(model => 
    model.model_picker_enabled !== false
);
```

## Analysis of 28 Models (Current State)

### ✅ **Enabled Models** (`model_picker_enabled: true`) - **12 models**

#### **Azure OpenAI (5 models)**
- `gpt-4.1` - GPT-4.1 (versatile)
- `gpt-5-mini` - GPT-5 mini (lightweight)  
- `gpt-5` - GPT-5 (versatile)
- `gpt-4o` - GPT-4o (versatile)
- `o3-mini` - o3-mini (lightweight)

#### **Anthropic (5 models)**
- `claude-3.5-sonnet` - Claude Sonnet 3.5 (versatile)
- `claude-3.7-sonnet` - Claude Sonnet 3.7 (versatile)
- `claude-3.7-sonnet-thought` - Claude Sonnet 3.7 Thinking (powerful)
- `claude-sonnet-4` - Claude Sonnet 4 (versatile)
- `claude-opus-4` - Claude Opus 4 (powerful)

#### **Google (2 models)**
- `gemini-2.0-flash-001` - Gemini 2.0 Flash (lightweight)
- `gemini-2.5-pro` - Gemini 2.5 Pro (powerful)

### ❌ **Disabled Models** (`model_picker_enabled: false`) - **16 models**

#### **Old/Superseded Versions**
- `gpt-3.5-turbo` / `gpt-3.5-turbo-0613` - Replaced by GPT-4+
- `gpt-4` / `gpt-4-0613` - Replaced by GPT-4.1/GPT-5
- `gpt-4o-mini` / `gpt-4o-mini-2024-07-18` - Mini version disabled

#### **Date-Specific Versions**
- `gpt-4o-2024-11-20` - Specific version (generic `gpt-4o` enabled)
- `gpt-4o-2024-05-13` - Old version
- `gpt-4o-2024-08-06` - Old version
- `gpt-4-o-preview` - Preview disabled
- `o3-mini-2025-01-31` - Specific version (generic `o3-mini` enabled)
- `o3-mini-paygo` - Pay-as-you-go version
- `gpt-4.1-2025-04-14` - Specific version (generic `gpt-4.1` enabled)

#### **Embedding Models**
- `text-embedding-ada-002` - Embedding V2 Ada
- `text-embedding-3-small` - Embedding V3 small
- `text-embedding-3-small-inference` - Embedding V3 small (Inference)

## Practical Implementation

### Model Loading
```javascript
// Load models from local file
const fs = require('fs');
const modelsData = JSON.parse(fs.readFileSync('./models.json', 'utf8'));

// Filter only enabled models
const enabledModels = modelsData.data.filter(model => 
    model.model_picker_enabled !== false
);

console.log(`Total models: ${modelsData.data.length}`);
console.log(`Enabled models: ${enabledModels.length}`);
```

### Categorization by Provider
```javascript
const modelsByProvider = {};
enabledModels.forEach(model => {
    if (!modelsByProvider[model.vendor]) {
        modelsByProvider[model.vendor] = [];
    }
    modelsByProvider[model.vendor].push(model);
});

// Result:
// Azure OpenAI: 5 models
// Anthropic: 5 models  
// Google: 2 models
```

### UI List Generation
```javascript
// For dropdowns/selects in interface
const modelOptions = enabledModels.map(model => ({
    name: `${model.name} (${model.vendor})`,
    value: model.id,
    category: model.model_picker_category || 'general',
    description: `${model.vendor} - ${model.model_picker_category || 'general'}`
}));
```

## Model Categories

### model_picker_category
- `"versatile"` - Balanced models for general use
- `"lightweight"` - Fast and efficient models
- `"powerful"` - Most advanced models for complex tasks

### Distribution by Category
```javascript
const byCategory = {
    versatile: ['gpt-4.1', 'gpt-5', 'gpt-4o', 'claude-3.5-sonnet', 'claude-3.7-sonnet', 'claude-sonnet-4'],
    lightweight: ['gpt-5-mini', 'o3-mini', 'gemini-2.0-flash-001'],
    powerful: ['claude-3.7-sonnet-thought', 'claude-opus-4', 'gemini-2.5-pro']
};
```

## Recommended Future Usage

### 1. Model Cache
```javascript
// Implement cache to avoid repeated API calls
class ModelsCache {
    static cache = null;
    static lastUpdate = 0;
    static CACHE_DURATION = 300000; // 5 minutes

    static async getModels(token) {
        if (this.cache && Date.now() - this.lastUpdate < this.CACHE_DURATION) {
            return this.cache;
        }

        const response = await fetch('https://api.githubcopilot.com/models', {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'X-GitHub-Api-Version': '2025-07-16'
            }
        });
        
        this.cache = await response.json();
        this.lastUpdate = Date.now();
        return this.cache;
    }
}
```

### 2. Automatic Detection of Available Models
```javascript
// Automatically test which models work
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

### 3. Dynamic UI by Subscription
```javascript
// Show only models that work for user
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

## Important Observations

### Subscription Limitations
- Not all enabled models (`model_picker_enabled: true`) work in all accounts
- Anthropic and Google may require premium subscription
- Some Azure OpenAI models also have specific restrictions

### Fallback Strategy
```javascript
// Always have fallback to working models
const FALLBACK_MODELS = ['gpt-5-mini', 'gpt-5']; // Verified functional

async function getChatCompletion(token, model, messages) {
    try {
        return await callModel(token, model, messages);
    } catch (error) {
        if (error.status === 403) {
            // Try fallback
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

## Node Implementation Guidelines

### When Loading Models
1. **Always filter** by `model_picker_enabled !== false`
2. **Cache results** to avoid repeated API calls
3. **Test availability** before showing to user
4. **Provide fallback** for unavailable models

### When Displaying Models
1. **Group by provider** for better organization
2. **Show category** (lightweight/versatile/powerful)
3. **Indicate availability** per user subscription
4. **Sort by relevance** (most used first)

### When Using Models
1. **Validate availability** before API call
2. **Handle 403 errors** with fallback
3. **Log failures** for debugging
4. **Update cache** when new models detected

---

**Conclusion**: Property `model_picker_enabled` is fundamental for filtering relevant models and avoiding duplicate/obsolete versions. Always use this property as basis for model selection in interface.

**Last Updated**: 2025-01-22
