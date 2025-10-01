/**
 * Centralized model definitions for GitHub Copilot integration
 * This file maintains consistency across all nodes and provides
 * a single source of truth for available models and their capabilities
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
    provider: "OpenAI" | "Anthropic" | "Google" | "Microsoft";
    /** Model category */
    category: "chat" | "reasoning" | "coding" | "vision" | "multimodal";
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
}

/**
 * Complete list of GitHub Copilot available models
 * Updated from REAL API response - September 2025
 */
export const GITHUB_COPILOT_MODELS: GitHubCopilotModel[] = [
  // Auto selection (important!)
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
      category: "chat"
    },
    recommended: true,
    status: "stable"
  },

  // OpenAI GPT Models - VERIFIED via API
  {
    value: "gpt-5",
    name: "GPT-5",
    description: "Latest generation GPT model with enhanced capabilities",
    capabilities: {
      toolsCalling: true,
      vision: true,
      multimodal: true,
      maxContextTokens: 128000,
      maxOutputTokens: 64000,
      streaming: true,
      provider: "OpenAI",
      category: "chat"
    },
    recommended: true,
    status: "stable"
  },
  {
    value: "gpt-5-mini",
    name: "GPT-5 Mini",
    description: "Faster and more efficient GPT-5 model",
    capabilities: {
      toolsCalling: true,
      vision: true,
      multimodal: true,
      maxContextTokens: 128000,
      maxOutputTokens: 64000,
      streaming: true,
      provider: "OpenAI",
      category: "chat"
    },
    recommended: true,
    status: "stable"
  },
  {
    value: "gpt-4.1",
    name: "GPT-4.1",
    description: "Enhanced GPT-4 model with improved capabilities",
    capabilities: {
      toolsCalling: true,
      vision: true,
      multimodal: true,
      maxContextTokens: 128000,
      maxOutputTokens: 16384,
      streaming: true,
      provider: "OpenAI",
      category: "chat"
    },
    recommended: true,
    status: "stable"
  },
  {
    value: "gpt-4o",
    name: "GPT-4o",
    description: "Most capable GPT-4 model with vision, optimized for chat and complex reasoning",
    capabilities: {
      toolsCalling: true,
      vision: true,
      multimodal: true,
      maxContextTokens: 128000,
      maxOutputTokens: 4096,
      streaming: true,
      provider: "OpenAI",
      category: "multimodal"
    },
    recommended: true,
    status: "stable"
  },
  {
    value: "gpt-4o-mini",
    name: "GPT-4o Mini",
    description: "Faster and more cost-effective GPT-4o - VERIFIED WORKING",
    capabilities: {
      toolsCalling: true,
      vision: false, // Based on API response
      multimodal: false,
      maxContextTokens: 128000,
      maxOutputTokens: 4096,
      streaming: true,
      provider: "OpenAI",
      category: "chat"
    },
    recommended: true,
    status: "stable"
  },
  {
    value: "o3-mini",
    name: "o3 Mini",
    description: "New reasoning model optimized for coding and complex tasks",
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
    status: "stable"
  },

  // Anthropic Claude Models - VERIFIED via API
  {
    value: "claude-sonnet-4",
    name: "Claude Sonnet 4",
    description: "Latest Claude model with advanced reasoning capabilities",
    capabilities: {
      toolsCalling: true,
      vision: true,
      multimodal: true,
      maxContextTokens: 128000,
      maxOutputTokens: 16000,
      streaming: true,
      provider: "Anthropic",
      category: "chat"
    },
    recommended: true,
    status: "stable"
  },
  {
    value: "claude-opus-4",
    name: "Claude Opus 4",
    description: "Most powerful Claude model for complex reasoning (may have performance issues)",
    capabilities: {
      toolsCalling: false, // Based on API response
      vision: true,
      multimodal: true,
      maxContextTokens: 80000,
      maxOutputTokens: 16000,
      streaming: true,
      provider: "Anthropic",
      category: "reasoning"
    },
    recommended: false,
    status: "stable"
  },
  {
    value: "claude-3.7-sonnet",
    name: "Claude 3.7 Sonnet",
    description: "Enhanced Claude 3.5 with improved capabilities",
    capabilities: {
      toolsCalling: true,
      vision: true,
      multimodal: true,
      maxContextTokens: 200000,
      maxOutputTokens: 16384,
      streaming: true,
      provider: "Anthropic",
      category: "chat"
    },
    recommended: true,
    status: "stable"
  },
  {
    value: "claude-3.7-sonnet-thought",
    name: "Claude 3.7 Sonnet Thinking",
    description: "Claude with visible reasoning process",
    capabilities: {
      toolsCalling: false, // Based on API response
      vision: true,
      multimodal: true,
      maxContextTokens: 200000,
      maxOutputTokens: 16384,
      streaming: true,
      provider: "Anthropic",
      category: "reasoning"
    },
    recommended: false,
    status: "stable"
  },
  {
    value: "claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    description: "Anthropic's balanced model with excellent reasoning and creativity",
    capabilities: {
      toolsCalling: true,
      vision: true,
      multimodal: true,
      maxContextTokens: 90000,
      maxOutputTokens: 8192,
      streaming: true,
      provider: "Anthropic",
      category: "chat"
    },
    recommended: true,
    status: "stable"
  },

  // Google Gemini Models - VERIFIED via API
  {
    value: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    description: "Most advanced Gemini model with reasoning capabilities",
    capabilities: {
      toolsCalling: true,
      vision: true,
      multimodal: true,
      maxContextTokens: 128000,
      maxOutputTokens: 64000,
      streaming: true,
      provider: "Google",
      category: "reasoning"
    },
    recommended: true,
    status: "stable"
  },
  {
    value: "gemini-2.0-flash-001",
    name: "Gemini 2.0 Flash",
    description: "Fast and efficient Gemini model with large context window",
    capabilities: {
      toolsCalling: true,
      vision: true,
      multimodal: true,
      maxContextTokens: 1000000,
      maxOutputTokens: 8192,
      streaming: true,
      provider: "Google",
      category: "chat"
    },
    recommended: true,
    status: "stable"
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
  static getModelsByProvider(provider: "OpenAI" | "Anthropic" | "Google" | "Microsoft"): GitHubCopilotModel[] {
    return GITHUB_COPILOT_MODELS.filter(model => model.capabilities.provider === provider);
  }

  /**
     * Get models by category
     */
  static getModelsByCategory(category: "chat" | "reasoning" | "coding" | "vision" | "multimodal"): GitHubCopilotModel[] {
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
                    model.capabilities.toolsCalling
      );
    case "vision":
      return this.getVisionCapableModels();
    case "reasoning":
      return GITHUB_COPILOT_MODELS.filter(model => 
        model.capabilities.category === "reasoning"
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
 */
export const DEFAULT_MODELS = {
  GENERAL: "gpt-4o-mini",  // VERIFIED working in tests
  CODING: "o3-mini",
  VISION: "gpt-4o",
  REASONING: "claude-sonnet-4",
  TOOLS: "gpt-5",
  MULTIMODAL: "gemini-2.5-pro"
} as const;