import { IWebhookFunctions, IWebhookResponseData, INodeType, INodeTypeDescription } from 'n8n-workflow';
export declare class GitHubCopilotAuthHelper implements INodeType {
    description: INodeTypeDescription;
    webhook(this: IWebhookFunctions): Promise<IWebhookResponseData>;
}
