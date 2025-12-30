import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
	ILoadOptionsFunctions,
	INodePropertyOptions,
} from 'n8n-workflow';

import {
	GITHUB_COPILOT_API,
	GitHubCopilotEndpoints,
} from '../../shared/utils/GitHubCopilotEndpoints';

import { DynamicModelsManager } from '../../shared/utils/DynamicModelsManager';
import { OAuthTokenManager } from '../../shared/utils/OAuthTokenManager';
import {
	executeEmbeddingsRequestSimple,
	EmbeddingRequest,
} from '../../shared/utils/EmbeddingsApiUtils';

interface GitHubCopilotModel {
	id: string;
	name: string;
	display_name: string;
	model_picker_enabled?: boolean;
	capabilities?: any;
	vendor?: string;
	version?: string;
	preview?: boolean;
}

interface GitHubCopilotModelsResponse {
	data: GitHubCopilotModel[];
}

async function listAvailableModels(
	token: string,
	enableRetry = true,
	maxRetries = 3,
): Promise<IDataObject> {
	const retryInfo = {
		attempts: 1,
		retries: [] as Array<{ attempt: number; error: string; delay: number; timestamp: string }>,
		totalDelay: 0,
	};

	for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
		try {
			const response = await fetch(GitHubCopilotEndpoints.getModelsUrl(), {
				method: 'GET',
				headers: GitHubCopilotEndpoints.getAuthHeaders(token),
			});

			if (!response.ok) {
				const errorText = await response.text();

				// Check if it's a 403 error and retry is enabled
				if (
					GitHubCopilotEndpoints.isTpmQuotaError(response.status) &&
					enableRetry &&
					attempt <= maxRetries
				) {
					const delay = GitHubCopilotEndpoints.getRetryDelay(attempt);

					retryInfo.retries.push({
						attempt: attempt,
						error: `HTTP ${response.status}: ${errorText}`,
						delay: delay,
						timestamp: new Date().toISOString(),
					});
					retryInfo.totalDelay += delay;
					retryInfo.attempts = attempt + 1;

					console.log(`Attempt ${attempt} failed with 403, retrying in ${delay}ms...`);
					await new Promise((resolve) => setTimeout(resolve, delay));
					continue;
				}

				throw new Error(`API Error ${response.status}: ${errorText}`);
			}

			const data = (await response.json()) as GitHubCopilotModelsResponse;

			// Return ALL models from API - no filtering for test module
			// User decides what to do with the data
			const summary: IDataObject = {
				success: true,
				timestamp: new Date().toISOString(),
				retryInfo: {
					totalAttempts: retryInfo.attempts,
					totalRetries: retryInfo.retries.length,
					totalDelay: retryInfo.totalDelay,
					retryDetails: retryInfo.retries,
					retryEnabled: enableRetry,
					maxRetries: maxRetries,
				},
				// Return the complete API response
				...data,
			};

			return summary;
		} catch (error) {
			// If it's the last attempt or retry is disabled, return error
			if (attempt >= maxRetries + 1 || !enableRetry) {
				const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
				return {
					success: false,
					timestamp: new Date().toISOString(),
					error: errorMessage,
					details: 'Failed to fetch models from GitHub Copilot API',
					retryInfo: {
						totalAttempts: retryInfo.attempts,
						totalRetries: retryInfo.retries.length,
						totalDelay: retryInfo.totalDelay,
						retryDetails: retryInfo.retries,
						retryEnabled: enableRetry,
						maxRetries: maxRetries,
					},
				};
			}
		}
	}

	// This should never be reached, but just in case
	return {
		success: false,
		timestamp: new Date().toISOString(),
		error: 'Maximum retry attempts exceeded',
		details: 'Failed to fetch models after all retry attempts',
		retryInfo: {
			totalAttempts: retryInfo.attempts,
			totalRetries: retryInfo.retries.length,
			totalDelay: retryInfo.totalDelay,
			retryDetails: retryInfo.retries,
			retryEnabled: enableRetry,
			maxRetries: maxRetries,
		},
	};
}

/**
 * Refresh Models Cache
 * Forces a cache clear and fetches fresh models from the API
 */
async function refreshModelsCache(
	githubToken: string,
	enableRetry = true,
	maxRetries = 3,
): Promise<IDataObject> {
	const startTime = Date.now();

	try {
		console.log('🔄 Starting models cache refresh...');

		// Generate OAuth token from GitHub CLI token
		console.log('🔑 Generating OAuth token...');
		const oauthToken = await OAuthTokenManager.getValidOAuthToken(githubToken);

		// Get cache info BEFORE clearing
		const cacheInfoBefore = DynamicModelsManager.getCacheInfo(oauthToken);

		console.log('🗑️ Clearing existing cache...');
		DynamicModelsManager.clearCache(oauthToken);

		console.log('📥 Fetching fresh models from API...');
		const models = await DynamicModelsManager.getAvailableModels(oauthToken);

		// Get cache info AFTER refresh
		const cacheInfoAfter = DynamicModelsManager.getCacheInfo(oauthToken);

		const executionTime = Date.now() - startTime;

		// Group models by vendor
		const modelsByVendor: Record<string, number> = {};
		const capabilitiesCount: Record<string, number> = {
			streaming: 0,
			tools: 0,
			vision: 0,
			structured: 0,
			parallel: 0,
			reasoning: 0,
		};

		models.forEach((model: any) => {
			// Count by vendor
			const vendor = model.vendor || 'Unknown';
			modelsByVendor[vendor] = (modelsByVendor[vendor] || 0) + 1;

			// Count capabilities
			if (model.capabilities?.supports) {
				const supports = model.capabilities.supports;
				if (supports.streaming) capabilitiesCount.streaming++;
				if (supports.tool_calls) capabilitiesCount.tools++;
				if (supports.vision) capabilitiesCount.vision++;
				if (supports.structured_outputs) capabilitiesCount.structured++;
				if (supports.parallel_tool_calls) capabilitiesCount.parallel++;
				if (supports.max_thinking_budget) capabilitiesCount.reasoning++;
			}
		});

		return {
			success: true,
			operation: 'refreshCache',
			timestamp: new Date().toISOString(),
			executionTime: `${executionTime}ms`,
			message: '✅ Models cache refreshed successfully',

			summary: {
				totalModels: models.length,
				modelsByVendor,
				capabilities: capabilitiesCount,
			},

			cache: {
				before: cacheInfoBefore
					? {
							cached: true,
							modelsCount: cacheInfoBefore.modelsCount,
							expiresIn: `${Math.round((cacheInfoBefore.expiresIn as number) / 1000)}s`,
							fetchedAt: cacheInfoBefore.fetchedAt,
						}
					: {
							cached: false,
							message: 'No cache existed before refresh',
						},
				after: cacheInfoAfter
					? {
							cached: true,
							modelsCount: cacheInfoAfter.modelsCount,
							expiresIn: `${Math.round((cacheInfoAfter.expiresIn as number) / 1000)}s`,
							fetchedAt: cacheInfoAfter.fetchedAt,
						}
					: {
							cached: false,
							message: 'Cache refresh failed',
						},
			},

			// Include full models list
			models: models.map((model: any) => ({
				id: model.id,
				name: model.name || model.id,
				vendor: model.vendor,
				capabilities: model.capabilities?.supports || {},
			})),
		};
	} catch (error) {
		const executionTime = Date.now() - startTime;
		const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

		return {
			success: false,
			operation: 'refreshCache',
			timestamp: new Date().toISOString(),
			executionTime: `${executionTime}ms`,
			error: errorMessage,
			message: '❌ Failed to refresh models cache',
			details: error instanceof Error ? error.stack : String(error),
		};
	}
}

// Consolidated test function - tests all models multiple times
async function consolidatedModelTest(
	token: string,
	enableRetry = true,
	maxRetries = 3,
	testsPerModel = 5,
): Promise<IDataObject> {
	const testStartTime = Date.now();
	const testResults: Record<string, unknown> = {};
	let totalTests = 0;
	let successfulTests = 0;
	let failedTests = 0;

	try {
		console.log('🧪 Starting Consolidated Model Test...');

		// First, get all available models
		const modelsResponse = await listAvailableModels(token, enableRetry, maxRetries);

		if (!modelsResponse.success || !modelsResponse.data) {
			return {
				success: false,
				timestamp: new Date().toISOString(),
				error: 'Failed to fetch models list for consolidated test',
				details: modelsResponse,
			};
		}

		const allModels = modelsResponse.data as unknown[];

		// Filter ONLY chat models (exclude embeddings)
		const availableModels = allModels.filter((modelItem) => {
			const model = modelItem as Record<string, unknown>;
			const modelType = (model.capabilities as any)?.type;
			// Only include chat models, exclude embeddings
			return modelType !== 'embeddings';
		});

		const testMessage = "Hello! Please respond with just 'OK' to confirm you're working.";

		console.log(`📊 Testing ${availableModels.length} chat models, ${testsPerModel} times each...`);

		// Test each model multiple times
		for (const modelItem of availableModels) {
			const model = modelItem as Record<string, unknown>;
			const modelId = (model.id as string) || (model.name as string);
			const modelResults = {
				modelInfo: {
					id: modelId,
					name: (model.name as string) || modelId,
					vendor: (model.vendor as string) || 'unknown',
					capabilities: model.capabilities || {},
				},
				tests: [] as unknown[],
				summary: {
					totalAttempts: 0,
					successful: 0,
					failed: 0,
					successRate: 0,
					avgResponseTime: 0,
					avgTokensUsed: 0,
				},
			};

			console.log(`🔍 Testing model: ${modelId}`);

			// Test this model multiple times
			for (let testNum = 1; testNum <= testsPerModel; testNum++) {
				const testStart = Date.now();
				totalTests++;
				modelResults.summary.totalAttempts++;

				try {
					const response = await fetch(GitHubCopilotEndpoints.getChatCompletionsUrl(), {
						method: 'POST',
						headers: GitHubCopilotEndpoints.getAuthHeaders(token),
						body: JSON.stringify({
							model: modelId,
							messages: [
								{
									role: 'user',
									content: testMessage,
								},
							],
							max_tokens: 10,
							temperature: 0.1,
						}),
					});

					const testEnd = Date.now();
					const responseTime = testEnd - testStart;

					if (response.ok) {
						const data = (await response.json()) as Record<string, unknown>;
						successfulTests++;
						modelResults.summary.successful++;

						const choices = (data.choices as unknown[]) || [];
						const firstChoice = (choices[0] as Record<string, unknown>) || {};
						const message = (firstChoice.message as Record<string, unknown>) || {};
						const usage = (data.usage as Record<string, unknown>) || {};

						const testResult = {
							testNumber: testNum,
							success: true,
							responseTime: responseTime,
							response: (message.content as string) || 'No content',
							usage: usage || null,
							finishReason: (firstChoice.finish_reason as string) || 'unknown',
							timestamp: new Date().toISOString(),
						};

						modelResults.tests.push(testResult);

						// Update averages
						const totalTokens = usage.total_tokens as number;
						if (totalTokens) {
							modelResults.summary.avgTokensUsed += totalTokens;
						}
					} else {
						const errorText = await response.text();
						failedTests++;
						modelResults.summary.failed++;

						modelResults.tests.push({
							testNumber: testNum,
							success: false,
							responseTime: responseTime,
							error: `HTTP ${response.status}: ${errorText}`,
							timestamp: new Date().toISOString(),
						});
					}
				} catch (error) {
					const testEnd = Date.now();
					const responseTime = testEnd - testStart;
					failedTests++;
					modelResults.summary.failed++;

					modelResults.tests.push({
						testNumber: testNum,
						success: false,
						responseTime: responseTime,
						error: error instanceof Error ? error.message : 'Unknown error',
						timestamp: new Date().toISOString(),
					});
				}

				// Small delay between tests
				await new Promise((resolve) => setTimeout(resolve, 100));
			}

			// Calculate final averages for this model
			const successfulResponses = modelResults.tests.filter((t: unknown) => {
				const test = t as Record<string, unknown>;
				return test.success === true;
			});

			if (successfulResponses.length > 0) {
				const totalResponseTime = successfulResponses.reduce((sum: number, t: unknown) => {
					const test = t as Record<string, unknown>;
					return sum + ((test.responseTime as number) || 0);
				}, 0);

				modelResults.summary.avgResponseTime = Math.round(
					totalResponseTime / successfulResponses.length,
				);
				modelResults.summary.avgTokensUsed = Math.round(
					modelResults.summary.avgTokensUsed / successfulResponses.length,
				);
			}

			modelResults.summary.successRate = Math.round(
				(modelResults.summary.successful / modelResults.summary.totalAttempts) * 100,
			);

			testResults[modelId] = modelResults;
		}

		const testEndTime = Date.now();
		const totalTestTime = testEndTime - testStartTime;

		// Generate consolidated summary
		const consolidatedSummary = {
			success: true,
			timestamp: new Date().toISOString(),
			testConfiguration: {
				testsPerModel: testsPerModel,
				totalModels: availableModels.length,
				totalTests: totalTests,
				retryEnabled: enableRetry,
				maxRetries: maxRetries,
			},
			overallResults: {
				totalTests: totalTests,
				successfulTests: successfulTests,
				failedTests: failedTests,
				overallSuccessRate: Math.round((successfulTests / totalTests) * 100),
				totalTestTime: totalTestTime,
				avgTimePerTest: Math.round(totalTestTime / totalTests),
			},
			modelResults: testResults,
			recommendations: generateTestRecommendations(testResults),
		};

		console.log('✅ Consolidated test completed successfully!');
		return consolidatedSummary;
	} catch (error) {
		return {
			success: false,
			timestamp: new Date().toISOString(),
			error: error instanceof Error ? error.message : 'Unknown error in consolidated test',
			partialResults: testResults,
			testDuration: Date.now() - testStartTime,
		};
	}
}

// Test a single chat model
async function testSingleModel(
	token: string,
	modelId: string,
	testMessage: string,
	enableRetry = true,
	maxRetries = 3,
): Promise<IDataObject> {
	const testStart = Date.now();

	try {
		console.log(`🧪 Testing single model: ${modelId}`);

		const response = await fetch(GitHubCopilotEndpoints.getChatCompletionsUrl(), {
			method: 'POST',
			headers: GitHubCopilotEndpoints.getAuthHeaders(token),
			body: JSON.stringify({
				model: modelId,
				messages: [
					{
						role: 'user',
						content: testMessage,
					},
				],
				max_tokens: 100,
				temperature: 0.1,
			}),
		});

		const testEnd = Date.now();
		const responseTime = testEnd - testStart;

		if (response.ok) {
			const data = (await response.json()) as Record<string, unknown>;
			const choices = (data.choices as unknown[]) || [];
			const firstChoice = (choices[0] as Record<string, unknown>) || {};
			const message = (firstChoice.message as Record<string, unknown>) || {};
			const usage = (data.usage as Record<string, unknown>) || {};

			return {
				success: true,
				modelId: modelId,
				responseTime: `${responseTime}ms`,
				response: (message.content as string) || 'No content',
				usage: usage,
				finishReason: (firstChoice.finish_reason as string) || 'unknown',
				timestamp: new Date().toISOString(),
				rawResponse: data,
			};
		} else {
			const errorText = await response.text();
			return {
				success: false,
				modelId: modelId,
				responseTime: `${responseTime}ms`,
				error: `HTTP ${response.status}: ${errorText}`,
				timestamp: new Date().toISOString(),
			};
		}
	} catch (error) {
		const testEnd = Date.now();
		return {
			success: false,
			modelId: modelId,
			responseTime: `${testEnd - testStart}ms`,
			error: error instanceof Error ? error.message : 'Unknown error',
			timestamp: new Date().toISOString(),
		};
	}
}

// Generate recommendations based on test results
function generateTestRecommendations(testResults: Record<string, unknown>): unknown[] {
	const recommendations = [];
	const modelStats = Object.entries(testResults).map(([modelId, results]: [string, unknown]) => {
		const modelResult = results as Record<string, unknown>;
		const summary = modelResult.summary as Record<string, unknown>;
		const modelInfo = modelResult.modelInfo as Record<string, unknown>;

		return {
			modelId,
			successRate: summary.successRate as number,
			avgResponseTime: summary.avgResponseTime as number,
			vendor: modelInfo.vendor as string,
		};
	});

	// Best performing models
	const bestModels = modelStats
		.filter((m) => m.successRate === 100)
		.sort((a, b) => a.avgResponseTime - b.avgResponseTime)
		.slice(0, 3);

	if (bestModels.length > 0) {
		recommendations.push({
			type: 'best_performance',
			title: 'Top Performing Models (100% success rate)',
			models: bestModels,
			description: 'These models completed all tests successfully with fastest response times',
		});
	}

	// Models with issues
	const problematicModels = modelStats.filter((m) => m.successRate < 80);
	if (problematicModels.length > 0) {
		recommendations.push({
			type: 'attention_needed',
			title: 'Models Requiring Attention (< 80% success rate)',
			models: problematicModels,
			description: 'These models had reliability issues during testing',
		});
	}

	// Vendor analysis
	const vendorStats = modelStats.reduce(
		(acc: Record<string, unknown>, model) => {
			const vendor = model.vendor;
			if (!acc[vendor]) {
				acc[vendor] = { count: 0, totalSuccessRate: 0, avgResponseTime: 0 };
			}
			const stats = acc[vendor] as Record<string, number>;
			stats.count++;
			stats.totalSuccessRate += model.successRate;
			stats.avgResponseTime += model.avgResponseTime;
			return acc;
		},
		{} as Record<string, unknown>,
	);

	Object.keys(vendorStats).forEach((vendor) => {
		const vendorData = vendorStats[vendor] as Record<string, number>;
		vendorData.avgSuccessRate = Math.round(vendorData.totalSuccessRate / vendorData.count);
		vendorData.avgResponseTime = Math.round(vendorData.avgResponseTime / vendorData.count);
	});

	recommendations.push({
		type: 'vendor_analysis',
		title: 'Performance by Vendor',
		vendors: vendorStats,
		description: 'Comparative analysis of model performance by vendor',
	});

	return recommendations;
}

// Test embedding models specifically
async function testEmbeddingModels(
	githubToken: string,
	enableRetry = true,
	maxRetries = 3,
): Promise<IDataObject> {
	const testStartTime = Date.now();

	try {
		console.log('🧪 Testing embedding models...');

		// Fetch all models using GitHub token
		const modelsUrl = `${GITHUB_COPILOT_API.URLS.MODELS}`;
		const modelsResponse = await fetch(modelsUrl, {
			method: 'GET',
			headers: GitHubCopilotEndpoints.getAuthHeaders(githubToken),
		});

		if (!modelsResponse.ok) {
			throw new Error(`Failed to fetch models: ${modelsResponse.status}`);
		}

		const modelsData = (await modelsResponse.json()) as GitHubCopilotModelsResponse;

		// Filter embedding models only
		const embeddingModels = modelsData.data.filter((model) => {
			const modelType = (model.capabilities as any)?.type;
			return modelType === 'embeddings';
		});

		console.log(`📊 Found ${embeddingModels.length} embedding models to test`);

		// Generate OAuth token for embeddings API requests (required)
		const oauthToken = await OAuthTokenManager.getValidOAuthToken(githubToken);

		const testResults: Record<string, unknown> = {};
		const testText = 'This is a test sentence for embeddings generation.';

		// Test each embedding model
		for (const model of embeddingModels) {
			console.log(`\n🔬 Testing model: ${model.name} (${model.id})`);

			const modelResults = {
				modelId: model.id,
				modelName: model.name,
				vendor: model.vendor,
				tests: [] as unknown[],
				summary: {
					successCount: 0,
					failureCount: 0,
					avgResponseTime: 0,
					totalResponseTime: 0,
					successRate: 0,
				},
			};

			// Test multiple times
			const testsPerModel = 3;
			for (let testNum = 1; testNum <= testsPerModel; testNum++) {
				const testStart = Date.now();

				try {
					const requestBody: EmbeddingRequest = {
						model: model.id,
						input: [testText],
					};

					const data = await executeEmbeddingsRequestSimple(oauthToken, requestBody);

					const testDuration = Date.now() - testStart;
					const embeddingLength = data.data?.[0]?.embedding?.length || 0;

					modelResults.tests.push({
						testNumber: testNum,
						success: true,
						responseTime: testDuration,
						embeddingDimensions: embeddingLength,
						tokensUsed: data.usage?.total_tokens || 0,
					});

					modelResults.summary.successCount++;
					modelResults.summary.totalResponseTime += testDuration;

					console.log(
						`  ✅ Test ${testNum}/${testsPerModel}: Success (${testDuration}ms, ${embeddingLength}D)`,
					);
				} catch (error) {
					const testDuration = Date.now() - testStart;
					const errorMessage = error instanceof Error ? error.message : 'Unknown error';

					modelResults.tests.push({
						testNumber: testNum,
						success: false,
						responseTime: testDuration,
						error: errorMessage,
					});

					modelResults.summary.failureCount++;

					console.log(`  ❌ Test ${testNum}/${testsPerModel}: Error - ${errorMessage}`);
				}

				// Small delay between tests
				if (testNum < testsPerModel) {
					await new Promise((resolve) => setTimeout(resolve, 500));
				}
			}

			// Calculate summary stats
			const successCount = modelResults.summary.successCount;
			if (successCount > 0) {
				modelResults.summary.avgResponseTime = Math.round(
					modelResults.summary.totalResponseTime / successCount,
				);
			}
			modelResults.summary.successRate = Math.round((successCount / testsPerModel) * 100);

			testResults[model.id] = modelResults;
		}

		const testDuration = Date.now() - testStartTime;

		// Calculate overall statistics
		const allModels = Object.values(testResults);
		const totalTests = allModels.length * 3;
		const successfulTests = allModels.reduce(
			(sum, m: any) => sum + m.summary.successCount,
			0,
		) as number;

		return {
			success: true,
			timestamp: new Date().toISOString(),
			testDuration: testDuration,
			testDurationFormatted: `${Math.floor(testDuration / 1000)}s`,
			testConfig: {
				testsPerModel: 3,
				totalModels: embeddingModels.length,
				totalTests: totalTests,
				retryEnabled: enableRetry,
				maxRetries: maxRetries,
			},
			overallResults: {
				totalTests: totalTests,
				successfulTests: successfulTests,
				failedTests: totalTests - successfulTests,
				overallSuccessRate: Math.round((successfulTests / totalTests) * 100),
			},
			modelResults: testResults,
			availableModels: embeddingModels.map((m) => ({
				id: m.id,
				name: m.name,
				vendor: m.vendor,
			})),
		};
	} catch (error) {
		return {
			success: false,
			timestamp: new Date().toISOString(),
			error: error instanceof Error ? error.message : 'Unknown error in embedding models test',
			testDuration: Date.now() - testStartTime,
		};
	}
}

export class GitHubCopilotTest implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'GitHub Copilot Test',
		name: 'gitHubCopilotTest',
		icon: 'file:../../shared/icons/copilot.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["testFunction"]}}',
		description: 'Test GitHub Copilot API credentials with predefined functions',
		defaults: {
			name: 'GitHub Copilot Test',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'githubCopilotApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Test Function',
				name: 'testFunction',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'List Available Models',
						value: 'listModels',
						description: 'Get all models available for your GitHub Copilot subscription',
					},
					{
						name: 'Refresh Models Cache',
						value: 'refreshCache',
						description:
							'Force refresh the cached models list (clears cache and fetches fresh data from API)',
					},
					{
						name: 'Test Embedding Models',
						value: 'testEmbeddings',
						description: 'Test all embedding models (text-embedding-*) with sample text generation',
					},
					{
						name: 'Test Chat Models',
						value: 'consolidatedTest',
						description:
							'Test all available chat models 5 times each and generate comprehensive report ⚠️ This test may take up to 2 minutes to complete',
					},
					{
						name: 'Test Single Chat Model',
						value: 'testSingleModel',
						description: 'Test a specific chat model with a custom message',
					},
				],
				default: 'listModels',
				description: 'Select the test function to execute',
			},
			{
				displayName: 'Model Name or ID',
				name: 'modelId',
				type: 'options',
				description:
					'Select the model to test. Choose from the list, or specify an ID using an expression.',
				typeOptions: {
					loadOptionsMethod: 'getModels',
				},
				displayOptions: {
					show: {
						testFunction: ['testSingleModel'],
					},
				},
				default: '',
			},
			{
				displayName: 'Test Message',
				name: 'testMessage',
				type: 'string',
				default: "Hello! Please respond with just 'OK' to confirm you're working.",
				displayOptions: {
					show: {
						testFunction: ['testSingleModel'],
					},
				},
			},
			{
				displayName: 'Tests Per Model',
				name: 'testsPerModel',
				type: 'number',
				default: 5,
				description: 'Number of times to test each model (affects accuracy of results)',
				displayOptions: {
					show: {
						testFunction: ['consolidatedTest'],
					},
				},
				typeOptions: {
					minValue: 1,
					maxValue: 20,
				},
			},
			{
				displayName: 'Advanced Options',
				name: 'advancedOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				description: 'Additional options for the test execution',
				options: [
					{
						displayName: 'Auto Retry on 403 Error',
						name: 'enableRetry',
						type: 'boolean',
						default: true,
						description:
							'Automatically retry requests when hitting TPM (Transactions Per Minute) quota limits (HTTP 403)',
					},
					{
						displayName: 'Max Retry Attempts',
						name: 'maxRetries',
						type: 'number',
						default: 3,
						description: 'Maximum number of retry attempts for 403 errors',
						displayOptions: {
							show: {
								enableRetry: [true],
							},
						},
					},
				],
			},
		],
	};

	methods = {
		loadOptions: {
			// Get available models for the dropdown
			async getModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('githubCopilotApi');
				const token = credentials.token as string;

				if (!token) {
					throw new Error('Credentials are required to load models');
				}

				try {
					// Use DynamicModelsManager to get models (handles caching)
					// We need an OAuth token for this
					const oauthToken = await OAuthTokenManager.getValidOAuthToken(token);
					const models = await DynamicModelsManager.getAvailableModels(oauthToken);

					return models
						.filter((model: any) => {
							const type = model.capabilities?.type;
							return type !== 'embeddings'; // Only chat models
						})
						.map((model: any) => {
							const multiplier = model.billing?.multiplier
								? ` (${model.billing.multiplier}x)`
								: '';
							return {
								name: `${model.name || model.id}${multiplier}`,
								value: model.id,
								description: `${model.vendor || 'GitHub'} - ${model.id}`,
							};
						})
						.sort((a, b) => a.name.localeCompare(b.name));
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : String(error);
					throw new Error(`Failed to load models: ${errorMessage}`);
				}
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const testFunction = this.getNodeParameter('testFunction', i) as string;
				const advancedOptions = this.getNodeParameter('advancedOptions', i, {}) as IDataObject;

				// Get retry options from advanced options
				const enableRetry = advancedOptions.enableRetry !== false; // Default to true
				const maxRetries = (advancedOptions.maxRetries as number) || 3;

				// Get tests per model (only for consolidated test)
				const testsPerModel =
					testFunction === 'consolidatedTest'
						? (this.getNodeParameter('testsPerModel', i) as number)
						: 5;

				// Get credentials
				const credentials = await this.getCredentials('githubCopilotApi', i);

				// Get token from credential
				const token = credentials.token as string;

				if (!token) {
					throw new Error(GITHUB_COPILOT_API.ERRORS.CREDENTIALS_REQUIRED);
				}

				// Validate token format
				if (!GitHubCopilotEndpoints.validateToken(token)) {
					throw new Error(GITHUB_COPILOT_API.ERRORS.INVALID_TOKEN);
				}

				let result: IDataObject = {};

				switch (testFunction) {
					case 'listModels':
						result = await listAvailableModels(token, enableRetry, maxRetries);
						break;
					case 'refreshCache':
						// Force refresh the models cache
						result = await refreshModelsCache(token, enableRetry, maxRetries);
						break;
					case 'testEmbeddings':
						result = await testEmbeddingModels(token, enableRetry, maxRetries);
						break;
					case 'consolidatedTest':
						result = await consolidatedModelTest(token, enableRetry, maxRetries, testsPerModel);
						break;
					case 'testSingleModel':
						const modelId = this.getNodeParameter('modelId', i) as string;
						const testMessage = this.getNodeParameter('testMessage', i) as string;
						result = await testSingleModel(
							token,
							modelId,
							testMessage,
							enableRetry,
							maxRetries,
						);
						break;
					default:
						throw new Error(`Unknown test function: ${testFunction}`);
				}

				returnData.push({
					json: result,
					pairedItem: { item: i },
				});
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: errorMessage,
							testFunction: this.getNodeParameter('testFunction', i),
						},
						pairedItem: { item: i },
					});
				} else {
					throw error;
				}
			}
		}

		return [returnData];
	}
}
