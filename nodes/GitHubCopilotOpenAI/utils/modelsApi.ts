import { IDataObject } from 'n8n-workflow';
import {
	GITHUB_COPILOT_API,
	GitHubCopilotEndpoints,
} from '../../../shared/utils/GitHubCopilotEndpoints';

export type ModelsFilter = 'all' | 'enabled' | 'chat' | 'embeddings';

interface CopilotModel {
	id: string;
	name?: string;
	vendor?: string;
	version?: string;
	preview?: boolean;
	model_picker_enabled?: boolean;
	model_picker_category?: string;
	capabilities?: {
		type?: string;
		supports?: {
			streaming?: boolean;
			tool_calls?: boolean;
			vision?: boolean;
			structured_outputs?: boolean;
			parallel_tool_calls?: boolean;
			max_thinking_budget?: number;
		};
		limits?: {
			max_context_window_tokens?: number;
			max_output_tokens?: number;
			max_prompt_tokens?: number;
		};
		tokenizer?: string;
	};
	billing?: {
		multiplier?: number;
	};
	policy?: {
		state?: string;
	};
}

interface CopilotModelsResponse {
	data: CopilotModel[];
	object?: string;
}

function vendorToOwnedBy(vendor?: string): string {
	if (!vendor) return 'github-copilot';
	return vendor.toLowerCase().replace(/\s+/g, '-');
}

function applyFilter(models: CopilotModel[], filter: ModelsFilter): CopilotModel[] {
	switch (filter) {
		case 'enabled':
			return models.filter((m) => m.model_picker_enabled !== false);
		case 'chat':
			return models.filter(
				(m) => m.model_picker_enabled !== false && m.capabilities?.type !== 'embeddings',
			);
		case 'embeddings':
			return models.filter((m) => m.capabilities?.type === 'embeddings');
		default:
			return models;
	}
}

/**
 * Fetches models from GitHub Copilot API and returns them
 * in OpenAI-compatible format (equivalent to GET /v1/models).
 */
export async function fetchModelsOpenAIFormat(
	token: string,
	filter: ModelsFilter,
): Promise<IDataObject> {
	const response = await fetch(GitHubCopilotEndpoints.getModelsUrl(), {
		method: 'GET',
		headers: GitHubCopilotEndpoints.getAuthHeaders(token),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(GITHUB_COPILOT_API.ERRORS.API_ERROR(response.status, errorText));
	}

	const raw = (await response.json()) as CopilotModelsResponse;
	const allModels: CopilotModel[] = raw.data ?? [];
	const filtered = applyFilter(allModels, filter);

	const data = filtered.map((model) => ({
		id: model.id,
		object: 'model',
		created: 0,
		owned_by: vendorToOwnedBy(model.vendor),
		name: model.name ?? model.id,
		vendor: model.vendor ?? 'GitHub Copilot',
		version: model.version,
		preview: model.preview ?? false,
		model_picker_enabled: model.model_picker_enabled ?? true,
		model_picker_category: model.model_picker_category,
		capabilities: model.capabilities,
		billing: model.billing,
	}));

	return {
		object: 'list',
		data,
		_meta: {
			total: data.length,
			source_total: allModels.length,
			filter_applied: filter,
			fetched_at: new Date().toISOString(),
		},
	};
}
