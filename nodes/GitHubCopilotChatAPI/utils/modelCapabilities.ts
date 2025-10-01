import { ModelCapabilities, ModelValidationResult } from "./types";

/**
 * Model capabilities mapping for GitHub Copilot API models
 * Based on official GitHub Copilot documentation and testing
 * Note: GitHub Copilot API currently only supports text and image_url types
 */
export const MODEL_CAPABILITIES: Record<string, ModelCapabilities> = {
  // GPT Models - Image support confirmed
  "gpt-5": {
    supportsImages: true,
    supportsAudio: false,
    maxContextTokens: 200000,
    description: "OpenAI GPT-5 with image support via GitHub Copilot API",
  },
  "gpt-5-mini": {
    supportsImages: true,
    supportsAudio: false,
    maxContextTokens: 128000,
    description: "OpenAI GPT-5 Mini with image support via GitHub Copilot API",
  },
  "gpt-4.1-copilot": {
    supportsImages: true,
    supportsAudio: false,
    maxContextTokens: 128000,
    description: "OpenAI GPT-4.1 with image support via GitHub Copilot API",
  },

  // Claude Models - Text only via GitHub Copilot API
  "claude-opus-4.1": {
    supportsImages: false,
    supportsAudio: false,
    maxContextTokens: 200000,
    description: "Anthropic Claude Opus 4.1 - Text only via GitHub Copilot API",
  },
  "claude-3.5-sonnet": {
    supportsImages: false,
    supportsAudio: false,
    maxContextTokens: 200000,
    description: "Anthropic Claude 3.5 Sonnet - Text only via GitHub Copilot API",
  },

  // Gemini Models - Image support tested
  "gemini-2.5-pro": {
    supportsImages: true,
    supportsAudio: false,
    maxContextTokens: 1000000,
    description: "Google Gemini 2.5 Pro with image support via GitHub Copilot API",
  },
  "gemini-2.0-flash": {
    supportsImages: true, // To be tested
    supportsAudio: true, // Can process audio as text+base64
    maxContextTokens: 1000000,
    description: "Google Gemini 2.0 Flash with multimodal support via GitHub Copilot API",
  },

  // Grok Models - Text only
  "grok-code-fast-1": {
    supportsImages: false,
    supportsAudio: false,
    maxContextTokens: 128000,
    description: "xAI Grok Code Fast 1 - Text only via GitHub Copilot API",
  },

  // o-models - Reasoning focused, text only
  o3: {
    supportsImages: false,
    supportsAudio: false,
    maxContextTokens: 200000,
    description: "OpenAI o3 - Text only via GitHub Copilot API",
  },
  "o3-mini": {
    supportsImages: false,
    supportsAudio: false,
    maxContextTokens: 128000,
    description: "OpenAI o3-mini - Text only via GitHub Copilot API",
  },
};

/**
 * Validate if a model supports the requested media types
 */
export function validateModelCapabilities(
  model: string,
  includeImage: boolean,
  includeAudio: boolean,
): ModelValidationResult {
  const capabilities = MODEL_CAPABILITIES[model];

  if (!capabilities) {
    return {
      isValid: false,
      errorMessage: `Unknown model: ${model}. Please check if the model name is correct.`,
    };
  }

  const warnings: string[] = [];
  let isValid = true;
  let errorMessage: string | undefined;

  // Check image support
  if (includeImage && !capabilities.supportsImages) {
    isValid = false;
    errorMessage = `Model ${model} does not support image input. Please disable image upload or choose a different model (e.g., GPT-5, Gemini 2.5 Pro).`;
  }

  // Check audio support
  if (includeAudio && !capabilities.supportsAudio) {
    isValid = false;
    errorMessage = `Model ${model} does not support audio input. Please disable audio upload or choose a different model (e.g., GPT-5, Gemini 2.5 Pro).`;
  }

  // Add warnings for models with known limitations
  if (model.includes("claude") && (includeImage || includeAudio)) {
    warnings.push("Claude models typically work best with text-only input via GitHub Copilot API.");
  }

  if (model.includes("grok") && (includeImage || includeAudio)) {
    warnings.push("Grok models are optimized for coding tasks and work best with text input.");
  }

  return {
    isValid,
    errorMessage,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Get supported models for specific media types
 */
export function getSupportedModels(requireImages = false, requireAudio = false): string[] {
  return Object.entries(MODEL_CAPABILITIES)
    .filter(([, capabilities]) => {
      if (requireImages && !capabilities.supportsImages) return false;
      if (requireAudio && !capabilities.supportsAudio) return false;
      return true;
    })
    .map(([model]) => model);
}

/**
 * Get model capabilities for display in UI
 */
export function getModelInfo(model: string): ModelCapabilities | null {
  return MODEL_CAPABILITIES[model] || null;
}
