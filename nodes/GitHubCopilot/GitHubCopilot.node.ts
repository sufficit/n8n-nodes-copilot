import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class GitHubCopilot implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'GitHub Copilot CLI',
		name: 'gitHubCopilot',
		icon: 'file:../../shared/icons/copilot.svg',
		group: ['transform'],
		version: 2,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Interact with GitHub Copilot CLI in programmatic mode',
		defaults: {
			name: 'GitHub Copilot CLI',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'githubCopilotApi',
				required: false,
				displayOptions: {
					show: {
						useCredential: [true],
					},
				},
			},
		],
		properties: [
			{
				displayName: 'Authentication Method',
				name: 'useCredential',
				type: 'boolean',
				default: false,
				description: 'Use GitHub token (GH_TOKEN/GITHUB_TOKEN) instead of local copilot CLI authentication',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Query',
						value: 'query',
						description: 'Ask GitHub Copilot any question or task in programmatic mode',
						action: 'Query Copilot in programmatic mode',
					},
				],
				default: 'query',
			},
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				typeOptions: {
					rows: 5,
				},
				required: true,
				default: '',
				placeholder: 'Example: Show me this week\'s commits and summarize them',
				description: 'Your query or task for GitHub Copilot CLI. Will be executed with: copilot -p "your prompt"',
			},
			{
				displayName: 'Model',
				name: 'model',
				type: 'options',
				options: [
					{ name: 'Default (Claude Sonnet 4.5)', value: '' },
					{ name: 'GPT-4o', value: 'gpt-4o' },
					{ name: 'GPT-4o Mini', value: 'gpt-4o-mini' },
					{ name: 'O1', value: 'o1' },
					{ name: 'O1 Mini', value: 'o1-mini' },
					{ name: 'O1 Preview', value: 'o1-preview' },
					{ name: 'Claude Sonnet 3.5', value: 'claude-3.5-sonnet' },
					{ name: 'Claude Sonnet 4.5', value: 'claude-sonnet-4.5' },
				],
				default: '',
				description: 'Model to use. Default is Claude Sonnet 4.5. Note: Different models have different cost multipliers.',
			},
			{
				displayName: 'Tool Approval',
				name: 'toolApproval',
				type: 'options',
				options: [
					{ name: 'Allow All Tools (Unsafe)', value: 'allow-all' },
					{ name: 'Allow Shell Commands Only', value: 'shell-only' },
					{ name: 'Allow Write Operations Only', value: 'write-only' },
					{ name: 'Manual Approval Required', value: 'manual' },
					{ name: 'Custom (Advanced)', value: 'custom' },
				],
				default: 'manual',
				description: 'Which tools Copilot can use without asking. WARNING: "Allow All" is dangerous - Copilot can execute ANY command!',
			},
			{
				displayName: 'Allowed Tools',
				name: 'allowedTools',
				type: 'string',
				displayOptions: {
					show: {
						toolApproval: ['custom'],
					},
				},
				default: '',
				placeholder: '--allow-tool \'shell(git)\' --allow-tool \'write\'',
				description: 'Custom tool approval flags (space-separated). Example: --allow-tool \'shell(git)\' --deny-tool \'shell(rm)\'',
			},
			{
				displayName: 'Timeout (seconds)',
				name: 'timeout',
				type: 'number',
				default: 60,
				description: 'Maximum execution time in seconds',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		// Get Copilot CLI version once (outside loop for efficiency)
		let copilotVersionInfo: { build: string; commit: string } = { build: 'unknown', commit: 'unknown' };
		try {
			const versionResult = await execAsync('copilot --version', { timeout: 5000 });
			const versionOutput = versionResult.stdout.trim();
			// Parse version output: "0.0.373\nCommit: 1f9ed04"
			const lines = versionOutput.split('\n');
			copilotVersionInfo.build = lines[0] || 'unknown';
			const commitLine = lines.find(l => l.startsWith('Commit:'));
			copilotVersionInfo.commit = commitLine ? commitLine.replace('Commit:', '').trim() : 'unknown';
		} catch (error) {
			copilotVersionInfo = { build: 'not installed', commit: 'unknown' };
		}

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;
				const prompt = this.getNodeParameter('prompt', i) as string;			const model = this.getNodeParameter('model', i, '') as string;				const toolApproval = this.getNodeParameter('toolApproval', i) as string;
				const timeout = this.getNodeParameter('timeout', i, 60) as number;
				const useCredential = this.getNodeParameter('useCredential', i, false) as boolean;

				// Try to get token from credential only if user chose to use it
				let githubToken = '';
				let authMethod = 'Local Copilot CLI';

				if (useCredential) {
					try {
						const credentials = await this.getCredentials('githubCopilotApi');
						const token = credentials.token as string;

						if (token) {
							githubToken = token;
							authMethod = 'GitHub Token (GH_TOKEN)';
						}
					} catch {
						throw new NodeOperationError(
							this.getNode(),
							'GitHub Copilot credential is not configured. Please configure it or use Local CLI authentication.',
						);
					}
				}

				// Build tool approval flags
				let toolFlags = '';
				switch (toolApproval) {
					case 'allow-all':
						toolFlags = '--allow-all-tools';
						break;
					case 'shell-only':
						toolFlags = '--allow-tool \'shell\'';
						break;
					case 'write-only':
						toolFlags = '--allow-tool \'write\'';
						break;
					case 'custom':
						toolFlags = this.getNodeParameter('allowedTools', i, '') as string;
						break;
					case 'manual':
					default:
						toolFlags = ''; // No automatic approval
						break;
				}

				// Escape prompt for shell
				const escapedPrompt = prompt.replace(/'/g, "'\"'\"'");
				
				// Build command: copilot -p "prompt" [--model model] [tool-flags]
				const modelFlag = model ? `--model ${model}` : '';
				const command = `copilot -p '${escapedPrompt}' ${modelFlag} ${toolFlags}`.trim();

				// Execute new GitHub Copilot CLI
				console.log('Executing command:', command);
				console.log('Auth method:', authMethod);

				let stdout = '';
				let stderr = '';

				try {
					const envVars: Record<string, string> = {
						...process.env,
					} as Record<string, string>;

					// Add token if provided
					if (githubToken) {
						envVars.GH_TOKEN = githubToken;
						envVars.GITHUB_TOKEN = githubToken;
					}

					const result = await execAsync(command, {
						env: envVars,
						timeout: timeout * 1000,
						maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large outputs
					});
					stdout = result.stdout;
					stderr = result.stderr;
				} catch (execError: unknown) {
					const err = execError as { stderr?: string; stdout?: string; message?: string; code?: string };
					stderr = err.stderr || err.message || String(execError);
					stdout = err.stdout || '';
					
					// Check if it's a timeout
					if (err.code === 'ETIMEDOUT') {
						throw new NodeOperationError(
							this.getNode(),
							`Command timed out after ${timeout} seconds. Try increasing the timeout or simplifying the task.`,
						);
					}
				}

				// Handle errors
				if (stderr && !stdout) {
					if (stderr.includes('command not found: copilot') || stderr.includes('\'copilot\' is not recognized')) {
						throw new NodeOperationError(
							this.getNode(),
							'GitHub Copilot CLI not found. Please install it:\n' +
							'- npm: npm install -g @github/copilot\n' +
							'- brew: brew install copilot-cli\n' +
							'- See: https://github.com/github/copilot-cli',
						);
					} else if (stderr.includes('not logged in') || stderr.includes('authentication required')) {
						throw new NodeOperationError(
							this.getNode(),
							'Not authenticated with GitHub Copilot CLI. Please run: copilot (and use /login command)\n' +
							'Or provide a GitHub token via credential.',
						);
					} else {
						throw new NodeOperationError(
							this.getNode(),
							`Copilot CLI error: ${stderr}`,
						);
					}
				}

				returnData.push({
					json: {
						operation,
						prompt,
						model: model || 'claude-sonnet-4.5',
						toolApproval,
						authMethod,
						copilotVersion: copilotVersionInfo,
						output: stdout,
						stderr: stderr || undefined,
						timestamp: new Date().toISOString(),
					},
					pairedItem: { item: i },
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error instanceof Error ? error.message : String(error),
							operation: 'query',
							copilotVersion: copilotVersionInfo,
							prompt: this.getNodeParameter('prompt', i, ''),
							timestamp: new Date().toISOString(),
						},
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
