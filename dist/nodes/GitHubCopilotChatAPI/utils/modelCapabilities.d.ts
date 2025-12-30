import { ModelCapabilities, ModelValidationResult } from './types';
export declare const MODEL_CAPABILITIES: Record<string, ModelCapabilities>;
export declare function validateModelCapabilities(model: string, includeImage: boolean, includeAudio: boolean): ModelValidationResult;
export declare function getSupportedModels(requireImages?: boolean, requireAudio?: boolean): string[];
export declare function getModelInfo(model: string): ModelCapabilities | null;
