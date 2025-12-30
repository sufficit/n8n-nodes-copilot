import { IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription, ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
export declare class GitHubCopilotOpenAI implements INodeType {
    description: INodeTypeDescription;
    methods: {
        loadOptions: {
            getAvailableModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
            getVisionFallbackModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
        };
    };
    execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]>;
}
