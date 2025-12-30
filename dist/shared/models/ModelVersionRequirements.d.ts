export interface ModelRequirements {
    minVSCodeVersion: string;
    supportedEndpoints: string[];
    preview?: boolean;
    additionalHeaders?: Record<string, string>;
    notes?: string;
}
export declare const MODEL_VERSION_REQUIREMENTS: Record<string, ModelRequirements>;
export declare const DEFAULT_MODEL_REQUIREMENTS: ModelRequirements;
export declare function getModelRequirements(model: string): ModelRequirements;
export declare function modelSupportsEndpoint(model: string, endpoint: string): boolean;
export declare function getRecommendedEndpoint(model: string): string;
export declare function validateModelEndpoint(model: string, endpoint: string): void;
export declare function getMinVSCodeVersion(model: string): string;
export declare function isPreviewModel(model: string): boolean;
export declare function getAdditionalHeaders(model: string): Record<string, string>;
