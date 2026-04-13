import { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { GITHUB_COPILOT_API, GitHubCopilotEndpoints } from '../../../shared/utils/GitHubCopilotEndpoints';
import { fetchModelsOpenAIFormat, ModelsFilter } from '../utils/modelsApi';

/**
 * Executes the "List Models" operation.
 * Returns available GitHub Copilot models in OpenAI-compatible format.
 */
export async function executeListModels(
	context: IExecuteFunctions,
	i: number,
): Promise<IDataObject> {
	const filter = context.getNodeParameter('modelsFilter', i, 'enabled') as ModelsFilter;

	const credentials = await context.getCredentials('githubCopilotApi', i);
	const token = credentials.token as string;

	if (!token) throw new Error(GITHUB_COPILOT_API.ERRORS.CREDENTIALS_REQUIRED);
	if (!GitHubCopilotEndpoints.validateToken(token))
		throw new Error(GITHUB_COPILOT_API.ERRORS.INVALID_TOKEN);

	return fetchModelsOpenAIFormat(token, filter);
}
