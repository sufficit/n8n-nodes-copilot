/**
 * Model Version Requirements Configuration
 * 
 * Maps GitHub Copilot models to their specific version requirements,
 * supported endpoints, and any additional headers needed.
 * 
 * This is extracted from models.json and API error responses.
 */

export interface ModelRequirements {
  /** Minimum VS Code version required (e.g., "1.104.1") */
  minVSCodeVersion: string;
  
  /** Supported API endpoints for this model */
  supportedEndpoints: string[];
  
  /** Whether model is in preview mode */
  preview?: boolean;
  
  /** Additional headers required for this model */
  additionalHeaders?: Record<string, string>;
  
  /** Special notes or warnings */
  notes?: string;
}

/**
 * Model-specific requirements configuration
 * 
 * Models not listed here use default configuration:
 * - minVSCodeVersion: "1.95.0"
 * - supportedEndpoints: ["/chat/completions", "/responses"]
 */
export const MODEL_VERSION_REQUIREMENTS: Record<string, ModelRequirements> = {
  // GPT-5-Codex: Requires newer VS Code version and /responses endpoint only
  "gpt-5-codex": {
    minVSCodeVersion: "1.104.1",
    supportedEndpoints: ["/responses"],
    preview: true,
    notes: "Preview model requiring VS Code 1.104.1 or newer. Only supports /responses endpoint."
  },
  
  // GPT-5: Supports both endpoints
  "gpt-5": {
    minVSCodeVersion: "1.95.0",
    supportedEndpoints: ["/chat/completions", "/responses"],
    preview: false,
  },
  
  // GPT-5 Mini: Supports both endpoints
  "gpt-5-mini": {
    minVSCodeVersion: "1.95.0",
    supportedEndpoints: ["/chat/completions", "/responses"],
    preview: false,
  },
  
  // o3: Preview model but works with standard version
  "o3": {
    minVSCodeVersion: "1.95.0",
    supportedEndpoints: ["/chat/completions", "/responses"],
    preview: true,
  },
  
  // o3-2025-04-16: Specific version
  "o3-2025-04-16": {
    minVSCodeVersion: "1.95.0",
    supportedEndpoints: ["/chat/completions", "/responses"],
    preview: true,
  },
  
  // o4-mini: Preview model
  "o4-mini": {
    minVSCodeVersion: "1.95.0",
    supportedEndpoints: ["/chat/completions", "/responses"],
    preview: true,
  },
  
  // o4-mini-2025-04-16: Specific version
  "o4-mini-2025-04-16": {
    minVSCodeVersion: "1.95.0",
    supportedEndpoints: ["/chat/completions", "/responses"],
    preview: true,
  },

  // Raptor Mini (oswe-vscode-prime)
  "oswe-vscode-prime": {
    minVSCodeVersion: "1.96.0",
    supportedEndpoints: ["/chat/completions", "/responses"],
    preview: true,
  },
  
  // Add more models with special requirements here as needed
};

/**
 * Default requirements for models not explicitly configured
 */
export const DEFAULT_MODEL_REQUIREMENTS: ModelRequirements = {
  minVSCodeVersion: "1.95.0",
  supportedEndpoints: ["/chat/completions", "/responses"],
  preview: false,
};

/**
 * Get requirements for a specific model
 * Returns model-specific requirements or defaults if not configured
 */
export function getModelRequirements(model: string): ModelRequirements {
  return MODEL_VERSION_REQUIREMENTS[model] || DEFAULT_MODEL_REQUIREMENTS;
}

/**
 * Check if model supports a specific endpoint
 */
export function modelSupportsEndpoint(model: string, endpoint: string): boolean {
  const requirements = getModelRequirements(model);
  return requirements.supportedEndpoints.includes(endpoint);
}

/**
 * Get recommended endpoint for a model
 * Returns the first supported endpoint (usually preferred one)
 */
export function getRecommendedEndpoint(model: string): string {
  const requirements = getModelRequirements(model);
  return requirements.supportedEndpoints[0] || "/chat/completions";
}

/**
 * Validate model and endpoint combination
 * Throws error if combination is not supported
 */
export function validateModelEndpoint(model: string, endpoint: string): void {
  if (!modelSupportsEndpoint(model, endpoint)) {
    const requirements = getModelRequirements(model);
    throw new Error(
      `Model "${model}" does not support endpoint "${endpoint}". ` +
      `Supported endpoints: ${requirements.supportedEndpoints.join(", ")}`
    );
  }
}

/**
 * Get minimum VS Code version for a model
 */
export function getMinVSCodeVersion(model: string): string {
  const requirements = getModelRequirements(model);
  return requirements.minVSCodeVersion;
}

/**
 * Check if model is in preview mode
 */
export function isPreviewModel(model: string): boolean {
  const requirements = getModelRequirements(model);
  return requirements.preview || false;
}

/**
 * Get all additional headers required for a model
 */
export function getAdditionalHeaders(model: string): Record<string, string> {
  const requirements = getModelRequirements(model);
  return requirements.additionalHeaders || {};
}
