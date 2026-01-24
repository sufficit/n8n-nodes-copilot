"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamicModelsManager = void 0;
const GitHubCopilotEndpoints_1 = require("./GitHubCopilotEndpoints");
class DynamicModelsManager {
    static hashToken(token) {
        let hash = 0;
        for (let i = 0; i < token.length; i++) {
            const char = token.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash;
        }
        return `models_${Math.abs(hash).toString(36)}`;
    }
    static async fetchModelsFromAPI(oauthToken) {
        const url = `${GitHubCopilotEndpoints_1.GITHUB_COPILOT_API.BASE_URL}${GitHubCopilotEndpoints_1.GITHUB_COPILOT_API.ENDPOINTS.MODELS}`;
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
        const data = (await response.json());
        console.log(`✅ Fetched ${data.data.length} models from API`);
        return data.data;
    }
    static async getAvailableModels(oauthToken) {
        const tokenHash = this.hashToken(oauthToken);
        const now = Date.now();
        const cached = this.cache.get(tokenHash);
        if (cached && cached.expiresAt > now) {
            const remainingMinutes = Math.round((cached.expiresAt - now) / 60000);
            console.log(`✅ Using cached models (expires in ${remainingMinutes} minutes)`);
            return cached.models;
        }
        if (cached && now - cached.fetchedAt < this.MIN_REFRESH_INTERVAL_MS) {
            const waitSeconds = Math.round((this.MIN_REFRESH_INTERVAL_MS - (now - cached.fetchedAt)) / 1000);
            console.log(`⏰ Models fetched recently, using cache (min refresh interval: ${waitSeconds}s)`);
            return cached.models;
        }
        try {
            const models = await this.fetchModelsFromAPI(oauthToken);
            this.cache.set(tokenHash, {
                models,
                fetchedAt: now,
                expiresAt: now + this.CACHE_DURATION_MS,
                tokenHash,
            });
            return models;
        }
        catch (error) {
            console.error("❌ Failed to fetch models from API:", error);
            if (cached) {
                console.log("⚠️ Using expired cache as fallback");
                return cached.models;
            }
            throw error;
        }
    }
    static filterModelsByType(models, type) {
        return models.filter((model) => {
            var _a;
            const modelType = (_a = model.capabilities) === null || _a === void 0 ? void 0 : _a.type;
            return modelType === type;
        });
    }
    static getCostMultiplier(model) {
        var _a;
        if (((_a = model.billing) === null || _a === void 0 ? void 0 : _a.multiplier) !== undefined) {
            return `${model.billing.multiplier}x`;
        }
        const id = model.id.toLowerCase();
        if (id === 'gpt-4.1' || id.startsWith('gpt-4.1-'))
            return '0x';
        if (id === 'gpt-4o' || id.startsWith('gpt-4o-'))
            return '0x';
        if (id === 'gpt-4' || id === 'gpt-4-0613')
            return '0x';
        if (id === 'gpt-5-mini')
            return '0x';
        if (id === 'gpt-4o-mini' || id.startsWith('gpt-4o-mini-'))
            return '0x';
        if (id.includes('grok') && id.includes('fast'))
            return '0x';
        if (id === 'oswe-vscode-prime' || id.includes('oswe-vscode'))
            return '0x';
        if (id.includes('haiku'))
            return '0.33x';
        if (id.includes('flash'))
            return '0.33x';
        if (id.includes('codex-mini'))
            return '0.33x';
        if (id === 'claude-opus-41' || id === 'claude-opus-4.1')
            return '10x';
        if (id.includes('opus'))
            return '3x';
        return '1x';
    }
    static modelsToN8nOptions(models) {
        const nameCount = new Map();
        models.forEach((model) => {
            const displayName = model.display_name || model.name || model.id;
            nameCount.set(displayName, (nameCount.get(displayName) || 0) + 1);
        });
        return models.map((model) => {
            const badges = [];
            if (model.capabilities) {
                const supports = model.capabilities.supports || {};
                if (supports.streaming)
                    badges.push("🔄 Streaming");
                if (supports.tool_calls)
                    badges.push("🔧 Tools");
                if (supports.vision)
                    badges.push("👁️ Vision");
                if (supports.structured_outputs)
                    badges.push("📋 Structured");
                if (supports.parallel_tool_calls)
                    badges.push("⚡ Parallel");
                if (supports.max_thinking_budget)
                    badges.push("🧠 Reasoning");
            }
            const displayName = model.display_name || model.name || model.id;
            const costMultiplier = this.getCostMultiplier(model);
            const badgesText = badges.length > 0 ? ` [${badges.join(" • ")}]` : "";
            const hasDuplicates = (nameCount.get(displayName) || 0) > 1;
            const category = model.model_picker_category || "";
            const categoryLabel = category ? ` - ${category.charAt(0).toUpperCase() + category.slice(1)}` : "";
            const multiplierDisplay = ` • ${costMultiplier}${categoryLabel}`;
            let description = "";
            if (model.capabilities) {
                const limits = model.capabilities.limits || {};
                const parts = [];
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
            }
            else {
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
    static clearCache(oauthToken) {
        const tokenHash = this.hashToken(oauthToken);
        this.cache.delete(tokenHash);
        console.log("🗑️ Cleared models cache");
    }
    static clearAllCache() {
        this.cache.clear();
        console.log("🗑️ Cleared all models cache");
    }
    static getModelFromCache(oauthToken, modelId) {
        const tokenHash = this.hashToken(oauthToken);
        const cached = this.cache.get(tokenHash);
        if (!cached) {
            return null;
        }
        return cached.models.find(m => m.id === modelId) || null;
    }
    static modelSupportsVision(oauthToken, modelId) {
        var _a, _b;
        const model = this.getModelFromCache(oauthToken, modelId);
        if (!model) {
            return null;
        }
        const supports = ((_a = model.capabilities) === null || _a === void 0 ? void 0 : _a.supports) || {};
        if (supports.vision === true) {
            return true;
        }
        const limits = ((_b = model.capabilities) === null || _b === void 0 ? void 0 : _b.limits) || {};
        if (limits.vision) {
            return true;
        }
        return false;
    }
    static modelSupportsTools(oauthToken, modelId) {
        var _a;
        const model = this.getModelFromCache(oauthToken, modelId);
        if (!model) {
            return null;
        }
        const supports = ((_a = model.capabilities) === null || _a === void 0 ? void 0 : _a.supports) || {};
        return supports.tool_calls === true;
    }
    static getModelCapabilities(oauthToken, modelId) {
        var _a, _b, _c;
        const model = this.getModelFromCache(oauthToken, modelId);
        if (!model) {
            return null;
        }
        const supports = ((_a = model.capabilities) === null || _a === void 0 ? void 0 : _a.supports) || {};
        const limits = ((_b = model.capabilities) === null || _b === void 0 ? void 0 : _b.limits) || {};
        return {
            vision: supports.vision === true || !!limits.vision,
            tools: supports.tool_calls === true,
            streaming: supports.streaming === true,
            maxContextTokens: limits.max_context_window_tokens || 128000,
            maxOutputTokens: limits.max_output_tokens || 4096,
            isPremium: ((_c = model.billing) === null || _c === void 0 ? void 0 : _c.is_premium) === true,
        };
    }
    static getCacheInfo(oauthToken) {
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
exports.DynamicModelsManager = DynamicModelsManager;
DynamicModelsManager.cache = new Map();
DynamicModelsManager.CACHE_DURATION_MS = 60 * 60 * 1000;
DynamicModelsManager.MIN_REFRESH_INTERVAL_MS = 5 * 60 * 1000;
