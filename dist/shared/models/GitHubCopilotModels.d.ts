export interface ModelCapability {
    toolsCalling: boolean;
    vision: boolean;
    multimodal: boolean;
    maxContextTokens: number;
    maxOutputTokens: number;
    streaming: boolean;
    provider: "OpenAI" | "Anthropic" | "Google" | "Microsoft";
    category: "chat" | "reasoning" | "coding" | "vision" | "multimodal";
}
export interface GitHubCopilotModel {
    value: string;
    name: string;
    description: string;
    capabilities: ModelCapability;
    recommended: boolean;
    status: "stable" | "preview" | "experimental";
}
export declare const GITHUB_COPILOT_MODELS: GitHubCopilotModel[];
export declare class GitHubCopilotModelsManager {
    static getAllModels(): GitHubCopilotModel[];
    static getToolsCapableModels(): GitHubCopilotModel[];
    static getVisionCapableModels(): GitHubCopilotModel[];
    static getModelsByProvider(provider: "OpenAI" | "Anthropic" | "Google" | "Microsoft"): GitHubCopilotModel[];
    static getModelsByCategory(category: "chat" | "reasoning" | "coding" | "vision" | "multimodal"): GitHubCopilotModel[];
    static getRecommendedModels(): GitHubCopilotModel[];
    static getStableModels(): GitHubCopilotModel[];
    static getModelByValue(value: string): GitHubCopilotModel | undefined;
    static toN8nOptions(models?: GitHubCopilotModel[]): Array<{
        name: string;
        value: string;
        description: string;
    }>;
    static getModelsForUseCase(useCase: "general" | "coding" | "vision" | "reasoning" | "tools"): GitHubCopilotModel[];
}
export declare const DEFAULT_MODELS: {
    readonly GENERAL: "gpt-4o-mini";
    readonly CODING: "o3-mini";
    readonly VISION: "gpt-4o";
    readonly REASONING: "claude-sonnet-4";
    readonly TOOLS: "gpt-5";
    readonly MULTIMODAL: "gemini-2.5-pro";
};
