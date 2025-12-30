import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
	NodeOperationError,
	ILoadOptionsFunctions,
	INodePropertyOptions,
} from 'n8n-workflow';

import { nodeProperties } from './nodeProperties';
import { makeApiRequest, CopilotResponse } from '../GitHubCopilotChatAPI/utils';
import { GITHUB_COPILOT_API } from '../../shared/utils/GitHubCopilotEndpoints';
import { loadAvailableModels, loadAvailableVisionModels } from '../../shared/models/DynamicModelLoader';
import { GitHubCopilotModelsManager } from '../../shared/models/GitHubCopilotModels';

export class GitHubCopilotOpenAI implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'GitHub Copilot OpenAI',
		name: 'gitHubCopilotOpenAI',
		icon: 'file:../../shared/icons/copilot.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["model"]}}',
		description:
			'OpenAI-compatible GitHub Copilot Chat API with full support for messages, tools, and all OpenAI parameters',
		defaults: {
			name: 'GitHub Copilot OpenAI',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'githubCopilotApi',
				required: true,
			},
		],
		properties: nodeProperties,
	};

	methods = {
		loadOptions: {
			async getAvailableModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				return await loadAvailableModels.call(this);
			},
			async getVisionFallbackModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				return await loadAvailableVisionModels.call(this);
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				// Get model based on source (fromList or custom)
				const modelSource = this.getNodeParameter('modelSource', i, 'fromList') as string;
				let model: string;

				if (modelSource === 'custom') {
					// User chose "Custom (Manual Entry)" mode
					model = this.getNodeParameter('customModel', i) as string;
					if (!model || model.trim() === '') {
						throw new Error(
							"Custom model name is required when using 'Custom (Manual Entry)' mode",
						);
					}
					console.log(`🔧 Using custom model: ${model}`);
				} else {
					// User chose "From List (Auto-Discovered)" mode
					const selectedModel = this.getNodeParameter('model', i) as string;

					if (selectedModel === '__manual__') {
						// User selected "✏️ Enter Custom Model Name" from dropdown
						model = this.getNodeParameter('customModel', i) as string;
						if (!model || model.trim() === '') {
							throw new Error(
								"Custom model name is required when selecting '✏️ Enter Custom Model Name'",
							);
						}
						console.log(`✏️ Using manually entered model: ${model}`);
					} else {
						// Normal model selection from dropdown
						model = selectedModel;
						console.log(`📋 Using model from list: ${model}`);
					}
				}

				// Get OpenAI-style parameters from n8n UI
				const messagesInputMode = this.getNodeParameter('messagesInputMode', i, 'manual') as string;

				// Parse messages based on input mode
				let messages: Array<{ role: string; content: string }> = [];
				let requestBodyFromJson: IDataObject | undefined = undefined;

				if (messagesInputMode === 'json') {
					// JSON mode: accept both string (to be parsed) or direct object/array
					const messagesJson = this.getNodeParameter('messagesJson', i, '[]');

					try {
						let parsed: any;

						// Check if it's already an object/array (passed directly from n8n expression)
						if (typeof messagesJson === 'object') {
							parsed = messagesJson;
							console.log('📥 Received messages as direct object/array (no parsing needed)');
						} else {
							// It's a string, parse it
							parsed = JSON.parse(messagesJson as string);
							console.log('📥 Parsed messages from JSON string');
						}

						// Check if it's a full OpenAI request body or just messages array
						if (Array.isArray(parsed)) {
							messages = parsed;
						} else if (parsed.messages && Array.isArray(parsed.messages)) {
							// Full OpenAI request body - extract everything
							messages = parsed.messages;
							requestBodyFromJson = parsed;
							console.log('📥 Full OpenAI request body received:', JSON.stringify(parsed, null, 2));
						} else {
							messages = parsed;
						}
					} catch (error) {
						throw new Error(
							`Failed to parse messages JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
						);
					}
				} else {
					// Manual mode: parse from n8n UI format
					const messagesParam = this.getNodeParameter('messages', i, {
						message: [],
					}) as IDataObject;

					console.log('📥 Manual mode - messagesParam:', JSON.stringify(messagesParam, null, 2));

					if (messagesParam.message && Array.isArray(messagesParam.message)) {
						for (const msg of messagesParam.message as IDataObject[]) {
							const message: any = {
								role: msg.role as string,
								content: msg.content as string,
							};

							// Add type if provided and valid (for file attachments)
							if (msg.type && (msg.type === 'text' || msg.type === 'image_url')) {
								message.type = msg.type;
							}

							messages.push(message);
						}
					}

					console.log('📥 Manual mode - parsed messages:', JSON.stringify(messages, null, 2));
				}

				// Default message if none provided
				if (messages.length === 0) {
					messages.push({
						role: 'user',
						content: 'Hello! How can you help me?',
					});
				}

				// ⚠️ VALIDATE MESSAGE FORMAT: Detect incorrect file usage in content
				for (let msgIndex = 0; msgIndex < messages.length; msgIndex++) {
					const msg = messages[msgIndex] as any;

					// Check if content is an array (OpenAI format with image_url)
					if (Array.isArray(msg.content)) {
						for (const contentItem of msg.content) {
							// Detect if user is trying to use type: 'file' inside content array
							if (contentItem.type === 'file') {
								throw new NodeOperationError(
									this.getNode(),
									`❌ GitHub Copilot API Error: File attachments cannot be used inside 'content' array.\n\n` +
										`📋 INCORRECT FORMAT (OpenAI style - doesn't work):\n` +
										`{\n` +
										`  "role": "user",\n` +
										`  "content": [\n` +
										`    {"type": "text", "text": "Analyze this"},\n` +
										`    {"type": "file", "file": "data:..."}  ❌ WRONG\n` +
										`  ]\n` +
										`}\n\n` +
										`✅ CORRECT FORMAT (GitHub Copilot - message level):\n` +
										`[\n` +
										`  {"role": "user", "content": "Analyze this file"},\n` +
										`  {"role": "user", "content": "data:image/png;base64,...", "type": "file"}  ✅ CORRECT\n` +
										`]\n\n` +
										`💡 Solution: Use separate messages with 'type' property at message level, not inside content array.`,
									{ itemIndex: i },
								);
							}
						}
					}
				}

				console.log('📤 Final messages being sent to API:', JSON.stringify(messages, null, 2));

				// Get advanced options
				const advancedOptions = this.getNodeParameter('advancedOptions', i, {}) as IDataObject;

				// Parse tools (if provided) - now from advancedOptions
				let parsedTools: Array<Record<string, unknown>> = [];
				const tools = advancedOptions.tools as string | Array<Record<string, unknown>> | undefined;

				if (tools) {
					try {
						if (typeof tools === 'object' && Array.isArray(tools) && tools.length > 0) {
							// Already an array with items, use directly
							parsedTools = tools;
							console.log('📥 Received tools as direct array (no parsing needed)');
						} else if (typeof tools === 'string' && tools.trim()) {
							// String, parse it
							const parsed = JSON.parse(tools);
							if (Array.isArray(parsed) && parsed.length > 0) {
								parsedTools = parsed;
								console.log('📥 Parsed tools from JSON string');
							} else {
								console.log('📥 Tools string parsed but empty or not an array');
							}
						} else {
							console.log('📥 Tools field present but empty or invalid');
						}
					} catch (error) {
						console.log(
							'⚠️ Failed to parse tools, ignoring:',
							error instanceof Error ? error.message : 'Unknown error',
						);
					}
				} else {
					console.log('📥 No tools specified');
				}

				// Get OpenAI parameters from advancedOptions (all now optional)
				let max_tokens = (advancedOptions.max_tokens as number) || 4096;

				// Validate max_tokens (ensure it's a valid positive number)
				if (!max_tokens || max_tokens <= 0 || isNaN(max_tokens)) {
					max_tokens = 4096; // Default to 4096 if invalid
					console.log('⚠️ Invalid max_tokens value, using default: 4096');
				}

				const temperature = (advancedOptions.temperature as number) ?? 1;
				const top_p = (advancedOptions.top_p as number) ?? 1;
				const frequency_penalty = (advancedOptions.frequency_penalty as number) ?? 0;
				const presence_penalty = (advancedOptions.presence_penalty as number) ?? 0;
				const seed = (advancedOptions.seed as number) || 0;
				const stream = (advancedOptions.stream as boolean) ?? false;
				const user = (advancedOptions.user as string) || undefined;
				const stop = (advancedOptions.stop as string) || undefined;
				const response_format_ui = (advancedOptions.response_format as string) || 'text';

				// Parse response_format - prioritize: JSON request body → UI field → advancedOptions
				let response_format: { type?: string } | undefined = undefined;

				// Priority 1: Check if response_format came from JSON request body (Chatwoot)
				if (requestBodyFromJson?.response_format) {
					response_format = requestBodyFromJson.response_format as { type?: string };
					console.log(
						'📋 response_format from JSON request body:',
						JSON.stringify(response_format),
					);
				}
				// Priority 2: Check UI field
				else if (response_format_ui && response_format_ui !== 'text') {
					response_format = { type: response_format_ui };
					console.log('📋 response_format from UI field:', JSON.stringify(response_format));
				}
				// Priority 3: Check advancedOptions (legacy)
				else if (
					advancedOptions.response_format &&
					typeof advancedOptions.response_format === 'string'
				) {
					try {
						response_format = JSON.parse(advancedOptions.response_format as string) as {
							type?: string;
						};
						console.log(
							'📋 response_format from advancedOptions:',
							JSON.stringify(response_format),
						);
					} catch {
						// If parse fails, ignore response_format
						console.log('⚠️ Failed to parse response_format from advancedOptions');
					}
				}

				if (response_format) {
					console.log('✅ Final response_format:', JSON.stringify(response_format));
					console.log('🔍 response_format.type:', response_format.type);
				} else {
					console.log('ℹ️ No response_format specified - using default text format');
				}

				// Map OpenAI model names to GitHub Copilot models
				const modelMapping: Record<string, string> = {
					'gpt-4': 'gpt-4o',
					'gpt-4o': 'gpt-4o',
					'gpt-4o-mini': 'gpt-4o-mini',
					'gpt-4-turbo': 'gpt-4o',
					'claude-3-5-sonnet': 'claude-3.5-sonnet',
					'claude-3.5-sonnet-20241022': 'claude-3.5-sonnet',
					o1: 'o1',
					'o1-preview': 'o1-preview',
					'o1-mini': 'o1-mini',
				};
				let copilotModel = modelMapping[model] || model;

				// Detect vision content in messages (images)
				let hasVisionContent = false;
				for (const msg of messages) {
					const content = (msg as any).content;
					if (typeof content === 'string') {
						if (content.includes('data:image/') || content.match(/\[.*image.*\]/i)) {
							hasVisionContent = true;
							break;
						}
					} else if (Array.isArray(content)) {
						for (const part of content) {
							if (part?.type === 'image_url' || part?.type === 'image' || part?.image_url) {
								hasVisionContent = true;
								break;
							}
						}
						if (hasVisionContent) break;
					}
				}

				// Handle vision fallback when model doesn't support vision
				if (hasVisionContent) {
					const modelInfo = GitHubCopilotModelsManager.getModelByValue(copilotModel);
					const supportsVision = modelInfo?.capabilities?.vision || modelInfo?.capabilities?.multimodal || (modelInfo as any)?.capabilities?.supports?.vision;
					
					if (!supportsVision) {
						const enableVisionFallback = advancedOptions.enableVisionFallback as boolean || false;
						if (enableVisionFallback) {
							const fallbackModelRaw = advancedOptions.visionFallbackModel as string;
							const fallbackModel = fallbackModelRaw === '__manual__'
								? (advancedOptions.visionFallbackCustomModel as string)
								: fallbackModelRaw;
							
							if (!fallbackModel || fallbackModel.trim() === '') {
								throw new NodeOperationError(
									this.getNode(),
									'Vision fallback enabled but no fallback model was selected or provided. Please select a vision-capable model in Advanced Options.',
									{ itemIndex: i }
								);
							}
							
							console.log(`👁️ Model ${copilotModel} does not support vision - using fallback model: ${fallbackModel}`);
							copilotModel = fallbackModel;
						} else if (modelInfo) {
							throw new NodeOperationError(
								this.getNode(),
								`Model ${copilotModel} does not support vision/image processing. Enable "Vision Fallback" in Advanced Options and select a vision-capable model, or choose a model with vision capabilities.`,
								{ itemIndex: i }
							);
						}
					}
				}

				// Build GitHub Copilot API request body
				const requestBody: Record<string, unknown> = {
					model: copilotModel,
					messages,
					stream,
					temperature,
					max_tokens,
				};

				// Add optional parameters only if they differ from defaults
				if (top_p !== 1) {
					requestBody.top_p = top_p;
				}
				if (frequency_penalty !== 0) {
					requestBody.frequency_penalty = frequency_penalty;
				}
				if (presence_penalty !== 0) {
					requestBody.presence_penalty = presence_penalty;
				}
				if (user) {
					requestBody.user = user;
				}
				if (stop) {
					try {
						requestBody.stop = JSON.parse(stop);
					} catch {
						// If parse fails, use as single string
						requestBody.stop = stop;
					}
				}

				// Add tools if provided
				if (parsedTools.length > 0) {
					requestBody.tools = parsedTools;

					// Add tool_choice if tools are present
					const tool_choice = (advancedOptions.tool_choice as string) || 'auto';
					if (tool_choice !== 'auto') {
						requestBody.tool_choice = tool_choice;
					}
				}

				// Add response_format if provided
				if (response_format) {
					requestBody.response_format = response_format;

					// NOTE: OpenAI API requires the word "json" in messages when using json_object format
					// User must include "json" in their system message or user prompt
					// Example: "Respond in JSON format" or "Return as json"

					/* DISABLED: Auto-injection of "json" keyword - user should handle this manually
            // Auto-inject "json" requirement for json_object format
            if (response_format.type === 'json_object') {
              const allMessagesText = messages.map(m => m.content).join(' ').toLowerCase();
              
              // If "json" is not mentioned in any message, inject it automatically
              if (!allMessagesText.includes('json')) {
                // Try to find existing system message and append
                const systemMessageIndex = messages.findIndex(m => m.role === 'system');
                
                if (systemMessageIndex !== -1) {
                  // Append to existing system message
                  messages[systemMessageIndex].content += '\n\nResponse format: json';
                  console.log('ℹ️ Auto-injected "json" keyword into existing system message for json_object format');
                } else {
                  // Add new system message at the beginning
                  messages.unshift({
                    role: 'system',
                    content: 'Response format: json'
                  });
                  console.log('ℹ️ Auto-injected system message with "json" keyword for json_object format');
                }
              }
            }
            */
				}

				// Add seed if provided
				if (seed > 0) {
					requestBody.seed = seed;
				}

				console.log('🚀 Sending request to GitHub Copilot API:');
				console.log('  Model:', copilotModel);
				console.log('  Messages count:', messages.length);
				console.log('  Has Vision Content:', hasVisionContent);
				console.log('  Request body:', JSON.stringify(requestBody, null, 2));

				// Make API request to GitHub Copilot
				const response: CopilotResponse = await makeApiRequest(
					this,
					GITHUB_COPILOT_API.ENDPOINTS.CHAT_COMPLETIONS,
					requestBody,
					hasVisionContent, // Pass vision flag for proper headers
				);

				// Extract retry information from response metadata
				const retriesUsed = response._retryMetadata?.retries || 0;

				if (retriesUsed > 0) {
					console.log(`ℹ️ Request completed with ${retriesUsed} retry(ies)`);
				}

				// Helper function to parse JSON from markdown code blocks and return as object
				// Function to clean JSON from markdown blocks (but keep as string)
				const cleanJsonFromMarkdown = (content: string): string => {
					if (!content || typeof content !== 'string') {
						return content;
					}

					try {
						const trimmed = content.trim();
						console.log('🧹 cleanJsonFromMarkdown - Input length:', trimmed.length);

						// Check if content is wrapped in markdown code block
						const jsonBlockRegex = /^```(?:json)?\s*\n([\s\S]*?)\n```\s*$/;
						const match = trimmed.match(jsonBlockRegex);

						if (match && match[1]) {
							// Extract JSON from markdown block and return as string
							const extracted = match[1].trim();
							console.log('✅ cleanJsonFromMarkdown - Extracted from markdown block');
							return extracted;
						}

						// No markdown block, return as is
						console.log('ℹ️ cleanJsonFromMarkdown - No markdown block found, returning as is');
						return trimmed;
					} catch (error) {
						console.error('❌ cleanJsonFromMarkdown - Error:', error);
						return content;
					}
				}; // Build OpenAI-compatible response (EXACT OpenAI format)
				console.log('🔨 Building OpenAI response...');
				console.log(
					'🔍 response_format check:',
					response_format?.type === 'json_object' ? 'WILL CLEAN MARKDOWN' : 'WILL KEEP AS IS',
				);

				const openAIResponse: Record<string, any> = {
					id: response.id || `chatcmpl-${Date.now()}`,
					object: response.object || 'chat.completion',
					created: response.created || Math.floor(Date.now() / 1000),
					model: model, // Return the requested OpenAI model name
					choices: response.choices.map((choice, choiceIndex) => {
						console.log(`\n📝 Processing choice ${choiceIndex}:`);
						console.log('  - role:', choice.message.role);
						console.log('  - content type:', typeof choice.message.content);
						console.log('  - content length:', choice.message.content?.length || 0);
						console.log('  - has tool_calls:', !!choice.message.tool_calls);

						let processedContent = choice.message.content;

						// Process content - only clean markdown if json_object, but KEEP AS STRING
						if (choice.message.content !== null && choice.message.content !== undefined) {
							if (response_format?.type === 'json_object') {
								console.log('  🧹 Applying cleanJsonFromMarkdown (keeping as string)...');
								processedContent = cleanJsonFromMarkdown(choice.message.content);
								console.log('  ✅ Processed content type:', typeof processedContent);
							} else {
								console.log('  ℹ️ Keeping content as is');
							}
						}

						// Build choice in EXACT OpenAI format
						const choiceObj: Record<string, any> = {
							index: choice.index,
							message: {
								role: choice.message.role,
								content: processedContent,
								// OpenAI required fields (must be present even if null/empty)
								refusal: (choice.message as any).refusal || null,
								annotations: (choice.message as any).annotations || [],
							},
							logprobs: (choice as any).logprobs || null,
							finish_reason: choice.finish_reason,
						};

						// Add tool_calls if present (OpenAI standard field)
						if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
							choiceObj.message.tool_calls = choice.message.tool_calls;
						}

						return choiceObj;
					}),
					usage: response.usage || {
						prompt_tokens: 0,
						completion_tokens: 0,
						total_tokens: 0,
					},
				};

				// Add system_fingerprint if available (OpenAI standard field)
				if ((response as any).system_fingerprint) {
					openAIResponse.system_fingerprint = (response as any).system_fingerprint;
				}

				returnData.push({
					json: openAIResponse,
					pairedItem: { item: i },
				});
			} catch (error) {
				if (this.continueOnFail()) {
					const errorMessage = error instanceof Error ? error.message : 'Unknown error';
					const errorString = JSON.stringify(error);

					console.error('❌ Error occurred:', errorMessage);
					console.error('❌ Error details:', errorString);

					// Clean error message - remove n8n specific information
					let cleanMessage = errorMessage;

					// Remove token information: [Token used: gho_...xxxxx]
					cleanMessage = cleanMessage.replace(/\[Token used: [^\]]+\]/g, '').trim();

					// Remove retry attempt information: [Attempt: x/x]
					cleanMessage = cleanMessage.replace(/\[Attempt: \d+\/\d+\]/g, '').trim();

					// Remove "GitHub Copilot API error:" prefix if present
					cleanMessage = cleanMessage.replace(/^GitHub Copilot API error:\s*/i, '').trim();

					// Clean up multiple spaces
					cleanMessage = cleanMessage.replace(/\s+/g, ' ').trim();

					console.log('🧹 Cleaned error message:', cleanMessage);

					// Try to extract GitHub Copilot API error if available
					let apiError: any = null;
					try {
						// Check if error has response body (from API)
						if (error && typeof error === 'object' && 'cause' in error) {
							const cause = (error as any).cause;
							if (cause && cause.error) {
								apiError = cause.error;
							}
						}
						// Check if error message contains JSON
						if (!apiError && errorString.includes('{') && errorString.includes('}')) {
							const jsonMatch = errorString.match(/\{[^{}]*"error"[^{}]*\}/);
							if (jsonMatch) {
								apiError = JSON.parse(jsonMatch[0]);
							}
						}
					} catch (parseError) {
						console.error('Failed to parse API error:', parseError);
					}

					// Check for 400 Bad Request FIRST - should NOT retry
					const lowerMessage = cleanMessage.toLowerCase();
					const is400Error =
						lowerMessage.includes('400') ||
						lowerMessage.includes('bad request') ||
						(apiError && apiError.error && apiError.error.code === 'invalid_request_body');

					if (is400Error) {
						console.log('🚫 400 Bad Request detected - throwing non-retryable error');
						throw new NodeOperationError(this.getNode(), `Bad Request (400): ${cleanMessage}`, {
							itemIndex: i,
							description:
								'The request was malformed or contains invalid parameters. Retrying will not help.',
						});
					}

					// Determine OpenAI error type and code based on error message/API error
					let errorType = 'invalid_request_error';
					let errorCode: string | null = null;
					let errorParam: string | null = null;
					let finalMessage = cleanMessage;

					// If we have API error from GitHub Copilot, use it
					if (apiError && apiError.error) {
						finalMessage = apiError.error.message || cleanMessage;
						errorType = apiError.error.type || errorType;
						errorCode = apiError.error.code || null;
						errorParam = apiError.error.param || null;
						console.log('✅ Using GitHub Copilot API error details');
					} else {
						// Fallback: detect error type from message and create clean OpenAI-style messages
						if (lowerMessage.includes('403') || lowerMessage.includes('forbidden')) {
							errorType = 'invalid_request_error';
							errorCode = 'insufficient_quota';
							// Clean message for 403 errors
							if (lowerMessage.includes('access') && lowerMessage.includes('forbidden')) {
								finalMessage =
									'You exceeded your current quota, please check your plan and billing details.';
							} else {
								finalMessage = cleanMessage;
							}
						} else if (lowerMessage.includes('max') && lowerMessage.includes('token')) {
							errorType = 'invalid_request_error';
							errorCode = 'context_length_exceeded';
							errorParam = 'max_tokens';
							finalMessage =
								"This model's maximum context length is exceeded. Please reduce the length of the messages or completion.";
						} else if (lowerMessage.includes('401') || lowerMessage.includes('unauthorized')) {
							errorType = 'invalid_request_error';
							errorCode = 'invalid_api_key';
							finalMessage =
								'Incorrect API key provided. You can find your API key at https://platform.openai.com/account/api-keys.';
						} else if (lowerMessage.includes('429') || lowerMessage.includes('rate limit')) {
							errorType = 'rate_limit_error';
							errorCode = 'rate_limit_exceeded';
							finalMessage = 'Rate limit reached. Please wait before making more requests.';
						} else if (lowerMessage.includes('timeout')) {
							errorType = 'api_error';
							errorCode = 'timeout';
							finalMessage = 'Request timeout. Please try again.';
						} else {
							errorType = 'api_error';
							errorCode = 'internal_error';
							finalMessage = cleanMessage;
						}
						console.log('⚠️ Using fallback error detection with cleaned message');
					}

					console.log('📋 Final error format:', {
						message: finalMessage,
						type: errorType,
						param: errorParam,
						code: errorCode,
					});

					// OpenAI standard error format
					returnData.push({
						json: {
							error: {
								message: finalMessage,
								type: errorType,
								param: errorParam,
								code: errorCode,
							},
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
