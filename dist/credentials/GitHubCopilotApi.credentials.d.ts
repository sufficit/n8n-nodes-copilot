import { ICredentialType, INodeProperties, ICredentialTestRequest, IHttpRequestOptions, ICredentialDataDecryptedObject } from 'n8n-workflow';
export declare class GitHubCopilotApi implements ICredentialType {
    name: string;
    displayName: string;
    documentationUrl: string;
    properties: INodeProperties[];
    authenticate(credentials: ICredentialDataDecryptedObject, requestOptions: IHttpRequestOptions): Promise<IHttpRequestOptions>;
    test: ICredentialTestRequest;
}
