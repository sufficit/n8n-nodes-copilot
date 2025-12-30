import { IExecuteFunctions, INodeType, INodeTypeDescription, INodeExecutionData } from 'n8n-workflow';
interface ISpeechOptions {
    temperature?: number;
    maxTokens?: number;
    timeout?: number;
}
export declare class GitHubCopilotSpeech implements INodeType {
    description: INodeTypeDescription;
    execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]>;
    static transcribeWithMicrosoftSpeech(audioBuffer: Buffer, format: string, language: string, oauthToken: string, options: ISpeechOptions, context: IExecuteFunctions): Promise<string>;
    static detectAudioFormat(buffer: Buffer): string;
    static isSupportedFormat(format: string): boolean;
}
export {};
