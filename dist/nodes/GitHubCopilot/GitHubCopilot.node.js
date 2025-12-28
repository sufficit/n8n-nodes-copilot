"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHubCopilot = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
function filterCopilotOutput(rawOutput) {
    const lines = rawOutput.split('\n');
    let startIndex = -1;
    const endIndex = lines.length;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.includes('# Explanation:') ||
            line.includes('# Suggestion:') ||
            line.includes('# Command:') ||
            line.includes('# Code:') ||
            (line.startsWith('•') && i > 5)) {
            startIndex = i;
            break;
        }
    }
    if (startIndex === -1) {
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.includes('version ') && line.includes('(') && line.includes(')')) {
                startIndex = i + 3;
                break;
            }
        }
    }
    if (startIndex === -1) {
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.length > 10 && !line.includes('Welcome to') && !line.includes('powered by AI')) {
                startIndex = i;
                break;
            }
        }
    }
    if (startIndex >= 0) {
        const filteredLines = lines.slice(startIndex, endIndex);
        return filteredLines.join('\n').trim();
    }
    return rawOutput.trim();
}
class GitHubCopilot {
    constructor() {
        this.description = {
            displayName: 'GitHub Copilot',
            name: 'gitHubCopilot',
            icon: 'file:../../shared/icons/copilot.svg',
            group: ['transform'],
            version: 1,
            subtitle: '',
            description: 'Interact with GitHub Copilot API for code completions',
            defaults: {
                name: 'GitHub Copilot',
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
                    description: 'Use GitHub Copilot API credential instead of local GitHub CLI authentication',
                },
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    options: [
                        {
                            name: 'Suggest',
                            value: 'suggest',
                            description: 'Get code suggestions from GitHub Copilot',
                            action: 'Get code suggestions',
                        },
                        {
                            name: 'Explain',
                            value: 'explain',
                            description: 'Explain code or commands using GitHub Copilot',
                            action: 'Explain code or commands',
                        },
                        {
                            name: 'Shell',
                            value: 'shell',
                            description: 'Get shell command suggestions from GitHub Copilot',
                            action: 'Get shell command suggestions',
                        },
                        {
                            name: 'Revise',
                            value: 'revise',
                            description: 'Revise and improve existing code or commands',
                            action: 'Revise code or commands',
                        },
                        {
                            name: 'Rate Response',
                            value: 'rating',
                            description: 'Rate a previous GitHub Copilot response',
                            action: 'Rate response',
                        },
                    ],
                    default: 'suggest',
                },
                {
                    displayName: 'Prompt',
                    name: 'prompt',
                    type: 'string',
                    typeOptions: {
                        rows: 3,
                    },
                    required: true,
                    default: '',
                    placeholder: 'Enter your request...',
                    description: 'What you want GitHub Copilot to help with',
                },
                {
                    displayName: 'Filter Output',
                    name: 'filterOutput',
                    type: 'boolean',
                    default: true,
                    description: 'Remove GitHub Copilot CLI header and footer, keeping only the useful response',
                },
                {
                    displayName: 'Language',
                    name: 'language',
                    type: 'options',
                    displayOptions: {
                        show: {
                            operation: ['suggest'],
                        },
                    },
                    options: [
                        { name: 'JavaScript', value: 'javascript' },
                        { name: 'TypeScript', value: 'typescript' },
                        { name: 'Python', value: 'python' },
                        { name: 'Java', value: 'java' },
                        { name: 'C#', value: 'csharp' },
                        { name: 'C++', value: 'cpp' },
                        { name: 'Go', value: 'go' },
                        { name: 'Rust', value: 'rust' },
                        { name: 'PHP', value: 'php' },
                        { name: 'Ruby', value: 'ruby' },
                        { name: 'Shell', value: 'shell' },
                        { name: 'SQL', value: 'sql' },
                        { name: 'Other', value: 'other' },
                    ],
                    default: 'javascript',
                    description: 'Programming language for code suggestions',
                },
                {
                    displayName: 'Command Type',
                    name: 'commandType',
                    type: 'options',
                    displayOptions: {
                        show: {
                            operation: ['shell'],
                        },
                    },
                    options: [
                        { name: 'General', value: 'general' },
                        { name: 'Git', value: 'git' },
                        { name: 'Docker', value: 'docker' },
                        { name: 'npm/yarn', value: 'npm' },
                        { name: 'File Operations', value: 'file' },
                    ],
                    default: 'general',
                    description: 'Type of shell commands to suggest',
                },
                {
                    displayName: 'Additional Context',
                    name: 'context',
                    type: 'string',
                    typeOptions: {
                        rows: 2,
                    },
                    default: '',
                    placeholder: 'Any additional context or constraints...',
                    description: 'Optional additional context to provide better suggestions',
                },
                {
                    displayName: 'Original Code/Command',
                    name: 'originalCode',
                    type: 'string',
                    typeOptions: {
                        rows: 4,
                    },
                    required: true,
                    default: '',
                    placeholder: 'Enter the original code or command to revise...',
                    description: 'The original code or command that you want to improve',
                    displayOptions: {
                        show: {
                            operation: ['revise'],
                        },
                    },
                },
                {
                    displayName: 'Rating',
                    name: 'rating',
                    type: 'options',
                    options: [
                        { name: 'Very Good', value: 'very-good' },
                        { name: 'Good', value: 'good' },
                        { name: 'Fair', value: 'fair' },
                        { name: 'Poor', value: 'poor' },
                    ],
                    required: true,
                    default: 'good',
                    description: 'Rate the GitHub Copilot response',
                    displayOptions: {
                        show: {
                            operation: ['rating'],
                        },
                    },
                },
                {
                    displayName: 'Response to Rate',
                    name: 'responseToRate',
                    type: 'string',
                    typeOptions: {
                        rows: 3,
                    },
                    required: true,
                    default: '',
                    placeholder: 'Enter the GitHub Copilot response you want to rate...',
                    description: 'The GitHub Copilot response that you want to rate',
                    displayOptions: {
                        show: {
                            operation: ['rating'],
                        },
                    },
                },
            ],
        };
    }
    async execute() {
        const items = this.getInputData();
        const returnData = [];
        for (let i = 0; i < items.length; i++) {
            try {
                const operation = this.getNodeParameter('operation', i);
                const prompt = this.getNodeParameter('prompt', i);
                const context = this.getNodeParameter('context', i, '');
                const useCredential = this.getNodeParameter('useCredential', i, false);
                let githubToken = '';
                let authMethod = 'Local CLI';
                if (useCredential) {
                    try {
                        const credentials = await this.getCredentials('githubCopilotApi');
                        const token = credentials.token;
                        if (token) {
                            githubToken = token;
                            authMethod = 'GitHub Copilot API Credential';
                        }
                    }
                    catch {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'GitHub Copilot credential is not configured. Please configure it or use Local CLI authentication.');
                    }
                }
                const useToken = githubToken && githubToken.trim() !== '';
                let command;
                let fullPrompt = prompt;
                if (context) {
                    fullPrompt = `${prompt}\n\nAdditional context: ${context}`;
                }
                switch (operation) {
                    case 'suggest': {
                        const language = this.getNodeParameter('language', i);
                        if (language !== 'other') {
                            fullPrompt = `[${language}] ${fullPrompt}`;
                        }
                        const escapedSuggestPrompt = fullPrompt.replace(/'/g, "'\"'\"'");
                        command = `gh copilot suggest '${escapedSuggestPrompt}'`;
                        break;
                    }
                    case 'explain': {
                        const escapedExplainPrompt = fullPrompt.replace(/'/g, "'\"'\"'");
                        command = `gh copilot explain '${escapedExplainPrompt}'`;
                        break;
                    }
                    case 'shell': {
                        const commandType = this.getNodeParameter('commandType', i);
                        let shellPrompt = fullPrompt;
                        switch (commandType) {
                            case 'git':
                                shellPrompt = `git: ${fullPrompt}`;
                                break;
                            case 'docker':
                                shellPrompt = `docker: ${fullPrompt}`;
                                break;
                            case 'npm':
                                shellPrompt = `npm/yarn: ${fullPrompt}`;
                                break;
                            case 'file':
                                shellPrompt = `file operations: ${fullPrompt}`;
                                break;
                            default:
                                shellPrompt = fullPrompt;
                        }
                        const escapedShellPrompt = shellPrompt.replace(/'/g, "'\"'\"'");
                        command = `gh copilot suggest '${escapedShellPrompt}' --type shell`;
                        break;
                    }
                    case 'revise': {
                        const originalCode = this.getNodeParameter('originalCode', i);
                        const revisePrompt = `${fullPrompt}\n\nOriginal code/command:\n${originalCode}`;
                        const escapedRevisePrompt = revisePrompt.replace(/'/g, "'\"'\"'");
                        command = `gh copilot revise '${escapedRevisePrompt}'`;
                        break;
                    }
                    case 'rating': {
                        const rating = this.getNodeParameter('rating', i);
                        const responseToRate = this.getNodeParameter('responseToRate', i);
                        const escapedResponseToRate = responseToRate.replace(/'/g, "'\"'\"'");
                        command = `gh copilot rate '${escapedResponseToRate}' --rating ${rating}`;
                        break;
                    }
                    default:
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
                }
                console.log('Executing command:', command);
                console.log('Auth method:', authMethod);
                console.log('Using token:', useToken ? 'Yes (Manual)' : 'No (Local CLI)');
                let stdout = '';
                let stderr = '';
                try {
                    const envVars = {
                        ...process.env,
                    };
                    if (useToken) {
                        envVars.GH_TOKEN = githubToken;
                        envVars.GITHUB_TOKEN = githubToken;
                    }
                    const result = await execAsync(command, {
                        env: envVars,
                        timeout: 30000,
                        maxBuffer: 1024 * 1024,
                    });
                    stdout = result.stdout;
                    stderr = result.stderr;
                }
                catch (execError) {
                    const err = execError;
                    stderr = err.stderr || err.message || String(execError);
                    stdout = err.stdout || '';
                }
                if (stderr) {
                    const debugInfo = useToken
                        ? ` [Using manual token: ${githubToken.substring(0, 4)}...]`
                        : ' [Using local CLI authentication]';
                    if (stderr.includes('internal server error') || stderr.includes('code: 500')) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GitHub Copilot service is temporarily unavailable (HTTP 500). This is a GitHub server issue. Please try again in a few moments.${debugInfo} Error: ${stderr}`);
                    }
                    else if (stderr.includes('code: 400') || stderr.includes('Bad Request')) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GitHub Copilot request failed (HTTP 400). The request is malformed or invalid.${debugInfo} Full error response: ${stderr}`);
                    }
                    else if (stderr.includes('401') ||
                        stderr.includes('Unauthorized') ||
                        stderr.includes('Bad credentials')) {
                        const tokenHelp = useToken
                            ? ' IMPORTANT: Only tokens generated by "gh auth token" command work with Copilot. Personal Access Tokens from GitHub website DO NOT work. Try: run "gh auth login" first, then use "gh auth token" to get a working token.'
                            : ' Please run "gh auth login" on the server first, or provide a token generated by "gh auth token" command.';
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GitHub authentication failed (HTTP 401).${tokenHelp}${debugInfo} Full error response: ${stderr}`);
                    }
                    else if (stderr.includes('403') || stderr.includes('Forbidden')) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GitHub Copilot access denied (HTTP 403). Please ensure your account has Copilot subscription.${debugInfo} Full error response: ${stderr}`);
                    }
                    else if (!stdout) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GitHub Copilot CLI error:${debugInfo} Full error response: ${stderr}`);
                    }
                }
                const filterOutput = this.getNodeParameter('filterOutput', i, true);
                let processedOutput = stdout;
                if (filterOutput) {
                    processedOutput = filterCopilotOutput(stdout);
                }
                returnData.push({
                    json: {
                        operation,
                        prompt: prompt,
                        context: context || undefined,
                        authMethod: authMethod,
                        tokenUsed: useToken,
                        tokenPrefix: useToken ? githubToken.substring(0, 4) + '...' : 'none',
                        language: operation === 'suggest' ? this.getNodeParameter('language', i) : undefined,
                        commandType: operation === 'shell' ? this.getNodeParameter('commandType', i) : undefined,
                        originalCode: operation === 'revise' ? this.getNodeParameter('originalCode', i) : undefined,
                        rating: operation === 'rating' ? this.getNodeParameter('rating', i) : undefined,
                        responseToRate: operation === 'rating' ? this.getNodeParameter('responseToRate', i) : undefined,
                        output: processedOutput,
                        cliRawOutput: stdout,
                        cliStderr: stderr || undefined,
                        timestamp: new Date().toISOString(),
                    },
                    pairedItem: { item: i },
                });
            }
            catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({
                        json: {
                            error: error instanceof Error ? error.message : String(error),
                            operation: this.getNodeParameter('operation', i, 'unknown'),
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
exports.GitHubCopilot = GitHubCopilot;
