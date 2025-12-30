/**
 * Centralized model definitions for GitHub Copilot integration
 * This file maintains consistency across all nodes and provides
 * a single source of truth for available models and their capabilities
 * 
 * ⚠️ UPDATED: Based on GitHub Copilot API response (temp_models.json)
 * Last sync: 2025-06 - All models with model_picker_enabled: true
 */

export interface ModelCapability {
    /** Supports function/tools calling */
    toolsCalling: boolean;
    /** Supports vision/image processing */
    vision: boolean;
    /** Supports multimodal input (text + images) */
    multimodal: boolean;
    /** Maximum context window in tokens */
    maxContextTokens: number;
    /** Maximum output tokens */
    maxOutputTokens: number;
    /** Supports streaming responses */
    streaming: boolean;
    /** Provider of the model */
    provider: "OpenAI" | "Anthropic" | "Google" | "Microsoft" | "xAI";
    /** Model category based on model_picker_category from API */
    category: "chat" | "reasoning" | "coding" | "vision" | "multimodal" | "versatile" | "powerful" | "lightweight";
}

export interface GitHubCopilotModel {
    /** Model identifier for API calls */
    value: string;
    /** Display name for UI */
    name: string;
    /** Detailed description */
    description: string;
    /** Model capabilities */
    capabilities: ModelCapability;
    /** Whether model is recommended for general use */
    recommended: boolean;
    /** Release status */
    status: "stable" | "preview" | "experimental";
    /** Whether it's a premium model (requires pro/enterprise subscription) */
    isPremium?: boolean;
}

/**
 * Complete list of GitHub Copilot available models
 * Updated from REAL API response - June 2025
 * Source: temp_models.json (all models with model_picker_enabled: true)
 */
export const GITHUB_COPILOT_MODELS: GitHubCopilotModel[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // AUTO SELECTION (important!)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    value: "auto",
    name: "Auto (Recommended)",
    description: "Automatically selects the best model for your task",
    capabilities: {
      toolsCalling: true,
      vision: true,
      multimodal: true,
      maxContextTokens: 128000,
      maxOutputTokens: 16384,
      streaming: true,
      provider: "OpenAI",
      category: "versatile"
    },
    recommended: true,
    status: "stable"
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // OpenAI GPT-5 FAMILY - From API (gpt-5 series)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    value: "gpt-5",
    name: "GPT-5",
    description: "Latest generation GPT model with vision (400K context, 128K output) - PREMIUM",
    capabilities: {
      toolsCalling: true,
      vision: true,
      multimodal: true,
      maxContextTokens: 400000,
      maxOutputTokens: 128000,
      streaming: true,
      provider: "OpenAI",
      category: "versatile"
    },
    recommended: true,
    status: "stable",
    isPremium: true
  },
  {
    value: "gpt-5-mini",
    name: "GPT-5 Mini",
    description: "Faster GPT-5 model with vision (264K context, 64K output) - PREMIUM",
    capabilities: {
      toolsCalling: true,
      vision: true,
      multimodal: true,
      maxContextTokens: 264000,
      maxOutputTokens: 64000,
      streaming: true,
      provider: "OpenAI",
      category: "versatile"
    },
    recommended: true,
    status: "stable",
    isPremium: true
  },
  {
    value: "gpt-5.1",
    name: "GPT-5.1",
    description: "Enhanced GPT-5 model with vision (264K context, 64K output) - PREMIUM",
    capabilities: {
      toolsCalling: true,
      vision: true,
      multimodal: true,
      maxContextTokens: 264000,
      maxOutputTokens: 64000,
      streaming: true,
      provider: "OpenAI",
      category: "versatile"
    },
    recommended: true,
    status: "stable",
    isPremium: true
  },
  {
    value: "gpt-5.2",
    name: "GPT-5.2",
    description: "Latest GPT-5.2 model with vision (264K context, 64K output) - PREMIUM",
    capabilities: {
      toolsCalling: true,
      vision: true,
      multimodal: true,
      maxContextTokens: 264000,
      maxOutputTokens: 64000,
      streaming: true,
      provider: "OpenAI",
      category: "versatile"
    },
    recommended: true,
    status: "stable",
    isPremium: true
  },
  {
    value: "gpt-5-codex",
    name: "GPT-5-Codex (Preview)",
    description: "GPT-5 optimized for coding with vision (400K context, 128K output) - PREMIUM",
    capabilities: {
      toolsCalling: true,
      vision: true,
      multimodal: true,
      maxContextTokens: 400000,
      maxOutputTokens: 128000,
      streaming: true,
      provider: "OpenAI",
      category: "powerful"
    },
    recommended: true,
    status: "preview",
    isPremium: true
  },
  {
    value: "gpt-5.1-codex",
    name: "GPT-5.1-Codex",
    description: "GPT-5.1 optimized for coding with vision (400K context, 128K output) - PREMIUM",
    capabilities: {
      toolsCalling: true,
      vision: true,
      multimodal: true,
      maxContextTokens: 400000,
      maxOutputTokens: 128000,
      streaming: true,
      provider: "OpenAI",
      category: "powerful"
    },
    recommended: true,
    status: "stable",
    isPremium: true
  },
  {
    value: "gpt-5.1-codex-mini",
    name: "GPT-5.1-Codex-Mini",
    description: "Smaller GPT-5.1-Codex with vision (400K context, 128K output) - PREMIUM (0.33x)",
    capabilities: {
      toolsCalling: true,
      vision: true,
      multimodal: true,
      maxContextTokens: 400000,
      maxOutputTokens: 128000,
      streaming: true,
      provider: "OpenAI",
      category: "powerful"
    },
    recommended: true,
    status: "preview",
    isPremium: true
  },
  {
    value: "gpt-5.1-codex-max",
    name: "GPT-5.1-Codex-Max",
    description: "Largest GPT-5.1-Codex with vision (400K context, 128K output) - PREMIUM",
    capabilities: {
      toolsCalling: true,
      vision: true,
      multimodal: true,
      maxContextTokens: 400000,
      maxOutputTokens: 128000,
      streaming: true,
      provider: "OpenAI",
      category: "powerful"
    },
    recommended: true,
    status: "stable",
    isPremium: true
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // OpenAI GPT-4 FAMILY - From API
  // ═══════════════════════════════════════════════════════════════════════════
  {
    value: "gpt-4.1",
    name: "GPT-4.1",
    description: "Enhanced GPT-4 with vision (128K context, 16K output) - Chat Fallback Model",
    capabilities: {
      toolsCalling: true,
      vision: true,
      multimodal: true,
      maxContextTokens: 128000,
      maxOutputTokens: 16384,
      streaming: true,
      provider: "OpenAI",
      category: "versatile"
    },
    recommended: true,
    status: "stable"
  },
  {
    value: "gpt-4o",
    name: "GPT-4o",
    description: "GPT-4 Omni with vision (128K context, 4K output)",
    capabilities: {
      toolsCalling: true,
      vision: true,
      multimodal: true,
      maxContextTokens: 128000,
      maxOutputTokens: 4096,
      streaming: true,
      provider: "OpenAI",
      category: "versatile"
    },
    recommended: true,
    status: "stable"
  },
  {
    value: "gpt-4o-mini",
    name: "GPT-4o Mini",
    description: "Faster GPT-4o - ⚠️ NO VISION SUPPORT (128K context, 4K output)",
    capabilities: {
      toolsCalling: true,
      vision: false, // CONFIRMED: NO vision support from API
      multimodal: false,
      maxContextTokens: 128000,
      maxOutputTokens: 4096,
      streaming: true,
      provider: "OpenAI",
      category: "lightweight"
    },
    recommended: true,
    status: "stable"
  },
  {
    value: "gpt-41-copilot",
    name: "GPT-4.1 Copilot",
    description: "GPT-4.1 fine-tuned for Copilot (completion type, not chat)",
    capabilities: {
      toolsCalling: false,
      vision: false,
      multimodal: false,
      maxContextTokens: 128000,
      maxOutputTokens: 16384,
      streaming: true,
      provider: "OpenAI",
      category: "versatile"
    },
    recommended: false,
    status: "stable"
  },
  {
    value: "o3-mini",
    name: "o3 Mini",
    description: "Reasoning model optimized for coding (200K context, 100K output) - PREMIUM",
    capabilities: {
      toolsCalling: true,
      vision: false,
      multimodal: false,
      maxContextTokens: 200000,
      maxOutputTokens: 100000,
      streaming: true,
      provider: "OpenAI",
      category: "reasoning"
    },
    recommended: true,
    status: "stable",
    isPremium: true
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MICROSOFT / Azure OpenAI - From API
  // ═══════════════════════════════════════════════════════════════════════════
  {
    value: "oswe-vscode-prime",
    name: "Raptor mini (Preview)",
    description: "Microsoft model optimized for VS Code with vision (264K context, 64K output)",
    capabilities: {
      toolsCalling: true,
      vision: true,
      multimodal: true,
      maxContextTokens: 264000,
      maxOutputTokens: 64000,
      streaming: true,
      provider: "Microsoft",
      category: "versatile"
    },
    recommended: true,
    status: "preview"
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // xAI GROK - From API (new!)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    value: "grok-code-fast-1",
    name: "Grok Code Fast 1",
    description: "xAI Grok model for fast coding (128K context, 64K output) - ⚠️ NO vision",
    capabilities: {
      toolsCalling: true,
      vision: false, // NO vision support from API
      multimodal: false,
      maxContextTokens: 128000,
      maxOutputTokens: 64000,
      streaming: true,
      provider: "xAI",
      category: "lightweight"
    },
    recommended: true,
    status: "stable"
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ANTHROPIC CLAUDE - From API
  // ═══════════════════════════════════════════════════════════════════════════
  {
    value: "claude-sonnet-4",
    name: "Claude Sonnet 4",
    description: "Claude Sonnet 4 with vision (216K context, 16K output) - PREMIUM",
    capabilities: {
      toolsCalling: true,
      vision: true,
      multimodal: true,
      maxContextTokens: 216000,
      maxOutputTokens: 16000,
      streaming: true,
      provider: "Anthropic",
      category: "versatile"
    },
    recommended: true,
    status: "stable",
    isPremium: true
  },
  {
    value: "claude-sonnet-4.5",
    name: "Claude Sonnet 4.5",
    description: "Claude Sonnet 4.5 with vision (144K context, 16K output) - PREMIUM",
    capabilities: {
      toolsCalling: true,
      vision: true,
      multimodal: true,
      maxContextTokens: 144000,
      maxOutputTokens: 16000,
      streaming: true,
      provider: "Anthropic",
      category: "versatile"
    },
    recommended: true,
    status: "stable",
    isPremium: true
  },
  {
    value: "claude-haiku-4.5",
    name: "Claude Haiku 4.5",
    description: "Fast Claude model with vision (144K context, 16K output) - PREMIUM (0.33x)",
    capabilities: {
      toolsCalling: true,
      vision: true,
      multimodal: true,
      maxContextTokens: 144000,
      maxOutputTokens: 16000,
      streaming: true,
      provider: "Anthropic",
      category: "versatile"
    },
    recommended: true,
    status: "stable",
    isPremium: true
  },
  {
    value: "claude-opus-4.5",
    name: "Claude Opus 4.5",
    description: "Most powerful Claude with vision (144K context, 16K output) - PREMIUM (3x)",
    capabilities: {
      toolsCalling: true,
      vision: true,
      multimodal: true,
      maxContextTokens: 144000,
      maxOutputTokens: 16000,
      streaming: true,
      provider: "Anthropic",
      category: "powerful"
    },
    recommended: true,
    status: "stable",
    isPremium: true
  },
  {
    value: "claude-opus-41",
    name: "Claude Opus 4.1",
    description: "Claude Opus 4.1 with vision (80K context, 16K output) - PREMIUM (10x) - Limited",
    capabilities: {
      toolsCalling: false, // NO tool_calls from API
      vision: true,
      multimodal: true,
      maxContextTokens: 80000,
      maxOutputTokens: 16000,
      streaming: true,
      provider: "Anthropic",
      category: "powerful"
    },
    recommended: false,
    status: "stable",
    isPremium: true
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GOOGLE GEMINI - From API
  // ═══════════════════════════════════════════════════════════════════════════
  {
    value: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    description: "Gemini 2.5 Pro with vision (128K context, 64K output) - PREMIUM",
    capabilities: {
      toolsCalling: true,
      vision: true,
      multimodal: true,
      maxContextTokens: 128000,
      maxOutputTokens: 64000,
      streaming: true,
      provider: "Google",
      category: "powerful"
    },
    recommended: true,
    status: "stable",
    isPremium: true
  },
  {
    value: "gemini-3-pro-preview",
    name: "Gemini 3 Pro (Preview)",
    description: "Gemini 3 Pro with vision (128K context, 64K output) - PREMIUM",
    capabilities: {
      toolsCalling: true,
      vision: true,
      multimodal: true,
      maxContextTokens: 128000,
      maxOutputTokens: 64000,
      streaming: true,
      provider: "Google",
      category: "powerful"
    },
    recommended: true,
    status: "preview",
    isPremium: true
  },
  {
    value: "gemini-3-flash-preview",
    name: "Gemini 3 Flash (Preview)",
    description: "Fast Gemini 3 with vision (128K context, 64K output) - PREMIUM (0.33x)",
    capabilities: {
      toolsCalling: true,
      vision: true,
      multimodal: true,
      maxContextTokens: 128000,
      maxOutputTokens: 64000,
      streaming: true,
      provider: "Google",
      category: "lightweight"
    },
    recommended: true,
    status: "preview",
    isPremium: true
  }
];

/**
 * Get models filtered by capability
 */
export class GitHubCopilotModelsManager {
  /**
     * Get all available models
     */
  static getAllModels(): GitHubCopilotModel[] {
    return GITHUB_COPILOT_MODELS;
  }

  /**
     * Get models that support tools calling
     */
  static getToolsCapableModels(): GitHubCopilotModel[] {
    return GITHUB_COPILOT_MODELS.filter(model => model.capabilities.toolsCalling);
  }

  /**
     * Get models that support vision
     */
  static getVisionCapableModels(): GitHubCopilotModel[] {
    return GITHUB_COPILOT_MODELS.filter(model => model.capabilities.vision);
  }

  /**
     * Get models by provider
     */
  static getModelsByProvider(provider: "OpenAI" | "Anthropic" | "Google" | "Microsoft" | "xAI"): GitHubCopilotModel[] {
    return GITHUB_COPILOT_MODELS.filter(model => model.capabilities.provider === provider);
  }

  /**
     * Get models by category
     */
  static getModelsByCategory(category: "chat" | "reasoning" | "coding" | "vision" | "multimodal" | "versatile" | "powerful" | "lightweight"): GitHubCopilotModel[] {
    return GITHUB_COPILOT_MODELS.filter(model => model.capabilities.category === category);
  }

  /**
     * Get recommended models only
     */
  static getRecommendedModels(): GitHubCopilotModel[] {
    return GITHUB_COPILOT_MODELS.filter(model => model.recommended);
  }

  /**
     * Get stable models only
     */
  static getStableModels(): GitHubCopilotModel[] {
    return GITHUB_COPILOT_MODELS.filter(model => model.status === "stable");
  }

  /**
     * Get free models only (non-premium)
     */
  static getFreeModels(): GitHubCopilotModel[] {
    return GITHUB_COPILOT_MODELS.filter(model => !model.isPremium);
  }

  /**
     * Get premium models only
     */
  static getPremiumModels(): GitHubCopilotModel[] {
    return GITHUB_COPILOT_MODELS.filter(model => model.isPremium);
  }

  /**
     * Get model by value
     */
  static getModelByValue(value: string): GitHubCopilotModel | undefined {
    return GITHUB_COPILOT_MODELS.find(model => model.value === value);
  }

  /**
     * Convert models to n8n options format
     */
  static toN8nOptions(models?: GitHubCopilotModel[]): Array<{name: string, value: string, description: string}> {
    const modelsToUse = models || GITHUB_COPILOT_MODELS;
    return modelsToUse.map(model => ({
      name: model.name,
      value: model.value,
      description: model.description
    }));
  }

  /**
     * Get models suitable for specific use cases
     */
  static getModelsForUseCase(useCase: "general" | "coding" | "vision" | "reasoning" | "tools"): GitHubCopilotModel[] {
    switch (useCase) {
    case "general":
      return this.getRecommendedModels();
    case "coding":
      return GITHUB_COPILOT_MODELS.filter(model => 
        model.capabilities.category === "coding" || 
        model.capabilities.category === "powerful" ||
        model.capabilities.toolsCalling
      );
    case "vision":
      return this.getVisionCapableModels();
    case "reasoning":
      return GITHUB_COPILOT_MODELS.filter(model => 
        model.capabilities.category === "reasoning" ||
        model.capabilities.category === "powerful"
      );
    case "tools":
      return this.getToolsCapableModels();
    default:
      return this.getAllModels();
    }
  }
}

/**
 * Default model for different scenarios
 * Updated based on API capabilities
 */
export const DEFAULT_MODELS = {
  GENERAL: "gpt-4.1",        // Free, with vision, good balance
  CODING: "gpt-5-codex",     // Premium, best for coding
  VISION: "gpt-4o",          // Free, with vision
  VISION_FALLBACK: "gpt-4.1", // Fallback for vision when primary doesn't support
  REASONING: "o3-mini",      // Best reasoning model
  TOOLS: "gpt-4.1",          // Free with tool calling
  MULTIMODAL: "gemini-2.5-pro", // Google's best multimodal
  FREE: "gpt-4.1",           // Best free model
  PREMIUM: "gpt-5.2"         // Best premium model
} as const;