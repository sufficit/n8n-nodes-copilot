"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadAvailableModels = loadAvailableModels;
exports.loadAvailableEmbeddingModels = loadAvailableEmbeddingModels;
const DynamicModelsManager_1 = require("../utils/DynamicModelsManager");
const OAuthTokenManager_1 = require("../utils/OAuthTokenManager");
async function loadAvailableModels(forceRefresh = false) {
    return loadModelsWithFilter.call(this, "chat", forceRefresh);
}
async function loadAvailableEmbeddingModels(forceRefresh = false) {
    return loadModelsWithFilter.call(this, "embeddings", forceRefresh);
}
async function loadModelsWithFilter(modelType, forceRefresh = false) {
    try {
        const credentials = await this.getCredentials("githubCopilotApi");
        if (!credentials || !credentials.token) {
            console.warn("⚠️ No credentials found for dynamic model loading");
            return [
                {
                    name: "✏️ Enter Custom Model Name",
                    value: "__manual__",
                    description: "Type your own model name (no credentials found)",
                },
            ];
        }
        const githubToken = credentials.token;
        let oauthToken;
        try {
            oauthToken = await OAuthTokenManager_1.OAuthTokenManager.getValidOAuthToken(githubToken);
        }
        catch (error) {
            console.error("❌ Failed to generate OAuth token for model loading:", error);
            return [
                {
                    name: "✏️ Enter Custom Model Name",
                    value: "__manual__",
                    description: "Type your own model name (OAuth generation failed)",
                },
            ];
        }
        if (forceRefresh) {
            DynamicModelsManager_1.DynamicModelsManager.clearCache(oauthToken);
            console.log("🔄 Force refreshing models list...");
        }
        const allModels = await DynamicModelsManager_1.DynamicModelsManager.getAvailableModels(oauthToken);
        const models = DynamicModelsManager_1.DynamicModelsManager.filterModelsByType(allModels, modelType);
        console.log(`🔍 Filtered ${models.length} ${modelType} models from ${allModels.length} total models`);
        const options = DynamicModelsManager_1.DynamicModelsManager.modelsToN8nOptions(models);
        const optionsWithManualInput = [
            {
                name: "✏️ Enter Custom Model Name",
                value: "__manual__",
                description: "Type your own model name (for new/beta models)",
            },
            ...options,
        ];
        console.log(`✅ Loaded ${options.length} ${modelType} models dynamically (+ manual input option)`);
        return optionsWithManualInput;
    }
    catch (error) {
        console.error("❌ Error loading dynamic models:", error);
        return [
            {
                name: "✏️ Enter Custom Model Name",
                value: "__manual__",
                description: "Type your own model name (discovery failed, using previous cache if available)",
            },
        ];
    }
}
