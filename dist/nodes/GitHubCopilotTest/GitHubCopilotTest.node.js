"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHubCopilotTest = void 0;
const GitHubCopilotEndpoints_1 = require("../../shared/utils/GitHubCopilotEndpoints");
const DynamicModelsManager_1 = require("../../shared/utils/DynamicModelsManager");
const OAuthTokenManager_1 = require("../../shared/utils/OAuthTokenManager");
const EmbeddingsApiUtils_1 = require("../../shared/utils/EmbeddingsApiUtils");
async function listAvailableModels(token, enableRetry = true, maxRetries = 3) {
    const retryInfo = {
        attempts: 1,
        retries: [],
        totalDelay: 0,
    };
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
        try {
            const response = await fetch(GitHubCopilotEndpoints_1.GitHubCopilotEndpoints.getModelsUrl(), {
                method: 'GET',
                headers: GitHubCopilotEndpoints_1.GitHubCopilotEndpoints.getAuthHeaders(token),
            });
            if (!response.ok) {
                const errorText = await response.text();
                if (GitHubCopilotEndpoints_1.GitHubCopilotEndpoints.isTpmQuotaError(response.status) &&
                    enableRetry &&
                    attempt <= maxRetries) {
                    const delay = GitHubCopilotEndpoints_1.GitHubCopilotEndpoints.getRetryDelay(attempt);
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
            const data = (await response.json());
            const summary = {
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
                ...data,
            };
            return summary;
        }
        catch (error) {
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
async function refreshModelsCache(githubToken, enableRetry = true, maxRetries = 3) {
    const startTime = Date.now();
    try {
        console.log('🔄 Starting models cache refresh...');
        console.log('🔑 Generating OAuth token...');
        const oauthToken = await OAuthTokenManager_1.OAuthTokenManager.getValidOAuthToken(githubToken);
        const cacheInfoBefore = DynamicModelsManager_1.DynamicModelsManager.getCacheInfo(oauthToken);
        console.log('🗑️ Clearing existing cache...');
        DynamicModelsManager_1.DynamicModelsManager.clearCache(oauthToken);
        console.log('📥 Fetching fresh models from API...');
        const models = await DynamicModelsManager_1.DynamicModelsManager.getAvailableModels(oauthToken);
        const cacheInfoAfter = DynamicModelsManager_1.DynamicModelsManager.getCacheInfo(oauthToken);
        const executionTime = Date.now() - startTime;
        const modelsByVendor = {};
        const capabilitiesCount = {
            streaming: 0,
            tools: 0,
            vision: 0,
            structured: 0,
            parallel: 0,
            reasoning: 0,
        };
        models.forEach((model) => {
            var _a;
            const vendor = model.vendor || 'Unknown';
            modelsByVendor[vendor] = (modelsByVendor[vendor] || 0) + 1;
            if ((_a = model.capabilities) === null || _a === void 0 ? void 0 : _a.supports) {
                const supports = model.capabilities.supports;
                if (supports.streaming)
                    capabilitiesCount.streaming++;
                if (supports.tool_calls)
                    capabilitiesCount.tools++;
                if (supports.vision)
                    capabilitiesCount.vision++;
                if (supports.structured_outputs)
                    capabilitiesCount.structured++;
                if (supports.parallel_tool_calls)
                    capabilitiesCount.parallel++;
                if (supports.max_thinking_budget)
                    capabilitiesCount.reasoning++;
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
                        expiresIn: `${Math.round(cacheInfoBefore.expiresIn / 1000)}s`,
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
                        expiresIn: `${Math.round(cacheInfoAfter.expiresIn / 1000)}s`,
                        fetchedAt: cacheInfoAfter.fetchedAt,
                    }
                    : {
                        cached: false,
                        message: 'Cache refresh failed',
                    },
            },
            models: models.map((model) => {
                var _a;
                return ({
                    id: model.id,
                    name: model.name || model.id,
                    vendor: model.vendor,
                    capabilities: ((_a = model.capabilities) === null || _a === void 0 ? void 0 : _a.supports) || {},
                });
            }),
        };
    }
    catch (error) {
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
async function consolidatedModelTest(token, enableRetry = true, maxRetries = 3, testsPerModel = 5) {
    const testStartTime = Date.now();
    const testResults = {};
    let totalTests = 0;
    let successfulTests = 0;
    let failedTests = 0;
    try {
        console.log('🧪 Starting Consolidated Model Test...');
        const modelsResponse = await listAvailableModels(token, enableRetry, maxRetries);
        if (!modelsResponse.success || !modelsResponse.data) {
            return {
                success: false,
                timestamp: new Date().toISOString(),
                error: 'Failed to fetch models list for consolidated test',
                details: modelsResponse,
            };
        }
        const allModels = modelsResponse.data;
        const availableModels = allModels.filter((modelItem) => {
            var _a;
            const model = modelItem;
            const modelType = (_a = model.capabilities) === null || _a === void 0 ? void 0 : _a.type;
            return modelType !== 'embeddings';
        });
        const testMessage = "Hello! Please respond with just 'OK' to confirm you're working.";
        console.log(`📊 Testing ${availableModels.length} chat models, ${testsPerModel} times each...`);
        for (const modelItem of availableModels) {
            const model = modelItem;
            const modelId = model.id || model.name;
            const modelResults = {
                modelInfo: {
                    id: modelId,
                    name: model.name || modelId,
                    vendor: model.vendor || 'unknown',
                    capabilities: model.capabilities || {},
                },
                tests: [],
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
            for (let testNum = 1; testNum <= testsPerModel; testNum++) {
                const testStart = Date.now();
                totalTests++;
                modelResults.summary.totalAttempts++;
                try {
                    const response = await fetch(GitHubCopilotEndpoints_1.GitHubCopilotEndpoints.getChatCompletionsUrl(), {
                        method: 'POST',
                        headers: GitHubCopilotEndpoints_1.GitHubCopilotEndpoints.getAuthHeaders(token),
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
                        const data = (await response.json());
                        successfulTests++;
                        modelResults.summary.successful++;
                        const choices = data.choices || [];
                        const firstChoice = choices[0] || {};
                        const message = firstChoice.message || {};
                        const usage = data.usage || {};
                        const testResult = {
                            testNumber: testNum,
                            success: true,
                            responseTime: responseTime,
                            response: message.content || 'No content',
                            usage: usage || null,
                            finishReason: firstChoice.finish_reason || 'unknown',
                            timestamp: new Date().toISOString(),
                        };
                        modelResults.tests.push(testResult);
                        const totalTokens = usage.total_tokens;
                        if (totalTokens) {
                            modelResults.summary.avgTokensUsed += totalTokens;
                        }
                    }
                    else {
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
                }
                catch (error) {
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
                await new Promise((resolve) => setTimeout(resolve, 100));
            }
            const successfulResponses = modelResults.tests.filter((t) => {
                const test = t;
                return test.success === true;
            });
            if (successfulResponses.length > 0) {
                const totalResponseTime = successfulResponses.reduce((sum, t) => {
                    const test = t;
                    return sum + (test.responseTime || 0);
                }, 0);
                modelResults.summary.avgResponseTime = Math.round(totalResponseTime / successfulResponses.length);
                modelResults.summary.avgTokensUsed = Math.round(modelResults.summary.avgTokensUsed / successfulResponses.length);
            }
            modelResults.summary.successRate = Math.round((modelResults.summary.successful / modelResults.summary.totalAttempts) * 100);
            testResults[modelId] = modelResults;
        }
        const testEndTime = Date.now();
        const totalTestTime = testEndTime - testStartTime;
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
    }
    catch (error) {
        return {
            success: false,
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error in consolidated test',
            partialResults: testResults,
            testDuration: Date.now() - testStartTime,
        };
    }
}
async function testSingleModel(token, modelId, testMessage, enableRetry = true, maxRetries = 3) {
    const testStart = Date.now();
    try {
        console.log(`🧪 Testing single model: ${modelId}`);
        const response = await fetch(GitHubCopilotEndpoints_1.GitHubCopilotEndpoints.getChatCompletionsUrl(), {
            method: 'POST',
            headers: GitHubCopilotEndpoints_1.GitHubCopilotEndpoints.getAuthHeaders(token),
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
            const data = (await response.json());
            const choices = data.choices || [];
            const firstChoice = choices[0] || {};
            const message = firstChoice.message || {};
            const usage = data.usage || {};
            return {
                success: true,
                modelId: modelId,
                responseTime: `${responseTime}ms`,
                response: message.content || 'No content',
                usage: usage,
                finishReason: firstChoice.finish_reason || 'unknown',
                timestamp: new Date().toISOString(),
                rawResponse: data,
            };
        }
        else {
            const errorText = await response.text();
            return {
                success: false,
                modelId: modelId,
                responseTime: `${responseTime}ms`,
                error: `HTTP ${response.status}: ${errorText}`,
                timestamp: new Date().toISOString(),
            };
        }
    }
    catch (error) {
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
function generateTestRecommendations(testResults) {
    const recommendations = [];
    const modelStats = Object.entries(testResults).map(([modelId, results]) => {
        const modelResult = results;
        const summary = modelResult.summary;
        const modelInfo = modelResult.modelInfo;
        return {
            modelId,
            successRate: summary.successRate,
            avgResponseTime: summary.avgResponseTime,
            vendor: modelInfo.vendor,
        };
    });
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
    const problematicModels = modelStats.filter((m) => m.successRate < 80);
    if (problematicModels.length > 0) {
        recommendations.push({
            type: 'attention_needed',
            title: 'Models Requiring Attention (< 80% success rate)',
            models: problematicModels,
            description: 'These models had reliability issues during testing',
        });
    }
    const vendorStats = modelStats.reduce((acc, model) => {
        const vendor = model.vendor;
        if (!acc[vendor]) {
            acc[vendor] = { count: 0, totalSuccessRate: 0, avgResponseTime: 0 };
        }
        const stats = acc[vendor];
        stats.count++;
        stats.totalSuccessRate += model.successRate;
        stats.avgResponseTime += model.avgResponseTime;
        return acc;
    }, {});
    Object.keys(vendorStats).forEach((vendor) => {
        const vendorData = vendorStats[vendor];
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
async function testEmbeddingModels(githubToken, enableRetry = true, maxRetries = 3) {
    var _a, _b, _c, _d;
    const testStartTime = Date.now();
    try {
        console.log('🧪 Testing embedding models...');
        const modelsUrl = `${GitHubCopilotEndpoints_1.GITHUB_COPILOT_API.URLS.MODELS}`;
        const modelsResponse = await fetch(modelsUrl, {
            method: 'GET',
            headers: GitHubCopilotEndpoints_1.GitHubCopilotEndpoints.getAuthHeaders(githubToken),
        });
        if (!modelsResponse.ok) {
            throw new Error(`Failed to fetch models: ${modelsResponse.status}`);
        }
        const modelsData = (await modelsResponse.json());
        const embeddingModels = modelsData.data.filter((model) => {
            var _a;
            const modelType = (_a = model.capabilities) === null || _a === void 0 ? void 0 : _a.type;
            return modelType === 'embeddings';
        });
        console.log(`📊 Found ${embeddingModels.length} embedding models to test`);
        const oauthToken = await OAuthTokenManager_1.OAuthTokenManager.getValidOAuthToken(githubToken);
        const testResults = {};
        const testText = 'This is a test sentence for embeddings generation.';
        for (const model of embeddingModels) {
            console.log(`\n🔬 Testing model: ${model.name} (${model.id})`);
            const modelResults = {
                modelId: model.id,
                modelName: model.name,
                vendor: model.vendor,
                tests: [],
                summary: {
                    successCount: 0,
                    failureCount: 0,
                    avgResponseTime: 0,
                    totalResponseTime: 0,
                    successRate: 0,
                },
            };
            const testsPerModel = 3;
            for (let testNum = 1; testNum <= testsPerModel; testNum++) {
                const testStart = Date.now();
                try {
                    const requestBody = {
                        model: model.id,
                        input: [testText],
                    };
                    const data = await (0, EmbeddingsApiUtils_1.executeEmbeddingsRequestSimple)(oauthToken, requestBody);
                    const testDuration = Date.now() - testStart;
                    const embeddingLength = ((_c = (_b = (_a = data.data) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.embedding) === null || _c === void 0 ? void 0 : _c.length) || 0;
                    modelResults.tests.push({
                        testNumber: testNum,
                        success: true,
                        responseTime: testDuration,
                        embeddingDimensions: embeddingLength,
                        tokensUsed: ((_d = data.usage) === null || _d === void 0 ? void 0 : _d.total_tokens) || 0,
                    });
                    modelResults.summary.successCount++;
                    modelResults.summary.totalResponseTime += testDuration;
                    console.log(`  ✅ Test ${testNum}/${testsPerModel}: Success (${testDuration}ms, ${embeddingLength}D)`);
                }
                catch (error) {
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
                if (testNum < testsPerModel) {
                    await new Promise((resolve) => setTimeout(resolve, 500));
                }
            }
            const successCount = modelResults.summary.successCount;
            if (successCount > 0) {
                modelResults.summary.avgResponseTime = Math.round(modelResults.summary.totalResponseTime / successCount);
            }
            modelResults.summary.successRate = Math.round((successCount / testsPerModel) * 100);
            testResults[model.id] = modelResults;
        }
        const testDuration = Date.now() - testStartTime;
        const allModels = Object.values(testResults);
        const totalTests = allModels.length * 3;
        const successfulTests = allModels.reduce((sum, m) => sum + m.summary.successCount, 0);
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
    }
    catch (error) {
        return {
            success: false,
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error in embedding models test',
            testDuration: Date.now() - testStartTime,
        };
    }
}
class GitHubCopilotTest {
    constructor() {
        this.description = {
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
                            description: 'Force refresh the cached models list (clears cache and fetches fresh data from API)',
                        },
                        {
                            name: 'Test Embedding Models',
                            value: 'testEmbeddings',
                            description: 'Test all embedding models (text-embedding-*) with sample text generation',
                        },
                        {
                            name: 'Test Chat Models',
                            value: 'consolidatedTest',
                            description: 'Test all available chat models 5 times each and generate comprehensive report ⚠️ This test may take up to 2 minutes to complete',
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
                    description: 'Select the model to test. Choose from the list, or specify an ID using an expression.',
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
                            description: 'Automatically retry requests when hitting TPM (Transactions Per Minute) quota limits (HTTP 403)',
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
        this.methods = {
            loadOptions: {
                async getModels() {
                    const credentials = await this.getCredentials('githubCopilotApi');
                    const token = credentials.token;
                    if (!token) {
                        throw new Error('Credentials are required to load models');
                    }
                    try {
                        const oauthToken = await OAuthTokenManager_1.OAuthTokenManager.getValidOAuthToken(token);
                        const models = await DynamicModelsManager_1.DynamicModelsManager.getAvailableModels(oauthToken);
                        return models
                            .filter((model) => {
                            var _a;
                            const type = (_a = model.capabilities) === null || _a === void 0 ? void 0 : _a.type;
                            return type !== 'embeddings';
                        })
                            .map((model) => {
                            var _a;
                            const multiplier = ((_a = model.billing) === null || _a === void 0 ? void 0 : _a.multiplier)
                                ? ` (${model.billing.multiplier}x)`
                                : '';
                            return {
                                name: `${model.name || model.id}${multiplier}`,
                                value: model.id,
                                description: `${model.vendor || 'GitHub'} - ${model.id}`,
                            };
                        })
                            .sort((a, b) => a.name.localeCompare(b.name));
                    }
                    catch (error) {
                        const errorMessage = error instanceof Error ? error.message : String(error);
                        throw new Error(`Failed to load models: ${errorMessage}`);
                    }
                },
            },
        };
    }
    async execute() {
        const items = this.getInputData();
        const returnData = [];
        for (let i = 0; i < items.length; i++) {
            try {
                const testFunction = this.getNodeParameter('testFunction', i);
                const advancedOptions = this.getNodeParameter('advancedOptions', i, {});
                const enableRetry = advancedOptions.enableRetry !== false;
                const maxRetries = advancedOptions.maxRetries || 3;
                const testsPerModel = testFunction === 'consolidatedTest'
                    ? this.getNodeParameter('testsPerModel', i)
                    : 5;
                const credentials = await this.getCredentials('githubCopilotApi', i);
                const token = credentials.token;
                if (!token) {
                    throw new Error(GitHubCopilotEndpoints_1.GITHUB_COPILOT_API.ERRORS.CREDENTIALS_REQUIRED);
                }
                if (!GitHubCopilotEndpoints_1.GitHubCopilotEndpoints.validateToken(token)) {
                    throw new Error(GitHubCopilotEndpoints_1.GITHUB_COPILOT_API.ERRORS.INVALID_TOKEN);
                }
                let result = {};
                switch (testFunction) {
                    case 'listModels':
                        result = await listAvailableModels(token, enableRetry, maxRetries);
                        break;
                    case 'refreshCache':
                        result = await refreshModelsCache(token, enableRetry, maxRetries);
                        break;
                    case 'testEmbeddings':
                        result = await testEmbeddingModels(token, enableRetry, maxRetries);
                        break;
                    case 'consolidatedTest':
                        result = await consolidatedModelTest(token, enableRetry, maxRetries, testsPerModel);
                        break;
                    case 'testSingleModel':
                        const modelId = this.getNodeParameter('modelId', i);
                        const testMessage = this.getNodeParameter('testMessage', i);
                        result = await testSingleModel(token, modelId, testMessage, enableRetry, maxRetries);
                        break;
                    default:
                        throw new Error(`Unknown test function: ${testFunction}`);
                }
                returnData.push({
                    json: result,
                    pairedItem: { item: i },
                });
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                if (this.continueOnFail()) {
                    returnData.push({
                        json: {
                            error: errorMessage,
                            testFunction: this.getNodeParameter('testFunction', i),
                        },
                        pairedItem: { item: i },
                    });
                }
                else {
                    throw error;
                }
            }
        }
        return [returnData];
    }
}
exports.GitHubCopilotTest = GitHubCopilotTest;
