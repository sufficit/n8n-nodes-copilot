import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class GitHubApi implements ICredentialType {
	name = 'gitHubApi';

	displayName = 'GitHub OAuth2 API';
	
	extends = ['oAuth2Api'];

	documentationUrl =
		'https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps';

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
			default: 'copilot read:org repo user',
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
}
