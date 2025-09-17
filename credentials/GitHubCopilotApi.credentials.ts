import {
	ICredentialType,
	INodeProperties,
	ICredentialTestRequest,
} from 'n8n-workflow';

/**
 * GitHub Copilot API OAuth2 Credentials with correct scopes
 * Specifically configured for GitHub Copilot API access
 */

export class GitHubCopilotApi implements ICredentialType {
	name = 'githubCopilotApi';

	displayName = 'GitHub Copilot OAuth2 API';
	
	extends = ['oAuth2Api'];

	documentationUrl =
		'https://docs.github.com/en/copilot/github-copilot-chat/copilot-chat-in-ides/using-github-copilot-chat-in-your-ide';

	properties: INodeProperties[] = [
		{
			displayName: 'Grant Type',
			name: 'grantType',
			type: 'hidden',
			default: 'authorizationCode',
		},
		{
			displayName: 'Authorization URL',
			name: 'authUrl',
			type: 'hidden',
			default: 'https://github.com/login/oauth/authorize',
		},
		{
			displayName: 'Access Token URL',
			name: 'accessTokenUrl',
			type: 'hidden',
			default: 'https://github.com/login/oauth/access_token',
		},
		{
			displayName: 'Scope',
			name: 'scope',
			type: 'hidden',
			// GitHub Copilot specific scopes based on documentation research
			default: 'copilot user read:user read:org',
		},
		{
			displayName: 'Auth URI Query Parameters',
			name: 'authQueryParameters',
			type: 'hidden',
			default: '',
		},
		{
			displayName: 'Authentication',
			name: 'authentication',
			type: 'hidden',
			default: 'header',
		},
	];

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.githubcopilot.com',
			url: '/models',
			method: 'GET',
			headers: {
				'User-Agent': 'vscode-copilot',
				'Copilot-Integration-Id': 'vscode-chat',
				'Editor-Version': 'vscode/1.85.0',
				'Editor-Plugin-Version': 'copilot-chat/0.12.0',
			},
		},
	};
}