/**
 * Dynamic Model Loader for n8n Nodes
 * 
 * Provides dynamic model loading functionality for n8n nodes.
 * Models are loaded based on the authenticated user's available models.
 */

import { ILoadOptionsFunctions, INodePropertyOptions } from "n8n-workflow";
import { DynamicModelsManager } from "../utils/DynamicModelsManager";
import { OAuthTokenManager } from "../utils/OAuthTokenManager";

/**
 * Load available models dynamically based on user authentication
 * Use this in node properties with `loadOptions` method
 * 
 * @param forceRefresh - If true, bypasses cache and fetches fresh data from API
 */
export async function loadAvailableModels(
  this: ILoadOptionsFunctions,
  forceRefresh = false
): Promise<INodePropertyOptions[]> {
  return loadModelsWithFilter.call(this, "chat", forceRefresh);
}

/**
 * Load available chat models that support vision (for vision fallback selection)
 */
export async function loadAvailableVisionModels(
  this: ILoadOptionsFunctions,
  forceRefresh = false,
): Promise<INodePropertyOptions[]> {
  // Load all chat models and filter to those with vision support
  const allOptions = await loadModelsWithFilter.call(this, "chat", forceRefresh);
  const visionOptions = allOptions.filter((opt) => opt.name.includes("👁️") || opt.description?.includes("Vision"));
  // Ensure manual input option at top exists
  const manualOption = {
    name: "✏️ Enter Custom Model Name",
    value: "__manual__",
    description: "Type your own model name (for new/beta models)",
  };
  // If manual is already present, keep as-is, else prepend
  const hasManual = visionOptions.some((o) => o.value === "__manual__");
  return hasManual ? visionOptions : [manualOption, ...visionOptions];
}

/**
 * Load available embedding models dynamically
 * Use this in embedding nodes with `loadOptions` method
 * 
 * @param forceRefresh - If true, bypasses cache and fetches fresh data from API
 */
export async function loadAvailableEmbeddingModels(
  this: ILoadOptionsFunctions,
  forceRefresh = false
): Promise<INodePropertyOptions[]> {
  return loadModelsWithFilter.call(this, "embeddings", forceRefresh);
}

/**
 * Internal function to load models with type filter
 */
async function loadModelsWithFilter(
  this: ILoadOptionsFunctions,
  modelType: "chat" | "embeddings",
  forceRefresh = false
): Promise<INodePropertyOptions[]> {
  try {
    // Get credentials
    const credentials = await this.getCredentials("githubCopilotApi");
    
    if (!credentials || !credentials.token) {
      console.warn("⚠️ No credentials found for dynamic model loading");
      // Return only manual input option (no fallback)
      return [
        {
          name: "✏️ Enter Custom Model Name",
          value: "__manual__",
          description: "Type your own model name (no credentials found)",
        },
      ];
    }

    // Get GitHub token
    const githubToken = credentials.token as string;

    // Generate OAuth token
    let oauthToken: string;
    try {
      oauthToken = await OAuthTokenManager.getValidOAuthToken(githubToken);
    } catch (error) {
      console.error("❌ Failed to generate OAuth token for model loading:", error);
      // Return only manual input option (no fallback)
      return [
        {
          name: "✏️ Enter Custom Model Name",
          value: "__manual__",
          description: "Type your own model name (OAuth generation failed)",
        },
      ];
    }

    // Clear cache if force refresh requested
    if (forceRefresh) {
      DynamicModelsManager.clearCache(oauthToken);
      console.log("🔄 Force refreshing models list...");
    }

    // Fetch available models
    const allModels = await DynamicModelsManager.getAvailableModels(oauthToken);
    
    // Filter by type
    const models = DynamicModelsManager.filterModelsByType(allModels, modelType);
    
    console.log(`🔍 Filtered ${models.length} ${modelType} models from ${allModels.length} total models`);

    // Convert to n8n options format
    const options = DynamicModelsManager.modelsToN8nOptions(models);

    // Add manual input option at the top (for both chat and embeddings)
    const optionsWithManualInput: INodePropertyOptions[] = [
      {
        name: "✏️ Enter Custom Model Name",
        value: "__manual__",
        description: "Type your own model name (for new/beta models)",
      },
      ...options,
    ];

    console.log(`✅ Loaded ${options.length} ${modelType} models dynamically (+ manual input option)`);
    return optionsWithManualInput;
  } catch (error) {
    console.error("❌ Error loading dynamic models:", error);
    // Return empty list with manual input option (no fallback)
    // User must enter model name manually or wait for next successful discovery
    return [
      {
        name: "✏️ Enter Custom Model Name",
        value: "__manual__",
        description: "Type your own model name (discovery failed, using previous cache if available)",
      },
    ];
  }
}


