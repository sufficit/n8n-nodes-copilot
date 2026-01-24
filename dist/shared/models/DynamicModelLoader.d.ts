import { ILoadOptionsFunctions, INodePropertyOptions } from "n8n-workflow";
export declare function loadAvailableModels(this: ILoadOptionsFunctions, forceRefresh?: boolean): Promise<INodePropertyOptions[]>;
export declare function loadAvailableVisionModels(this: ILoadOptionsFunctions, forceRefresh?: boolean): Promise<INodePropertyOptions[]>;
export declare function loadAvailableEmbeddingModels(this: ILoadOptionsFunctions, forceRefresh?: boolean): Promise<INodePropertyOptions[]>;
