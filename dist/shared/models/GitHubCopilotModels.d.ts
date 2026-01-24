export interface ModelCapability {
    toolsCalling: boolean;
    vision: boolean;
    multimodal: boolean;
    maxContextTokens: number;
    maxOutputTokens: number;
    streaming: boolean;
    provider: "OpenAI" | "Anthropic" | "Google" | "Microsoft" | "xAI";
    category: "chat" | "reasoning" | "coding" | "vision" | "multimodal" | "versatile" | "powerful" | "lightweight";
}
export interface GitHubCopilotModel {
    value: string;
    name: string;
    description: string;
    capabilities: ModelCapability;
    recommended: boolean;
    status: "stable" | "preview" | "experimental";
    isPremium?: boolean;
}
export declare const GITHUB_COPILOT_MODELS: GitHubCopilotModel[];
export declare class GitHubCopilotModelsManager {
    static getAllModels(): GitHubCopilotModel[];
    static getToolsCapableModels(): GitHubCopilotModel[];
    static getVisionCapableModels(): GitHubCopilotModel[];
    static getModelsByProvider(provider: "OpenAI" | "Anthropic" | "Google" | "Microsoft" | "xAI"): GitHubCopilotModel[];
    static getModelsByCategory(category: "chat" | "reasoning" | "coding" | "vision" | "multimodal" | "versatile" | "powerful" | "lightweight"): GitHubCopilotModel[];
    static getRecommendedModels(): GitHubCopilotModel[];
    static getStableModels(): GitHubCopilotModel[];
    static getFreeModels(): GitHubCopilotModel[];
    static getPremiumModels(): GitHubCopilotModel[];
    static getModelByValue(value: string): GitHubCopilotModel | undefined;
    static toN8nOptions(models?: GitHubCopilotModel[]): Array<{
        name: string;
        value: string;
        description: string;
    }>;
    static getModelsForUseCase(useCase: "general" | "coding" | "vision" | "reasoning" | "tools"): GitHubCopilotModel[];
}
export declare const DEFAULT_MODELS: {
    readonly GENERAL: "gpt-4.1";
    readonly CODING: "gpt-5-codex";
    readonly VISION: "gpt-4o";
    readonly VISION_FALLBACK: "gpt-4.1";
    readonly REASONING: "o3-mini";
    readonly TOOLS: "gpt-4.1";
    readonly MULTIMODAL: "gemini-2.5-pro";
    readonly FREE: "gpt-4.1";
    readonly PREMIUM: "gpt-5.2";
};
