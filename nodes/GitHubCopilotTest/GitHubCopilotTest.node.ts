import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeConnectionType,
  IDataObject,
} from "n8n-workflow";

import {
  GITHUB_COPILOT_API,
  GitHubCopilotEndpoints,
} from "../../shared/utils/GitHubCopilotEndpoints";

interface GitHubCopilotModel {
	id: string;
	name: string;
	display_name: string;
	model_picker_enabled?: boolean;
	capabilities?: string[];
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
        method: "GET",
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
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        return {
          success: false,
          timestamp: new Date().toISOString(),
          error: errorMessage,
          details: "Failed to fetch models from GitHub Copilot API",
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
    error: "Maximum retry attempts exceeded",
    details: "Failed to fetch models after all retry attempts",
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
    console.log("🧪 Starting Consolidated Model Test...");

    // First, get all available models
    const modelsResponse = await listAvailableModels(token, enableRetry, maxRetries);

    if (!modelsResponse.success || !modelsResponse.data) {
      return {
        success: false,
        timestamp: new Date().toISOString(),
        error: "Failed to fetch models list for consolidated test",
        details: modelsResponse,
      };
    }

    const availableModels = modelsResponse.data as unknown[];
    const testMessage = "Hello! Please respond with just 'OK' to confirm you're working.";

    console.log(`📊 Testing ${availableModels.length} models, ${testsPerModel} times each...`);

    // Test each model multiple times
    for (const modelItem of availableModels) {
      const model = modelItem as Record<string, unknown>;
      const modelId = (model.id as string) || (model.name as string);
      const modelResults = {
        modelInfo: {
          id: modelId,
          name: (model.name as string) || modelId,
          vendor: (model.vendor as string) || "unknown",
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
            method: "POST",
            headers: GitHubCopilotEndpoints.getAuthHeaders(token),
            body: JSON.stringify({
              model: modelId,
              messages: [
                {
                  role: "user",
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
              response: (message.content as string) || "No content",
              usage: usage || null,
              finishReason: (firstChoice.finish_reason as string) || "unknown",
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
            error: error instanceof Error ? error.message : "Unknown error",
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

    console.log("✅ Consolidated test completed successfully!");
    return consolidatedSummary;
  } catch (error) {
    return {
      success: false,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error in consolidated test",
      partialResults: testResults,
      testDuration: Date.now() - testStartTime,
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
      type: "best_performance",
      title: "Top Performing Models (100% success rate)",
      models: bestModels,
      description: "These models completed all tests successfully with fastest response times",
    });
  }

  // Models with issues
  const problematicModels = modelStats.filter((m) => m.successRate < 80);
  if (problematicModels.length > 0) {
    recommendations.push({
      type: "attention_needed",
      title: "Models Requiring Attention (< 80% success rate)",
      models: problematicModels,
      description: "These models had reliability issues during testing",
    });
  }

  // Vendor analysis
  const vendorStats = modelStats.reduce((acc: Record<string, unknown>, model) => {
    const vendor = model.vendor;
    if (!acc[vendor]) {
      acc[vendor] = { count: 0, totalSuccessRate: 0, avgResponseTime: 0 };
    }
    const stats = acc[vendor] as Record<string, number>;
    stats.count++;
    stats.totalSuccessRate += model.successRate;
    stats.avgResponseTime += model.avgResponseTime;
    return acc;
  }, {} as Record<string, unknown>);

  Object.keys(vendorStats).forEach((vendor) => {
    const vendorData = vendorStats[vendor] as Record<string, number>;
    vendorData.avgSuccessRate = Math.round(vendorData.totalSuccessRate / vendorData.count);
    vendorData.avgResponseTime = Math.round(vendorData.avgResponseTime / vendorData.count);
  });

  recommendations.push({
    type: "vendor_analysis",
    title: "Performance by Vendor",
    vendors: vendorStats,
    description: "Comparative analysis of model performance by vendor",
  });

  return recommendations;
}

export class GitHubCopilotTest implements INodeType {
  description: INodeTypeDescription = {
    displayName: "GitHub Copilot Test",
    name: "gitHubCopilotTest",
    icon: "file:../../shared/icons/copilot.svg",
    group: ["AI"],
    version: 1,
    subtitle: "={{$parameter[\"testFunction\"]}}",
    description: "Test GitHub Copilot API credentials with predefined functions",
    defaults: {
      name: "GitHub Copilot Test",
    },
    inputs: [NodeConnectionType.Main],
    outputs: [NodeConnectionType.Main],
    credentials: [
      {
        name: "githubCopilotApi",
        required: true,
        displayOptions: {
          show: {
            credentialType: ["githubCopilotApi"],
          },
        },
      },
      {
        name: "githubCopilotOAuth2Api",
        required: true,
        displayOptions: {
          show: {
            credentialType: ["githubCopilotOAuth2Api"],
          },
        },
      },
    ],
    properties: [
      {
        displayName: "Credential Type",
        name: "credentialType",
        type: "options",
        options: [
          {
            name: "GitHub Copilot API (Manual Token)",
            value: "githubCopilotApi",
            description: "Use manual GitHub CLI token",
          },
          {
            name: "GitHub Copilot OAuth2 (with Helper)",
            value: "githubCopilotOAuth2Api",
            description: "Use OAuth2 credential with helper script",
          },
        ],
        default: "githubCopilotApi",
        description: "Type of credential to use for GitHub Copilot authentication",
      },
      {
        displayName: "Test Function",
        name: "testFunction",
        type: "options",
        noDataExpression: true,
        options: [
          {
            name: "List Available Models",
            value: "listModels",
            description: "Get all models available for your GitHub Copilot subscription",
          },
          {
            name: "Consolidated Model Test",
            value: "consolidatedTest",
            description:
							"Test all available models 5 times each and generate comprehensive report ⚠️ This test may take up to 2 minutes to complete",
          },
        ],
        default: "listModels",
        description: "Select the test function to execute",
      },
      {
        displayName: "Tests Per Model",
        name: "testsPerModel",
        type: "number",
        default: 5,
        description: "Number of times to test each model (affects accuracy of results)",
        displayOptions: {
          show: {
            testFunction: ["consolidatedTest"],
          },
        },
        typeOptions: {
          minValue: 1,
          maxValue: 20,
        },
      },
      {
        displayName: "Advanced Options",
        name: "advancedOptions",
        type: "collection",
        placeholder: "Add Option",
        default: {},
        description: "Additional options for the test execution",
        options: [
          {
            displayName: "Auto Retry on 403 Error",
            name: "enableRetry",
            type: "boolean",
            default: true,
            description:
							"Automatically retry requests when hitting TPM (Transactions Per Minute) quota limits (HTTP 403)",
          },
          {
            displayName: "Max Retry Attempts",
            name: "maxRetries",
            type: "number",
            default: 3,
            description: "Maximum number of retry attempts for 403 errors",
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

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const testFunction = this.getNodeParameter("testFunction", i) as string;
        const advancedOptions = this.getNodeParameter("advancedOptions", i, {}) as IDataObject;

        // Get retry options from advanced options
        const enableRetry = advancedOptions.enableRetry !== false; // Default to true
        const maxRetries = (advancedOptions.maxRetries as number) || 3;

        // Get tests per model (only for consolidated test)
        const testsPerModel =
          testFunction === "consolidatedTest"
            ? (this.getNodeParameter("testsPerModel", i) as number)
            : 5;

        // Get credentials based on type
        const credentialType = this.getNodeParameter(
          "credentialType",
          i,
          "githubCopilotApi",
        ) as string;
        const credentials = await this.getCredentials(credentialType, i);

        // OAuth2 credentials might have different property names
        const token = (credentials.accessToken ||
					credentials.access_token ||
					(credentials.oauthTokenData as Record<string, unknown>)?.access_token ||
					credentials.token) as string;

        if (!token) {
          throw new Error(GITHUB_COPILOT_API.ERRORS.CREDENTIALS_REQUIRED);
        }

        // Validate token format
        if (!GitHubCopilotEndpoints.validateToken(token)) {
          throw new Error(GITHUB_COPILOT_API.ERRORS.INVALID_TOKEN);
        }

        let result: IDataObject = {};

        switch (testFunction) {
        case "listModels":
          result = await listAvailableModels(token, enableRetry, maxRetries);
          break;
        case "consolidatedTest":
          result = await consolidatedModelTest(token, enableRetry, maxRetries, testsPerModel);
          break;
        default:
          throw new Error(`Unknown test function: ${testFunction}`);
        }

        returnData.push({
          json: result,
          pairedItem: { item: i },
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              error: errorMessage,
              testFunction: this.getNodeParameter("testFunction", i),
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
