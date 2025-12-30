/**
 * GitHub Copilot API Endpoints
 * Centralized endpoint management for all nodes
 */

export const GITHUB_COPILOT_API = {
  // Base URLs
  BASE_URL: "https://api.githubcopilot.com",
  GITHUB_BASE_URL: "https://api.github.com",
    
  // Endpoints
  ENDPOINTS: {
    // GitHub Copilot API
    MODELS: "/models",
    CHAT_COMPLETIONS: "/chat/completions",
    EMBEDDINGS: "/embeddings",
        
    // GitHub API (for billing and organization info)
    ORG_BILLING: (org: string) => `/orgs/${org}/copilot/billing`,
    ORG_SEATS: (org: string) => `/orgs/${org}/copilot/billing/seats`,
    USER_COPILOT: "/user/copilot_access",
  },
    
  // Full URLs (convenience methods)
  URLS: {
    // GitHub Copilot API URLs
    MODELS: "https://api.githubcopilot.com/models",
    CHAT_COMPLETIONS: "https://api.githubcopilot.com/chat/completions",
    EMBEDDINGS: "https://api.githubcopilot.com/embeddings",
        
    // GitHub API URLs
    ORG_BILLING: (org: string) => `https://api.github.com/orgs/${org}/copilot/billing`,
    ORG_SEATS: (org: string) => `https://api.github.com/orgs/${org}/copilot/billing/seats`,
    USER_COPILOT: "https://api.github.com/user/copilot_access",
  },
    
  // Headers
  HEADERS: {
    DEFAULT: {
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
    WITH_AUTH: (token: string) => ({
      "Authorization": `Bearer ${token}`,
      "Accept": "application/json",
      "Content-Type": "application/json",
    }),
    // VS Code specific headers (if needed)
    VSCODE_CLIENT: {
      "User-Agent": "VSCode-Copilot",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  },
    
  // Rate Limiting & Retry
  RATE_LIMITS: {
    TPM_RETRY_DELAY_BASE: 1000, // Base delay for TPM quota retry (ms)
    TPM_RETRY_MAX_DELAY: 10000, // Maximum delay for TPM quota retry (ms)
    DEFAULT_MAX_RETRIES: 3,
    EXPONENTIAL_BACKOFF_FACTOR: 2,
  },
    
  // HTTP Status Codes
  STATUS_CODES: {
    OK: 200,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
  },
    
  // Common Error Messages
  ERRORS: {
    INVALID_TOKEN: "Invalid token format. GitHub Copilot API requires tokens starting with \"gho_\"",
    CREDENTIALS_REQUIRED: "GitHub Copilot API credentials are required",
    TPM_QUOTA_EXCEEDED: "TPM (Transactions Per Minute) quota exceeded",
    API_ERROR: (status: number, message: string) => `API Error ${status}: ${message}`,
  },
} as const;

// Type definitions for better TypeScript support
export type GitHubCopilotEndpoint = keyof typeof GITHUB_COPILOT_API.ENDPOINTS;
export type GitHubCopilotUrl = keyof typeof GITHUB_COPILOT_API.URLS;
export type GitHubCopilotStatusCode = typeof GITHUB_COPILOT_API.STATUS_CODES[keyof typeof GITHUB_COPILOT_API.STATUS_CODES];

// Helper functions
export class GitHubCopilotEndpoints {
  /**
     * Get full URL for models endpoint
     */
  static getModelsUrl(): string {
    return GITHUB_COPILOT_API.URLS.MODELS;
  }
    
  /**
     * Get full URL for chat completions endpoint
     */
  static getChatCompletionsUrl(): string {
    return GITHUB_COPILOT_API.URLS.CHAT_COMPLETIONS;
  }
    
  /**
     * Get full URL for embeddings endpoint
     */
  static getEmbeddingsUrl(): string {
    return GITHUB_COPILOT_API.URLS.EMBEDDINGS;
  }
    
  /**
     * Get GitHub API URL for organization billing
     */
  static getOrgBillingUrl(org: string): string {
    return GITHUB_COPILOT_API.URLS.ORG_BILLING(org);
  }
    
  /**
     * Get GitHub API URL for organization seats
     */
  static getOrgSeatsUrl(org: string): string {
    return GITHUB_COPILOT_API.URLS.ORG_SEATS(org);
  }
    
  /**
     * Get GitHub API URL for user copilot access
     */
  static getUserCopilotUrl(): string {
    return GITHUB_COPILOT_API.URLS.USER_COPILOT;
  }
    
  /**
     * Get headers with authentication
     * CRITICAL: Includes required headers for premium models (Claude, Gemini, GPT-5, etc.)
     * Source: microsoft/vscode-copilot-chat networking.ts
     */
  static getAuthHeaders(token: string, includeVSCodeHeaders = false): Record<string, string> {
    const headers: Record<string, string> = {
      ...GITHUB_COPILOT_API.HEADERS.WITH_AUTH(token),
      // CRITICAL: These headers are required for premium models
      "User-Agent": "GitHubCopilotChat/0.35.0",
      "Editor-Version": "vscode/1.96.0",
      "Editor-Plugin-Version": "copilot-chat/0.35.0",
      "X-GitHub-Api-Version": "2025-05-01",
      "X-Interaction-Type": "copilot-chat",
      "OpenAI-Intent": "conversation-panel",
      "Copilot-Integration-Id": "vscode-chat",
    };
        
    if (includeVSCodeHeaders) {
      return {
        ...headers,
        ...GITHUB_COPILOT_API.HEADERS.VSCODE_CLIENT,
      };
    }
        
    return headers;
  }
    
  /**
     * Get headers for embeddings endpoint (requires additional headers)
     */
  static getEmbeddingsHeaders(token: string): Record<string, string> {
    // Generate unique session ID (UUID + timestamp)
    const sessionId = `${this.generateUUID()}-${Date.now()}`;
        
    return {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Editor-Version": "vscode/1.95.0",
      "Editor-Plugin-Version": "copilot/1.0.0",
      "User-Agent": "GitHub-Copilot/1.0 (n8n-node)",
      "Vscode-Sessionid": sessionId,
      "X-GitHub-Api-Version": "2025-08-20",
    };
  }
    
  /**
     * Generate a simple UUID v4
     */
  private static generateUUID(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
    
  /**
     * Calculate retry delay with exponential backoff
     */
  static getRetryDelay(attempt: number): number {
    const delay = GITHUB_COPILOT_API.RATE_LIMITS.TPM_RETRY_DELAY_BASE * 
                     Math.pow(GITHUB_COPILOT_API.RATE_LIMITS.EXPONENTIAL_BACKOFF_FACTOR, attempt - 1);
        
    return Math.min(delay, GITHUB_COPILOT_API.RATE_LIMITS.TPM_RETRY_MAX_DELAY);
  }
    
  /**
     * Check if status code indicates TPM quota exceeded
     */
  static isTpmQuotaError(statusCode: number): boolean {
    return statusCode === GITHUB_COPILOT_API.STATUS_CODES.FORBIDDEN;
  }
    
  /**
     * Validate token format
     */
  static validateToken(token: string): boolean {
    return typeof token === "string" && token.startsWith("gho_");
  }
}