"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_MODELS = exports.GitHubCopilotModelsManager = exports.GITHUB_COPILOT_MODELS = void 0;
exports.GITHUB_COPILOT_MODELS = [
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
            vision: false,
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
    {
        value: "grok-code-fast-1",
        name: "Grok Code Fast 1",
        description: "xAI Grok model for fast coding (128K context, 64K output) - ⚠️ NO vision",
        capabilities: {
            toolsCalling: true,
            vision: false,
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
            toolsCalling: false,
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
class GitHubCopilotModelsManager {
    static getAllModels() {
        return exports.GITHUB_COPILOT_MODELS;
    }
    static getToolsCapableModels() {
        return exports.GITHUB_COPILOT_MODELS.filter(model => model.capabilities.toolsCalling);
    }
    static getVisionCapableModels() {
        return exports.GITHUB_COPILOT_MODELS.filter(model => model.capabilities.vision);
    }
    static getModelsByProvider(provider) {
        return exports.GITHUB_COPILOT_MODELS.filter(model => model.capabilities.provider === provider);
    }
    static getModelsByCategory(category) {
        return exports.GITHUB_COPILOT_MODELS.filter(model => model.capabilities.category === category);
    }
    static getRecommendedModels() {
        return exports.GITHUB_COPILOT_MODELS.filter(model => model.recommended);
    }
    static getStableModels() {
        return exports.GITHUB_COPILOT_MODELS.filter(model => model.status === "stable");
    }
    static getFreeModels() {
        return exports.GITHUB_COPILOT_MODELS.filter(model => !model.isPremium);
    }
    static getPremiumModels() {
        return exports.GITHUB_COPILOT_MODELS.filter(model => model.isPremium);
    }
    static getModelByValue(value) {
        return exports.GITHUB_COPILOT_MODELS.find(model => model.value === value);
    }
    static toN8nOptions(models) {
        const modelsToUse = models || exports.GITHUB_COPILOT_MODELS;
        return modelsToUse.map(model => ({
            name: model.name,
            value: model.value,
            description: model.description
        }));
    }
    static getModelsForUseCase(useCase) {
        switch (useCase) {
            case "general":
                return this.getRecommendedModels();
            case "coding":
                return exports.GITHUB_COPILOT_MODELS.filter(model => model.capabilities.category === "coding" ||
                    model.capabilities.category === "powerful" ||
                    model.capabilities.toolsCalling);
            case "vision":
                return this.getVisionCapableModels();
            case "reasoning":
                return exports.GITHUB_COPILOT_MODELS.filter(model => model.capabilities.category === "reasoning" ||
                    model.capabilities.category === "powerful");
            case "tools":
                return this.getToolsCapableModels();
            default:
                return this.getAllModels();
        }
    }
}
exports.GitHubCopilotModelsManager = GitHubCopilotModelsManager;
exports.DEFAULT_MODELS = {
    GENERAL: "gpt-4.1",
    CODING: "gpt-5-codex",
    VISION: "gpt-4o",
    VISION_FALLBACK: "gpt-4.1",
    REASONING: "o3-mini",
    TOOLS: "gpt-4.1",
    MULTIMODAL: "gemini-2.5-pro",
    FREE: "gpt-4.1",
    PREMIUM: "gpt-5.2"
};
