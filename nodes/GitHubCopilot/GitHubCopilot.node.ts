import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeConnectionType,
  NodeOperationError,
} from "n8n-workflow";

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Function to filter GitHub Copilot CLI output
function filterCopilotOutput(rawOutput: string): string {
  const lines = rawOutput.split("\n");
  let startIndex = -1;
  const endIndex = lines.length;

  // Find the start of the actual content (after the header)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Look for lines that indicate the start of actual content
    if (
      line.includes("# Explanation:") ||
			line.includes("# Suggestion:") ||
			line.includes("# Command:") ||
			line.includes("# Code:") ||
			(line.startsWith("•") && i > 5)
    ) {
      startIndex = i;
      break;
    }
  }

  // If no clear start marker found, try to find content after version info
  if (startIndex === -1) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.includes("version ") && line.includes("(") && line.includes(")")) {
        // Skip a few more lines after version
        startIndex = i + 3;
        break;
      }
    }
  }

  // If still no start found, look for first substantial content line
  if (startIndex === -1) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.length > 10 && !line.includes("Welcome to") && !line.includes("powered by AI")) {
        startIndex = i;
        break;
      }
    }
  }

  // Extract the filtered content
  if (startIndex >= 0) {
    const filteredLines = lines.slice(startIndex, endIndex);
    return filteredLines.join("\n").trim();
  }

  // Fallback: return original if no filtering pattern found
  return rawOutput.trim();
}

export class GitHubCopilot implements INodeType {
  description: INodeTypeDescription = {
    displayName: "GitHub Copilot",
    name: "gitHubCopilot",
    icon: "file:../../shared/icons/copilot.svg",
    group: ["transform"],
    version: 1,
    subtitle: "={{$parameter[\"operation\"]}}",
    description: "Use GitHub Copilot CLI for AI-powered code suggestions and explanations",
    defaults: {
      name: "GitHub Copilot",
    },
    inputs: [NodeConnectionType.Main],
    outputs: [NodeConnectionType.Main],
    credentials: [
      {
        name: "githubCopilotApi",
        required: false,
        displayOptions: {
          show: {
            useCredential: [true],
            credentialType: ["githubCopilotApi"],
          },
        },
      },
      {
        name: "githubCopilotOAuth2Api",
        required: false,
        displayOptions: {
          show: {
            useCredential: [true],
            credentialType: ["githubCopilotOAuth2Api"],
          },
        },
      },
    ],
    properties: [
      {
        displayName: "Authentication Method",
        name: "useCredential",
        type: "boolean",
        default: false,
        description: "Use GitHub Copilot API credential instead of local GitHub CLI authentication",
      },
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
        displayOptions: {
          show: {
            useCredential: [true],
          },
        },
      },
      {
        displayName: "Operation",
        name: "operation",
        type: "options",
        noDataExpression: true,
        options: [
          {
            name: "Suggest",
            value: "suggest",
            description: "Get code suggestions from GitHub Copilot",
            action: "Get code suggestions",
          },
          {
            name: "Explain",
            value: "explain",
            description: "Explain code or commands using GitHub Copilot",
            action: "Explain code or commands",
          },
          {
            name: "Shell",
            value: "shell",
            description: "Get shell command suggestions from GitHub Copilot",
            action: "Get shell command suggestions",
          },
          {
            name: "Revise",
            value: "revise",
            description: "Revise and improve existing code or commands",
            action: "Revise code or commands",
          },
          {
            name: "Rate Response",
            value: "rating",
            description: "Rate a previous GitHub Copilot response",
            action: "Rate response",
          },
        ],
        default: "suggest",
      },
      {
        displayName: "Prompt",
        name: "prompt",
        type: "string",
        typeOptions: {
          rows: 3,
        },
        required: true,
        default: "",
        placeholder: "Enter your request...",
        description: "What you want GitHub Copilot to help with",
      },
      {
        displayName: "Filter Output",
        name: "filterOutput",
        type: "boolean",
        default: true,
        description:
					"Remove GitHub Copilot CLI header and footer, keeping only the useful response",
      },
      {
        displayName: "Language",
        name: "language",
        type: "options",
        displayOptions: {
          show: {
            operation: ["suggest"],
          },
        },
        options: [
          { name: "JavaScript", value: "javascript" },
          { name: "TypeScript", value: "typescript" },
          { name: "Python", value: "python" },
          { name: "Java", value: "java" },
          { name: "C#", value: "csharp" },
          { name: "C++", value: "cpp" },
          { name: "Go", value: "go" },
          { name: "Rust", value: "rust" },
          { name: "PHP", value: "php" },
          { name: "Ruby", value: "ruby" },
          { name: "Shell", value: "shell" },
          { name: "SQL", value: "sql" },
          { name: "Other", value: "other" },
        ],
        default: "javascript",
        description: "Programming language for code suggestions",
      },
      {
        displayName: "Command Type",
        name: "commandType",
        type: "options",
        displayOptions: {
          show: {
            operation: ["shell"],
          },
        },
        options: [
          { name: "General", value: "general" },
          { name: "Git", value: "git" },
          { name: "Docker", value: "docker" },
          { name: "npm/yarn", value: "npm" },
          { name: "File Operations", value: "file" },
        ],
        default: "general",
        description: "Type of shell commands to suggest",
      },
      {
        displayName: "Additional Context",
        name: "context",
        type: "string",
        typeOptions: {
          rows: 2,
        },
        default: "",
        placeholder: "Any additional context or constraints...",
        description: "Optional additional context to provide better suggestions",
      },
      {
        displayName: "Original Code/Command",
        name: "originalCode",
        type: "string",
        typeOptions: {
          rows: 4,
        },
        required: true,
        default: "",
        placeholder: "Enter the original code or command to revise...",
        description: "The original code or command that you want to improve",
        displayOptions: {
          show: {
            operation: ["revise"],
          },
        },
      },
      {
        displayName: "Rating",
        name: "rating",
        type: "options",
        options: [
          { name: "Very Good", value: "very-good" },
          { name: "Good", value: "good" },
          { name: "Fair", value: "fair" },
          { name: "Poor", value: "poor" },
        ],
        required: true,
        default: "good",
        description: "Rate the GitHub Copilot response",
        displayOptions: {
          show: {
            operation: ["rating"],
          },
        },
      },
      {
        displayName: "Response to Rate",
        name: "responseToRate",
        type: "string",
        typeOptions: {
          rows: 3,
        },
        required: true,
        default: "",
        placeholder: "Enter the GitHub Copilot response you want to rate...",
        description: "The GitHub Copilot response that you want to rate",
        displayOptions: {
          show: {
            operation: ["rating"],
          },
        },
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const operation = this.getNodeParameter("operation", i) as string;
        const prompt = this.getNodeParameter("prompt", i) as string;
        const context = this.getNodeParameter("context", i, "") as string;
        const useCredential = this.getNodeParameter("useCredential", i, false) as boolean;

        // Try to get token from credential only if user chose to use it
        let githubToken = "";
        let authMethod = "Local CLI";

        if (useCredential) {
          try {
            const credentialType = this.getNodeParameter(
              "credentialType",
              i,
              "githubCopilotApi",
            ) as string;
            const credentials = await this.getCredentials(credentialType);

            // OAuth2 credentials might have different property names
            const token = (credentials.accessToken ||
							credentials.access_token ||
							(credentials.oauthTokenData as Record<string, unknown>)?.access_token ||
							credentials.token) as string;

            if (token) {
              githubToken = token;
              authMethod = `GitHub Copilot ${
                credentialType === "githubCopilotOAuth2Api" ? "OAuth2" : "API"
              } Credential`;
            }
          } catch (error) {
            // Credential not configured but user wanted to use it
            throw new NodeOperationError(
              this.getNode(),
              "GitHub Copilot credential is not configured. Please configure it or use Local CLI authentication.",
            );
          }
        }

        // Determine authentication method
        const useToken = githubToken && githubToken.trim() !== "";

        let command: string;
        let fullPrompt = prompt;

        // Add context if provided
        if (context) {
          fullPrompt = `${prompt}\n\nAdditional context: ${context}`;
        }

        // Build the appropriate GitHub Copilot CLI command
        switch (operation) {
        case "suggest": {
          const language = this.getNodeParameter("language", i) as string;
          if (language !== "other") {
            fullPrompt = `[${language}] ${fullPrompt}`;
          }
          // Use single quotes and escape any single quotes in the prompt
          const escapedSuggestPrompt = fullPrompt.replace(/'/g, "'\"'\"'");
          command = `gh copilot suggest '${escapedSuggestPrompt}'`;
          break;
        }

        case "explain": {
          // Use single quotes and escape any single quotes in the prompt
          const escapedExplainPrompt = fullPrompt.replace(/'/g, "'\"'\"'");
          command = `gh copilot explain '${escapedExplainPrompt}'`;
          break;
        }

        case "shell": {
          const commandType = this.getNodeParameter("commandType", i) as string;
          let shellPrompt = fullPrompt;

          switch (commandType) {
          case "git":
            shellPrompt = `git: ${fullPrompt}`;
            break;
          case "docker":
            shellPrompt = `docker: ${fullPrompt}`;
            break;
          case "npm":
            shellPrompt = `npm/yarn: ${fullPrompt}`;
            break;
          case "file":
            shellPrompt = `file operations: ${fullPrompt}`;
            break;
          default:
            shellPrompt = fullPrompt;
          }

          // Use single quotes and escape any single quotes in the prompt
          const escapedShellPrompt = shellPrompt.replace(/'/g, "'\"'\"'");
          command = `gh copilot suggest '${escapedShellPrompt}' --type shell`;
          break;
        }

        case "revise": {
          const originalCode = this.getNodeParameter("originalCode", i) as string;
          const revisePrompt = `${fullPrompt}\n\nOriginal code/command:\n${originalCode}`;
          const escapedRevisePrompt = revisePrompt.replace(/'/g, "'\"'\"'");
          command = `gh copilot revise '${escapedRevisePrompt}'`;
          break;
        }

        case "rating": {
          const rating = this.getNodeParameter("rating", i) as string;
          const responseToRate = this.getNodeParameter("responseToRate", i) as string;
          const escapedResponseToRate = responseToRate.replace(/'/g, "'\"'\"'");
          command = `gh copilot rate '${escapedResponseToRate}' --rating ${rating}`;
          break;
        }

        default:
          throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
        }

        // Execute GitHub Copilot CLI command
        console.log("Executing command:", command);
        console.log("Auth method:", authMethod);
        console.log("Using token:", useToken ? "Yes (Manual)" : "No (Local CLI)");

        let stdout = "";
        let stderr = "";

        try {
          const envVars: Record<string, string> = {
            ...process.env,
          } as Record<string, string>;

          // Only add token if provided
          if (useToken) {
            envVars.GH_TOKEN = githubToken;
            envVars.GITHUB_TOKEN = githubToken;
          }

          const result = await execAsync(command, {
            env: envVars,
            timeout: 30000, // 30 second timeout
            maxBuffer: 1024 * 1024, // 1MB buffer
          });
          stdout = result.stdout;
          stderr = result.stderr;
        } catch (execError: unknown) {
          const err = execError as { stderr?: string; stdout?: string; message?: string };
          stderr = err.stderr || err.message || String(execError);
          stdout = err.stdout || "";
        }

        // Handle specific GitHub Copilot errors
        if (stderr) {
          const debugInfo = useToken
            ? ` [Using manual token: ${githubToken.substring(0, 4)}...]`
            : " [Using local CLI authentication]";

          if (stderr.includes("internal server error") || stderr.includes("code: 500")) {
            throw new NodeOperationError(
              this.getNode(),
              `GitHub Copilot service is temporarily unavailable (HTTP 500). This is a GitHub server issue. Please try again in a few moments.${debugInfo} Error: ${stderr}`,
            );
          } else if (stderr.includes("code: 400") || stderr.includes("Bad Request")) {
            throw new NodeOperationError(
              this.getNode(),
              `GitHub Copilot request failed (HTTP 400). The request is malformed or invalid.${debugInfo} Full error response: ${stderr}`,
            );
          } else if (
            stderr.includes("401") ||
						stderr.includes("Unauthorized") ||
						stderr.includes("Bad credentials")
          ) {
            const tokenHelp = useToken
              ? " IMPORTANT: Only tokens generated by \"gh auth token\" command work with Copilot. Personal Access Tokens from GitHub website DO NOT work. Try: run \"gh auth login\" first, then use \"gh auth token\" to get a working token."
              : " Please run \"gh auth login\" on the server first, or provide a token generated by \"gh auth token\" command.";
            throw new NodeOperationError(
              this.getNode(),
              `GitHub authentication failed (HTTP 401).${tokenHelp}${debugInfo} Full error response: ${stderr}`,
            );
          } else if (stderr.includes("403") || stderr.includes("Forbidden")) {
            throw new NodeOperationError(
              this.getNode(),
              `GitHub Copilot access denied (HTTP 403). Please ensure your account has Copilot subscription.${debugInfo} Full error response: ${stderr}`,
            );
          } else if (!stdout) {
            throw new NodeOperationError(
              this.getNode(),
              `GitHub Copilot CLI error:${debugInfo} Full error response: ${stderr}`,
            );
          }
        }

        // Filter output if requested
        const filterOutput = this.getNodeParameter("filterOutput", i, true) as boolean;
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
            tokenPrefix: useToken ? githubToken.substring(0, 4) + "..." : "none",
            language: operation === "suggest" ? this.getNodeParameter("language", i) : undefined,
            commandType:
							operation === "shell" ? this.getNodeParameter("commandType", i) : undefined,
            originalCode:
							operation === "revise" ? this.getNodeParameter("originalCode", i) : undefined,
            rating: operation === "rating" ? this.getNodeParameter("rating", i) : undefined,
            responseToRate:
							operation === "rating" ? this.getNodeParameter("responseToRate", i) : undefined,
            output: processedOutput,
            cliRawOutput: stdout,
            cliStderr: stderr || undefined,
            timestamp: new Date().toISOString(),
          },
          pairedItem: { item: i },
        });
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              error: error instanceof Error ? error.message : String(error),
              operation: this.getNodeParameter("operation", i, "unknown"),
              prompt: this.getNodeParameter("prompt", i, ""),
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
