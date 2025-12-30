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
            category: "chat"
        },
        recommended: true,
        status: "stable"
    },
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
            vision: true,
            multimodal: true,
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
    {
        value: "oswe-vscode-prime",
        name: "Raptor mini (Preview)",
        description: "Fast and versatile model optimized for VS Code by Microsoft (Azure OpenAI)",
        capabilities: {
            toolsCalling: true,
            vision: true,
            multimodal: true,
            maxContextTokens: 264000,
            maxOutputTokens: 64000,
            streaming: true,
            provider: "Microsoft",
            category: "chat"
        },
        recommended: true,
        status: "preview"
    },
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
            toolsCalling: false,
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
            toolsCalling: false,
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
                    model.capabilities.toolsCalling);
            case "vision":
                return this.getVisionCapableModels();
            case "reasoning":
                return exports.GITHUB_COPILOT_MODELS.filter(model => model.capabilities.category === "reasoning");
            case "tools":
                return this.getToolsCapableModels();
            default:
                return this.getAllModels();
        }
    }
}
exports.GitHubCopilotModelsManager = GitHubCopilotModelsManager;
exports.DEFAULT_MODELS = {
    GENERAL: "gpt-4o-mini",
    CODING: "o3-mini",
    VISION: "gpt-4o",
    REASONING: "claude-sonnet-4",
    TOOLS: "gpt-5",
    MULTIMODAL: "gemini-2.5-pro"
};
