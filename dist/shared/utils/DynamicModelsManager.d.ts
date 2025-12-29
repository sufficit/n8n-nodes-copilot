interface CopilotModel {
    id: string;
    name: string;
    display_name?: string;
    model_picker_enabled?: boolean;
    model_picker_category?: "lightweight" | "versatile" | "powerful" | string;
    capabilities?: any;
    vendor?: string;
    version?: string;
    preview?: boolean;
    billing?: {
        is_premium: boolean;
        multiplier: number;
        restricted_to?: string[];
    };
    is_chat_default?: boolean;
    is_chat_fallback?: boolean;
}
export declare class DynamicModelsManager {
    private static cache;
    private static readonly CACHE_DURATION_MS;
    private static readonly MIN_REFRESH_INTERVAL_MS;
    private static hashToken;
    private static fetchModelsFromAPI;
    static getAvailableModels(oauthToken: string): Promise<CopilotModel[]>;
    static filterModelsByType(models: CopilotModel[], type: string): CopilotModel[];
    private static getCostMultiplier;
    static modelsToN8nOptions(models: CopilotModel[]): Array<{
        name: string;
        value: string;
        description?: string;
    }>;
    static clearCache(oauthToken: string): void;
    static clearAllCache(): void;
    static getCacheInfo(oauthToken: string): {
        cached: boolean;
        modelsCount: number;
        expiresIn: number;
        fetchedAt: string;
    } | null;
}
export {};
