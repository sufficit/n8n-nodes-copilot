# VS Code Copilot Chat Model Pricing Multiplier Analysis

**Date**: 2025-10-26  
**Version**: 202510260200  
**Purpose**: Document how VS Code displays pricing multipliers (0x, 0.33x, 1x, 3x) in model picker

## Summary

Analyzed the VS Code GitHub Copilot Chat extension (`github.copilot-chat-0.35.2`) to understand how the pricing multiplier display (0x, 0.33x, 1x, 3x) is implemented.

## Key Findings

### 1. Multiplier Source

The `multiplier` value comes from an internal billing object that is **NOT** returned by the public `/models` API endpoint.

```javascript
// How VS Code receives multiplier (from extension.js analysis):
this.multiplier = e.billing?.multiplier

// Display format:
t.details = `${s.name} • ${s.multiplier ?? 0}x`
```

### 2. Billing Object Structure

```javascript
billing: {
  is_premium: _.isPremium,
  multiplier: _.multiplier,
  restricted_to: _.restrictedToSkus
}
```

### 3. API Confirmation

Tested the public `/models` endpoint - **billing field is NOT returned**:

```javascript
// API response:
{
  "id": "gpt-5",
  "model_picker_category": "versatile",
  "billing": undefined  // NOT present
}
```

### 4. Category Mapping

Based on the `model_picker_category` field, we implemented the following mapping:

| Category | Multiplier | Description | Example Models |
|----------|------------|-------------|----------------|
| `lightweight` | 0x | Free tier (included in subscription) | gpt-5-mini, grok-code-fast-1, gemini-3-flash-preview |
| `versatile` | 1x | Standard tier | gpt-5, claude-sonnet-4, gpt-4.1, gpt-4o |
| `powerful` | 3x | Premium tier | claude-opus-4.5, gpt-5.1-codex, gemini-2.5-pro |

### 5. Special Cases (ID-based overrides)

Some models have special pricing that overrides their category:

| Pattern | Multiplier | Reason |
|---------|------------|--------|
| `haiku` | 0.33x | Economy tier (even if in "versatile") |
| `flash` | 0.33x | Economy tier |
| `-mini` (no category) | 0x | Free tier |
| `codex` | 3x | Premium coding models |
| `opus` | 3x | Premium reasoning models |
| `-pro` | 3x | Premium models |

## Implementation

Updated `DynamicModelsManager.ts` with:

1. `getCostMultiplier()` function that maps categories + special cases
2. Display format: `"Model Name • 1x [🔧 Tools • 👁️ Vision]"`

## Files Analyzed

- **Extension Location**: `~/.vscode/extensions/github.copilot-chat-0.35.2/`
- **Main File**: `dist/extension.js` (15MB minified)
- **Key Patterns Found**:
  - 26 occurrences of "multiplier"
  - `${p.multiplier}x` for display
  - `e.billing?.multiplier` for value access

## Conclusion

Since the public API doesn't provide billing/multiplier data, we implemented a mapping based on:
1. `model_picker_category` field from API
2. Model ID patterns for special cases

This provides a good approximation of the VS Code pricing display while acknowledging that actual billing may vary based on subscription type.
