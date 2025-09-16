import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class GitHubApiManual implements ICredentialType {
	name = 'gitHubApiManual';
	displayName = 'GitHub API (Manual Token)';
	documentationUrl = 'https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token';
	properties: INodeProperties[] = [
		{
			displayName: 'Access Token',
			name: 'accessToken',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			placeholder: 'gho_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
			description: 'GitHub Personal Access Token with Copilot permissions. Must start with "gho_" for OAuth or "ghp_" for classic.',
		},
		{
			displayName: 'Token Type Info',
			name: 'tokenInfo',
			type: 'notice',
			default: '',
			displayOptions: {
				show: {},
			},
			description: 'For GitHub Copilot CLI, OAuth tokens (gho_) are recommended. Create at: GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens',
		},
	];
}