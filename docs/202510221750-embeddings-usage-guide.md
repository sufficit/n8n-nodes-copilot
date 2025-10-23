# GitHub Copilot Embeddings - Usage Guide
* **Version**: 202510221750
* **Last Updated**: 2025-10-22
* **Test Results**: Based on comprehensive testing of all available models

## Table of Contents
- [Overview](#overview)
- [Available Models](#available-models)
- [Model Recommendations](#model-recommendations)
- [Performance Comparison](#performance-comparison)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)
- [Limitations](#limitations)
- [Troubleshooting](#troubleshooting)

## Overview

GitHub Copilot provides **3 embedding models** via the `/embeddings` endpoint. All models are from **Azure OpenAI** and have been comprehensively tested with **100% success rate**.

### Key Features
- ✅ **Single input** and **batch processing** (up to 512 texts)
- ✅ **OAuth token** authentication (recommended)
- ✅ **Custom dimensions** support (selected models)
- ✅ **High reliability** (100% success rate in all tests)

## Available Models

### 1. text-embedding-3-small-inference 🏆 **RECOMMENDED**
```json
{
  "id": "text-embedding-3-small-inference",
  "name": "Embedding V3 small (Inference)",
  "vendor": "Azure OpenAI",
  "family": "text-embedding-3-small"
}
```

**Features:**
- ⚡ **Fastest**: 313ms average latency
- ✅ **Custom dimensions**: Yes (512, 1024, 1536)
- ✅ **Batch processing**: Yes (up to 512 inputs)
- 🎯 **Success rate**: 100% (6/6 tests passed)
- 🆕 **Optimized inference version**

**When to use:**
- ✅ Production applications requiring **low latency**
- ✅ Applications needing **custom dimensions**
- ✅ **Batch processing** of multiple texts
- ✅ **Default choice** for most use cases

---

### 2. text-embedding-3-small ⭐ **ALTERNATIVE**
```json
{
  "id": "text-embedding-3-small",
  "name": "Embedding V3 small",
  "vendor": "Azure OpenAI",
  "family": "text-embedding-3-small"
}
```

**Features:**
- ⚡ **Fast**: 338ms average latency (+25ms vs inference)
- ✅ **Custom dimensions**: Yes (512, 1024, 1536)
- ✅ **Batch processing**: Yes (up to 512 inputs)
- 🎯 **Success rate**: 100% (6/6 tests passed)
- 📦 **Standard V3 model**

**When to use:**
- ✅ When `text-embedding-3-small-inference` is unavailable
- ✅ Same features as inference version
- ✅ Virtually identical performance

---

### 3. text-embedding-ada-002 ⚠️ **LEGACY**
```json
{
  "id": "text-embedding-ada-002",
  "name": "Embedding V2 Ada",
  "vendor": "Azure OpenAI",
  "family": "text-embedding-ada-002"
}
```

**Features:**
- 🐌 **Slower**: 485ms average latency (+172ms vs inference)
- ❌ **Custom dimensions**: No (fixed 1536 only)
- ✅ **Batch processing**: Yes (up to 512 inputs)
- 🎯 **Success rate**: 100% (2/2 tests passed)
- 🕰️ **V2 legacy model**

**When to use:**
- ⚠️ **Not recommended** for new implementations
- ✅ Only if **compatibility with V2** is required
- ❌ No custom dimensions support
- 🐌 Significantly slower than V3 models

## Model Recommendations

### 🎯 Priority Order (User Choice)

#### **1st Choice: `text-embedding-3-small-inference`**
**Reasoning:**
- 🚀 Best performance (313ms)
- ✅ Full feature set (dimensions + batch)
- 🎯 100% reliability
- 🆕 Latest optimized version

**Use this model unless you have a specific reason not to.**

---

#### **2nd Choice: `text-embedding-3-small`**
**Reasoning:**
- ⚡ Nearly identical to inference version
- ✅ Same features
- 📊 Only 7% slower (25ms difference)

**Use this model if:**
- The inference version is unavailable
- You need a fallback option
- Compatibility testing purposes

---

#### **3rd Choice: `text-embedding-ada-002`**
**Reasoning:**
- 🕰️ Legacy V2 model
- ❌ No custom dimensions
- 🐌 55% slower than inference version

**Only use this model if:**
- You MUST maintain V2 compatibility
- You specifically need the ada-002 model
- You don't need custom dimensions

## Performance Comparison

### Latency (Lower is Better)

| Model | Avg Latency | vs Best | Tests |
|-------|------------|---------|-------|
| **text-embedding-3-small-inference** | **313ms** | - | 6/6 ✅ |
| text-embedding-3-small | 338ms | +8% | 6/6 ✅ |
| text-embedding-ada-002 | 485ms | +55% | 2/2 ✅ |

### Features Comparison

| Feature | Inference | 3-Small | Ada-002 |
|---------|-----------|---------|---------|
| **Custom Dimensions** | ✅ Yes | ✅ Yes | ❌ No |
| **Batch Processing** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Max Inputs** | 512 | 512 | 512 |
| **Default Dimensions** | 1536 | 1536 | 1536 |
| **Dimensions Range** | 512-1536 | 512-1536 | 1536 only |
| **Success Rate** | 100% | 100% | 100% |

## Usage Examples

### Example 1: Single Text (Default Dimensions)

**Recommended Model:** `text-embedding-3-small-inference`

```javascript
const response = await fetch('https://api.githubcopilot.com/embeddings', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${oauthToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'text-embedding-3-small-inference',
    input: ['Generate embeddings for this text']
  })
});

const data = await response.json();
// data.data[0].embedding => [0.123, -0.456, ...] (1536 dimensions)
```

**Response:**
```json
{
  "object": "list",
  "data": [
    {
      "object": "embedding",
      "index": 0,
      "embedding": [0.123, -0.456, ...] // 1536 values
    }
  ],
  "model": "text-embedding-3-small-inference",
  "usage": {
    "prompt_tokens": 6,
    "total_tokens": 6
  }
}
```

---

### Example 2: Batch Processing (Multiple Texts)

**Recommended Model:** `text-embedding-3-small-inference`

```javascript
const response = await fetch('https://api.githubcopilot.com/embeddings', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${oauthToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'text-embedding-3-small-inference',
    input: [
      'First document to embed',
      'Second document to embed',
      'Third document to embed'
    ]
  })
});

const data = await response.json();
// data.data => Array of 3 embeddings
```

**Response:**
```json
{
  "object": "list",
  "data": [
    {
      "object": "embedding",
      "index": 0,
      "embedding": [...]  // 1536 dimensions
    },
    {
      "object": "embedding",
      "index": 1,
      "embedding": [...]  // 1536 dimensions
    },
    {
      "object": "embedding",
      "index": 2,
      "embedding": [...]  // 1536 dimensions
    }
  ],
  "model": "text-embedding-3-small-inference",
  "usage": {
    "prompt_tokens": 18,
    "total_tokens": 18
  }
}
```

---

### Example 3: Custom Dimensions

**Recommended Model:** `text-embedding-3-small-inference` or `text-embedding-3-small`

**⚠️ NOT supported:** `text-embedding-ada-002`

```javascript
const response = await fetch('https://api.githubcopilot.com/embeddings', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${oauthToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'text-embedding-3-small-inference',
    input: ['Text with custom dimensions'],
    dimensions: 512  // Options: 512, 1024, 1536
  })
});

const data = await response.json();
// data.data[0].embedding => [0.123, -0.456, ...] (512 dimensions)
```

**Available Dimensions:**
- `512` - Smallest (faster processing, less storage)
- `1024` - Medium (balanced)
- `1536` - Default (maximum quality)

---

### Example 4: Fallback Strategy

**Implementation with automatic fallback:**

```javascript
const MODELS_PRIORITY = [
  'text-embedding-3-small-inference',  // 1st choice
  'text-embedding-3-small',            // 2nd choice
  'text-embedding-ada-002'             // 3rd choice (no dimensions)
];

async function generateEmbedding(text, dimensions = 1536) {
  for (const model of MODELS_PRIORITY) {
    try {
      const body = {
        model: model,
        input: [text]
      };
      
      // Only add dimensions if model supports it
      if (model !== 'text-embedding-ada-002' && dimensions !== 1536) {
        body.dimensions = dimensions;
      }
      
      const response = await fetch('https://api.githubcopilot.com/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${oauthToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      
      if (response.ok) {
        console.log(`✅ Success with model: ${model}`);
        return await response.json();
      }
      
      console.warn(`⚠️ Model ${model} failed, trying next...`);
    } catch (error) {
      console.error(`❌ Error with ${model}:`, error.message);
    }
  }
  
  throw new Error('All embedding models failed');
}

// Usage
const result = await generateEmbedding('My text', 512);
```

## Best Practices

### 1. Model Selection Strategy

```javascript
// ✅ RECOMMENDED: Use inference model as default
const DEFAULT_MODEL = 'text-embedding-3-small-inference';

// ✅ GOOD: Implement fallback chain
const FALLBACK_MODELS = [
  'text-embedding-3-small-inference',
  'text-embedding-3-small',
  'text-embedding-ada-002'
];

// ❌ AVOID: Using ada-002 as primary model
const BAD_DEFAULT = 'text-embedding-ada-002'; // Slower, no dimensions
```

---

### 2. Dimension Selection

```javascript
// ✅ RECOMMENDED: Use appropriate dimensions for your use case

// High-quality semantic search (default)
const dimensions = 1536;  // Best quality

// Balanced performance and storage
const dimensions = 1024;  // Good compromise

// Fast processing and minimal storage
const dimensions = 512;   // Acceptable quality

// ❌ AVOID: Using custom dimensions with ada-002
// This will fail with 400 error
```

---

### 3. Batch Processing

```javascript
// ✅ RECOMMENDED: Batch multiple texts in single request
const texts = ['text1', 'text2', 'text3', ...];  // Up to 512
const response = await fetch(endpoint, {
  body: JSON.stringify({
    model: 'text-embedding-3-small-inference',
    input: texts  // Array of texts
  })
});

// ❌ AVOID: Making separate requests for each text
// This is slower and may hit rate limits
for (const text of texts) {
  await fetch(endpoint, {
    body: JSON.stringify({
      model: 'text-embedding-3-small-inference',
      input: [text]  // One at a time
    })
  });
}
```

---

### 4. Error Handling

```javascript
// ✅ RECOMMENDED: Comprehensive error handling
try {
  const response = await fetch(endpoint, { ... });
  
  if (!response.ok) {
    const error = await response.json();
    
    if (error.error?.code === 'model_not_supported') {
      // Try fallback model
      console.log('Model not supported, using fallback');
    } else if (error.error?.code === 'invalid_request_error') {
      // Check request format
      console.error('Invalid request:', error.error.message);
    }
  }
  
  return await response.json();
} catch (error) {
  console.error('Network error:', error);
  throw error;
}
```

---

### 5. Performance Optimization

```javascript
// ✅ RECOMMENDED: Cache embeddings when possible
const embeddingCache = new Map();

async function getCachedEmbedding(text, model = 'text-embedding-3-small-inference') {
  const cacheKey = `${model}:${text}`;
  
  if (embeddingCache.has(cacheKey)) {
    return embeddingCache.get(cacheKey);
  }
  
  const embedding = await generateEmbedding(text, model);
  embeddingCache.set(cacheKey, embedding);
  
  return embedding;
}
```

## Limitations

### Known Limitations

1. **Max Inputs**: 512 texts per request (all models)
2. **Tokenizer**: All models use `cl100k_base`
3. **Vendor**: Only Azure OpenAI models available
4. **Authentication**: Requires OAuth token (GitHub token may work but not recommended)

### Model-Specific Limitations

#### text-embedding-ada-002
- ❌ No custom dimensions support
- ⚠️ Slower performance (485ms avg)
- 🕰️ Legacy V2 model

#### text-embedding-3-small & text-embedding-3-small-inference
- ✅ No significant limitations
- ✅ Full feature support

### API Rate Limits

**Note:** Rate limits depend on your GitHub Copilot subscription:
- Personal accounts: May have lower limits
- Organization accounts: Higher limits
- Monitor `X-RateLimit-*` headers in responses

## Troubleshooting

### Error: "model_not_supported"

**Cause:** Model ID is incorrect or model is not available

**Solution:**
```javascript
// ✅ Use exact model IDs from models.json
const VALID_MODELS = [
  'text-embedding-3-small-inference',
  'text-embedding-3-small',
  'text-embedding-ada-002'
];

// ❌ These will fail:
// - 'text-embedding-3-large'
// - 'text-3-small'
// - 'ada-002'
```

---

### Error: "dimensions parameter not supported"

**Cause:** Using dimensions parameter with `text-embedding-ada-002`

**Solution:**
```javascript
// ✅ Check model before adding dimensions
if (model !== 'text-embedding-ada-002') {
  body.dimensions = customDimensions;
}

// Or use V3 models only
const model = 'text-embedding-3-small-inference';  // Supports dimensions
```

---

### Error: 403 Forbidden

**Cause:** Invalid or expired OAuth token

**Solution:**
```javascript
// Regenerate OAuth token using scripts/generate-oauth-token.js
node scripts/generate-oauth-token.js

// Load fresh token
const oauthToken = fs.readFileSync('./.token.oauth', 'utf8').trim();
```

---

### Slow Performance

**Possible Causes:**
1. Using `text-embedding-ada-002` (legacy model)
2. Large batch sizes
3. Network latency

**Solutions:**
```javascript
// ✅ Use fastest model
const model = 'text-embedding-3-small-inference';  // 313ms avg

// ✅ Optimize batch size (512 max, but smaller may be faster)
const optimalBatchSize = 100;  // Test for your use case

// ✅ Use smaller dimensions if quality allows
const dimensions = 512;  // Faster than 1536
```

---

## Summary

### Quick Decision Tree

```
Need embeddings?
  │
  ├─ Need custom dimensions?
  │   │
  │   ├─ YES → Use text-embedding-3-small-inference (RECOMMENDED)
  │   │        or text-embedding-3-small (alternative)
  │   │
  │   └─ NO  → Still use text-embedding-3-small-inference (fastest)
  │            or text-embedding-ada-002 (if V2 compatibility required)
  │
  └─ Performance critical?
      │
      ├─ YES → Use text-embedding-3-small-inference (313ms avg) ⚡
      │
      └─ NO  → Any model works, but inference still recommended
```

### Final Recommendations

1. 🥇 **Default choice**: `text-embedding-3-small-inference`
2. 🥈 **Fallback**: `text-embedding-3-small`
3. 🥉 **Legacy only**: `text-embedding-ada-002`

**Let the user choose, but guide them to the best option!** 🎯

---

## Additional Resources

- **Test Results**: `./temp/embeddings-comprehensive-test-*.json`
- **API Documentation**: `./docs/USAGE-github-copilot-models-api.md`
- **OAuth Token Generation**: `./docs/202510221708-oauth-token-generation-guide.md`
- **Complete Discovery**: `./docs/202510221645-github-copilot-embeddings-complete-guide.md`

---

**Last tested**: 2025-10-22 with 3 models, 14 tests, 100% success rate ✅
