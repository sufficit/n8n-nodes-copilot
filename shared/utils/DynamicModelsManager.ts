/**
 * Dynamic Models Manager
 * 
 * Manages GitHub Copilot models dynamically based on user authentication.
 * Fetches and caches available models per user token.
 */

import { GITHUB_COPILOT_API } from "./GitHubCopilotEndpoints";

/**
 * Model information from GitHub Copilot API
 */
interface CopilotModel {
  id: string;
  name: string;
  display_name?: string;
  model_picker_enabled?: boolean;
  model_picker_category?: "lightweight" | "versatile" | "powerful" | string;
  capabilities?: any;
  vendor?: string;
  version?: string;
  preview?: boolean;
  /** Billing information - only available with X-GitHub-Api-Version: 2025-05-01 header */
  billing?: {
    is_premium: boolean;
    multiplier: number;
    restricted_to?: string[];
  };
  is_chat_default?: boolean;
  is_chat_fallback?: boolean;
}

/**
 * API response format
 */
interface ModelsResponse {
  data: CopilotModel[];
}

/**
 * Cached models with metadata
 */
interface ModelCache {
  models: CopilotModel[];
  fetchedAt: number;
  expiresAt: number;
  tokenHash: string;
}

/**
 * Dynamic Models Manager
 * Fetches and caches available models per authenticated user
 */
export class DynamicModelsManager {
  private static cache: Map<string, ModelCache> = new Map();
  private static readonly CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour
  private static readonly MIN_REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Generate a hash for the token (for cache key)
   */
  private static hashToken(token: string): string {
    // Simple hash for cache key (not cryptographic)
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      const char = token.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `models_${Math.abs(hash).toString(36)}`;
  }

  /**
   * Fetch models from GitHub Copilot API
   */
  private static async fetchModelsFromAPI(oauthToken: string): Promise<CopilotModel[]> {
    const url = `${GITHUB_COPILOT_API.BASE_URL}${GITHUB_COPILOT_API.ENDPOINTS.MODELS}`;

    console.log("🔄 Fetching available models from GitHub Copilot API...");

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${oauthToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": "GitHubCopilotChat/0.35.0",
        "Editor-Version": "vscode/1.96.0",
        "Editor-Plugin-Version": "copilot-chat/0.35.0",
        // CRITICAL: This API version returns billing.multiplier field
        // Source: microsoft/vscode-copilot-chat networking.ts
        "X-GitHub-Api-Version": "2025-05-01",
        "X-Interaction-Type": "model-access",
        "OpenAI-Intent": "model-access",
        "Copilot-Integration-Id": "vscode-chat",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Failed to fetch models: ${response.status} ${response.statusText}`);
      console.error(`❌ Error details: ${errorText}`);
      throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as ModelsResponse;

    // Return ALL models (no filtering by model_picker_enabled)
    console.log(`✅ Fetched ${data.data.length} models from API`);

    return data.data;
  }

  /**
   * Get models for authenticated user (with caching)
   */
  public static async getAvailableModels(oauthToken: string): Promise<CopilotModel[]> {
    const tokenHash = this.hashToken(oauthToken);
    const now = Date.now();

    // Check cache
    const cached = this.cache.get(tokenHash);
    if (cached && cached.expiresAt > now) {
      const remainingMinutes = Math.round((cached.expiresAt - now) / 60000);
      console.log(`✅ Using cached models (expires in ${remainingMinutes} minutes)`);
      return cached.models;
    }

    // Check if we should wait before refreshing (avoid spam)
    if (cached && now - cached.fetchedAt < this.MIN_REFRESH_INTERVAL_MS) {
      const waitSeconds = Math.round((this.MIN_REFRESH_INTERVAL_MS - (now - cached.fetchedAt)) / 1000);
      console.log(`⏰ Models fetched recently, using cache (min refresh interval: ${waitSeconds}s)`);
      return cached.models;
    }

    // Fetch from API
    try {
      const models = await this.fetchModelsFromAPI(oauthToken);

      // Cache the result
      this.cache.set(tokenHash, {
        models,
        fetchedAt: now,
        expiresAt: now + this.CACHE_DURATION_MS,
        tokenHash,
      });

      return models;
    } catch (error) {
      console.error("❌ Failed to fetch models from API:", error);

      // Return cached models if available (even if expired)
      if (cached) {
        console.log("⚠️ Using expired cache as fallback");
        return cached.models;
      }

      // No cache available, throw error
      throw error;
    }
  }

  /**
   * Filter models by type (chat, embeddings, etc.)
   */
  public static filterModelsByType(models: CopilotModel[], type: string): CopilotModel[] {
    return models.filter((model) => {
      const modelType = (model.capabilities as any)?.type;
      return modelType === type;
    });
  }

  /**
   * Get cost multiplier from API billing data or fallback to estimation
   * 
   * With X-GitHub-Api-Version: 2025-05-01, the API returns:
   * - billing.multiplier: 0, 0.33, 1, 3, or 10
   * - billing.is_premium: boolean
   * 
   * Display format: "0x", "0.33x", "1x", "3x", "10x"
   */
  private static getCostMultiplier(model: CopilotModel): string {
    // BEST: Use API billing data if available (requires 2025-05-01 header)
    if (model.billing?.multiplier !== undefined) {
      return `${model.billing.multiplier}x`;
    }
    
    // FALLBACK: Estimate based on model ID patterns
    // This is used when API doesn't return billing data
    const id = model.id.toLowerCase();
    
    // === 0x FREE TIER ===
    // GPT-4 series (legacy, included in subscription)
    if (id === 'gpt-4.1' || id.startsWith('gpt-4.1-')) return '0x';
    if (id === 'gpt-4o' || id.startsWith('gpt-4o-')) return '0x';
    if (id === 'gpt-4' || id === 'gpt-4-0613') return '0x';
    // Mini models
    if (id === 'gpt-5-mini') return '0x';
    if (id === 'gpt-4o-mini' || id.startsWith('gpt-4o-mini-')) return '0x';
    // Grok fast models
    if (id.includes('grok') && id.includes('fast')) return '0x';
    // Raptor mini (ID: oswe-vscode-prime)
    if (id === 'oswe-vscode-prime' || id.includes('oswe-vscode')) return '0x';
    
    // === 0.33x ECONOMY TIER ===
    // Claude Haiku (economy)
    if (id.includes('haiku')) return '0.33x';
    // Gemini Flash models
    if (id.includes('flash')) return '0.33x';
    // Codex-Mini models
    if (id.includes('codex-mini')) return '0.33x';
    
    // === 10x ULTRA PREMIUM ===
    // Claude Opus 4.1 specifically
    if (id === 'claude-opus-41' || id === 'claude-opus-4.1') return '10x';
    
    // === 3x PREMIUM TIER ===
    // Claude Opus 4.5
    if (id.includes('opus')) return '3x';
    
    // === 1x STANDARD TIER (default for most models) ===
    // GPT-5 series (including Codex variants - they are 1x, not 3x!)
    // Claude Sonnet
    // Gemini Pro
    // Everything else
    return '1x';
  }

  /**
   * Convert models to n8n options format with capability badges
   */
  public static modelsToN8nOptions(models: CopilotModel[]): Array<{
    name: string;
    value: string;
    description?: string;
  }> {
    // First pass: count how many models share the same display name
    const nameCount = new Map<string, number>();
    models.forEach((model) => {
      const displayName = model.display_name || model.name || model.id;
      nameCount.set(displayName, (nameCount.get(displayName) || 0) + 1);
    });

    return models.map((model) => {
      // Build capability badges/chips
      const badges: string[] = [];
      
      if (model.capabilities) {
        const supports = (model.capabilities as any).supports || {};
        
        // Check each capability and add corresponding badge
        if (supports.streaming) badges.push("🔄 Streaming");
        if (supports.tool_calls) badges.push("🔧 Tools");
        if (supports.vision) badges.push("👁️ Vision");
        if (supports.structured_outputs) badges.push("📋 Structured");
        if (supports.parallel_tool_calls) badges.push("⚡ Parallel");
        
        // Check for thinking capabilities (reasoning models)
        if (supports.max_thinking_budget) badges.push("🧠 Reasoning");
      }
      
      // Build display name with badges and cost multiplier (VS Code style: "Model Name • 1x")
      const displayName = model.display_name || model.name || model.id;
      const costMultiplier = this.getCostMultiplier(model);
      const badgesText = badges.length > 0 ? ` [${badges.join(" • ")}]` : "";
      
      // Check if this display name has duplicates
      const hasDuplicates = (nameCount.get(displayName) || 0) > 1;
      
      // Get category label (capitalize first letter)
      const category = model.model_picker_category || "";
      const categoryLabel = category ? ` - ${category.charAt(0).toUpperCase() + category.slice(1)}` : "";
      
      // Format: "Model Name • 0x - Lightweight [badges]"
      const multiplierDisplay = ` • ${costMultiplier}${categoryLabel}`;
      
      // Build description with more details
      let description = "";
      if (model.capabilities) {
        const limits = (model.capabilities as any).limits || {};
        const parts: string[] = [];
        
        // If duplicates exist, add model ID
        if (hasDuplicates) {
          parts.push(`ID: ${model.id}`);
        }
        
        if (limits.max_context_window_tokens) {
          parts.push(`Context: ${(limits.max_context_window_tokens / 1000).toFixed(0)}k`);
        }
        if (limits.max_output_tokens) {
          parts.push(`Output: ${(limits.max_output_tokens / 1000).toFixed(0)}k`);
        }
        if (model.vendor) {
          parts.push(`Provider: ${model.vendor}`);
        }
        
        description = parts.join(" • ");
      } else {
        // No capabilities, just show ID if duplicates
        if (hasDuplicates) {
          description = `ID: ${model.id}`;
        }
      }

      return {
        name: `${displayName}${multiplierDisplay}${badgesText}`,
        value: model.id,
        description: description || undefined,
      };
    });
  }

  /**
   * Clear cache for specific token
   */
  public static clearCache(oauthToken: string): void {
    const tokenHash = this.hashToken(oauthToken);
    this.cache.delete(tokenHash);
    console.log("🗑️ Cleared models cache");
  }

  /**
   * Clear all cached models
   */
  public static clearAllCache(): void {
    this.cache.clear();
    console.log("🗑️ Cleared all models cache");
  }

  /**
   * Get cache info for debugging
   */
  public static getCacheInfo(oauthToken: string): {
    cached: boolean;
    modelsCount: number;
    expiresIn: number;
    fetchedAt: string;
  } | null {
    const tokenHash = this.hashToken(oauthToken);
    const cached = this.cache.get(tokenHash);

    if (!cached) {
      return null;
    }

    const now = Date.now();
    return {
      cached: true,
      modelsCount: cached.models.length,
      expiresIn: Math.max(0, cached.expiresAt - now),
      fetchedAt: new Date(cached.fetchedAt).toISOString(),
    };
  }
}
