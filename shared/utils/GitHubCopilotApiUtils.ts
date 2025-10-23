import { IExecuteFunctions } from "n8n-workflow";
import { GITHUB_COPILOT_API } from "./GitHubCopilotEndpoints";
import { OAuthTokenManager } from "./OAuthTokenManager";
import { DynamicModelsManager } from "./DynamicModelsManager";

// Interface for OAuth2 credentials
interface OAuth2Credentials {
    accessToken?: string;
    access_token?: string;
    token?: string;
    oauthTokenData?: {
        access_token?: string;
    };
    [key: string]: unknown;
}

// GitHub Copilot API Response interface
export interface CopilotResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Array<{
        index: number;
        message: {
            role: string;
            content: string;
            tool_calls?: Array<{
                id: string;
                type: string;
                function: {
                    name: string;
                    arguments: string;
                };
            }>;
            [key: string]: unknown; // Allow additional fields from GitHub Copilot (like 'padding')
        };
        finish_reason: string;
    }>;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
    // Retry metadata (added by wrapper)
    _retryMetadata?: {
        attempts: number;
        retries: number;
        succeeded: boolean;
    };
}

/**
 * Retry configuration for GitHub Copilot API requests
 */
export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Base delay in milliseconds between retries (default: 500ms, uses exponential backoff) */
  baseDelay?: number;
  /** Whether to retry on 403 errors (default: true) */
  retryOn403?: boolean;
}

/**
 * Makes an API request to GitHub Copilot API
 * Works with both OAuth2 and manual token credentials
 * @param context - n8n execution context
 * @param endpoint - API endpoint path
 * @param body - Request body
 * @param hasMedia - Whether request contains media (images/audio)
 * @param retryConfig - Optional retry configuration for handling intermittent failures
 */
export async function makeGitHubCopilotRequest(
  context: IExecuteFunctions, 
  endpoint: string, 
  body: Record<string, unknown>,
  hasMedia = false,
  retryConfig?: RetryConfig
): Promise<CopilotResponse> {
  // Default retry configuration
  const MAX_RETRIES = retryConfig?.maxRetries ?? 3;
  const BASE_DELAY = retryConfig?.baseDelay ?? 500;
  const RETRY_ON_403 = retryConfig?.retryOn403 ?? true;
  // Determine credential type dynamically
  let credentialType = "githubCopilotApi"; // default
  try {
    credentialType = context.getNodeParameter("credentialType", 0, "githubCopilotApi") as string;
  } catch {
    // If credentialType parameter doesn't exist, use default
    console.log("🔍 No credentialType parameter found, using default: githubCopilotApi");
  }

  // Get credentials based on type
  const credentials = await context.getCredentials(credentialType) as OAuth2Credentials;
    
  // Debug: Log credential structure for OAuth2
  console.log(`🔍 ${credentialType} Credentials Debug:`, Object.keys(credentials));
  
  // Get GitHub token and auto-generate OAuth token
  const githubToken = credentials.token as string;
  
  if (!githubToken) {
    throw new Error("GitHub token not found in credentials");
  }
  
  // Validate GitHub token format (ghu_*, github_pat_*, or gho_*)
  if (!githubToken.startsWith("ghu_") && !githubToken.startsWith("github_pat_") && !githubToken.startsWith("gho_")) {
    throw new Error("Invalid GitHub token format. Must start with ghu_, github_pat_, or gho_");
  }
  
  console.log(`🔄 Using GitHub token to generate OAuth token...`);
  
  let token: string;
  try {
    // Auto-generate OAuth token (uses cache if still valid)
    token = await OAuthTokenManager.getValidOAuthToken(githubToken);
    console.log(`✅ OAuth token ready (auto-generated from GitHub token)`);
    
    // Fetch available models in background (don't block the request)
    DynamicModelsManager.getAvailableModels(token)
      .then((models) => {
        console.log(`✅ Models list updated: ${models.length} models available`);
      })
      .catch((error) => {
        console.warn(`⚠️ Failed to update models list: ${error instanceof Error ? error.message : String(error)}`);
      });
  } catch (error) {
    throw new Error(
      `Failed to generate OAuth token: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  // Validate OAuth2 token exists
  if (!token) {
    console.error(`❌ Available ${credentialType} credential properties:`, Object.keys(credentials));
    console.error(`❌ Full ${credentialType} credential object:`, JSON.stringify(credentials, null, 2));
    throw new Error(`GitHub Copilot: No access token found in ${credentialType} credentials. Available properties: ` + Object.keys(credentials).join(", "));
  }

  // Debug: Show token info for troubleshooting
  const tokenPrefix = token.substring(0, Math.min(4, token.indexOf("_") + 1)) || token.substring(0, 4);
  const tokenSuffix = token.substring(Math.max(0, token.length - 5));
  console.log(`🔍 GitHub Copilot ${credentialType} Debug: Using token ${tokenPrefix}...${tokenSuffix}`);
    
  // Note: GitHub Copilot accepts different token formats
  if (!token.startsWith("gho_") && !token.startsWith("ghu_") && !token.startsWith("github_pat_")) {
    console.warn(`⚠️ Unexpected token format: ${tokenPrefix}...${tokenSuffix}. Trying API call anyway.`);
  }
    
  // Prepare headers using centralized configuration
  const headers: Record<string, string> = {
    ...GITHUB_COPILOT_API.HEADERS.WITH_AUTH(token),
    // Add VS Code client headers for better compatibility and reduced 403 errors
    "User-Agent": "GitHub-Copilot/1.0 (n8n-node)",
    // Note: X-GitHub-Api-Version removed - causes "invalid apiVersion" errors
    "Editor-Version": "vscode/1.95.0",
    "Editor-Plugin-Version": "copilot/1.0.0",
  };

  // Add required headers for vision/audio requests
  if (hasMedia) {
    headers["Copilot-Vision-Request"] = "true";
    headers["Copilot-Media-Request"] = "true";
  }
    
  const options = {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  };

  // Use centralized endpoint construction
  const fullUrl = `${GITHUB_COPILOT_API.BASE_URL}${endpoint}`;
  
  // Retry logic for 403 errors (GitHub Copilot intermittent issues)
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(fullUrl, options);
      
      // If we get a 403, retry (unless it's the last attempt)
      if (response.status === 403 && RETRY_ON_403 && attempt < MAX_RETRIES) {
        const delayMs = BASE_DELAY * Math.pow(2, attempt - 1);
        // Add small random jitter (0-20%) to avoid thundering herd
        const jitter = Math.random() * delayMs * 0.2;
        const totalDelay = Math.floor(delayMs + jitter);
        console.warn(`⚠️ GitHub Copilot API 403 error on attempt ${attempt}/${MAX_RETRIES}. Retrying in ${totalDelay}ms...`);
        // Wait before retrying (exponential backoff with jitter)
        await new Promise(resolve => setTimeout(resolve, totalDelay));
        continue;
      }
      
      if (!response.ok) {
        const errorText = await response.text();

        // Check for 400 Bad Request - should NOT retry
        if (response.status === 400) {
          console.log(`🚫 400 Bad Request detected - not retrying`);
          const enhancedError = `GitHub Copilot API error: ${response.status} ${response.statusText}. ${errorText}`;
          throw new Error(enhancedError);
        }

        // Secure token display - show only prefix and last 5 characters
        const tokenPrefix = token.substring(0, 4);
        const tokenSuffix = token.substring(token.length - 5);
        const tokenInfo = `${tokenPrefix}...${tokenSuffix}`;

        console.error(`❌ GitHub Copilot API Error: ${response.status} ${response.statusText}`);
        console.error(`❌ Error details: ${errorText}`);
        console.error(`❌ Used credential type: ${credentialType}`);
        console.error(`❌ Token format used: ${tokenInfo}`);
        console.error(`❌ Attempt: ${attempt}/${MAX_RETRIES}`);

        // Enhanced error message with secure token info
        const enhancedError = `GitHub Copilot API error: ${response.status} ${response.statusText}. ${errorText} [Token used: ${tokenInfo}] [Attempt: ${attempt}/${MAX_RETRIES}]`;

        throw new Error(enhancedError);
      }
      
      // Success! Return the response with retry metadata
      if (attempt > 1) {
        console.log(`✅ GitHub Copilot API succeeded on attempt ${attempt}/${MAX_RETRIES}`);
      }
      
      const responseData = await response.json() as CopilotResponse;
      
      // Add retry metadata to response
      responseData._retryMetadata = {
        attempts: attempt,
        retries: attempt - 1,
        succeeded: true
      };
      
      return responseData;
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // If it's not the last attempt and it's a network/timeout error, retry
      if (attempt < MAX_RETRIES) {
        const delayMs = BASE_DELAY * Math.pow(2, attempt - 1);
        // Add small random jitter (0-20%) to avoid thundering herd
        const jitter = Math.random() * delayMs * 0.2;
        const totalDelay = Math.floor(delayMs + jitter);
        console.warn(`⚠️ GitHub Copilot API error on attempt ${attempt}/${MAX_RETRIES}: ${lastError.message}. Retrying in ${totalDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, totalDelay));
        continue;
      }
      
      // Last attempt failed, throw the error
      throw lastError;
    }
  }
  
  // Should never reach here, but just in case
  throw lastError || new Error("GitHub Copilot API request failed after all retries");
}

/**
 * Utility functions for file handling (shared between nodes)
 */
export async function downloadFileFromUrl(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download file from URL: ${response.status} ${response.statusText}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

export async function getFileFromBinary(
  context: IExecuteFunctions, 
  itemIndex: number, 
  propertyName: string
): Promise<Buffer> {
  const items = context.getInputData();
  const item = items[itemIndex];
    
  if (!item.binary || !item.binary[propertyName]) {
    throw new Error(`No binary data found in property "${propertyName}"`);
  }
    
  const binaryData = item.binary[propertyName];
    
  if (binaryData.data) {
    // Data is base64 encoded
    return Buffer.from(binaryData.data, "base64");
  } else if (binaryData.id) {
    // Data is in binary data manager
    return await context.helpers.getBinaryDataBuffer(itemIndex, propertyName);
  } else {
    throw new Error(`Invalid binary data format in property "${propertyName}"`);
  }
}

export function getImageMimeType(filename: string): string {
  const ext = filename.toLowerCase().split(".").pop();
  switch (ext) {
  case "jpg":
  case "jpeg":
    return "image/jpeg";
  case "png":
    return "image/png";
  case "webp":
    return "image/webp";
  case "gif":
    return "image/gif";
  default:
    return "image/jpeg";
  }
}

export function getAudioMimeType(filename: string): string {
  const ext = filename.toLowerCase().split(".").pop();
  switch (ext) {
  case "mp3":
    return "audio/mpeg";
  case "wav":
    return "audio/wav";
  case "m4a":
    return "audio/mp4";
  case "flac":
    return "audio/flac";
  case "ogg":
    return "audio/ogg";
  case "aac":
    return "audio/aac";
  default:
    return "audio/mpeg";
  }
}

export function validateFileSize(buffer: Buffer, maxSizeKB = 1024): void {
  const sizeKB = buffer.length / 1024;
  if (sizeKB > maxSizeKB) {
    throw new Error(`File size ${sizeKB.toFixed(2)}KB exceeds limit of ${maxSizeKB}KB`);
  }
}

export function estimateTokens(base64String: string): number {
  // Rough estimation: base64 characters / 4 * 3 for bytes, then / 4 for tokens
  return Math.ceil((base64String.length / 4 * 3) / 4);
}

export function validateTokenLimit(estimatedTokens: number, maxTokens = 128000): { 
    valid: boolean; 
    message?: string 
} {
  if (estimatedTokens <= maxTokens) {
    return { valid: true };
  }
    
  return {
    valid: false,
    message: `Content too large: ${estimatedTokens} tokens exceeds limit of ${maxTokens}. Consider using smaller files or text.`
  };
}

export function truncateToTokenLimit(content: string, maxTokens = 100000): { 
    content: string; 
    truncated: boolean; 
    originalTokens: number; 
    finalTokens: number 
} {
  const originalTokens = Math.ceil(content.length / 4); // Rough estimate for text
    
  if (originalTokens <= maxTokens) {
    return {
      content,
      truncated: false,
      originalTokens,
      finalTokens: originalTokens
    };
  }
    
  const targetLength = Math.floor(content.length * (maxTokens / originalTokens));
  const truncatedContent = content.slice(0, targetLength) + "...[truncated]";
    
  return {
    content: truncatedContent,
    truncated: true,
    originalTokens,
    finalTokens: Math.ceil(truncatedContent.length / 4)
  };
}