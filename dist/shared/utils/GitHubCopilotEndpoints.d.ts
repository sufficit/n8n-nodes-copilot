export declare const GITHUB_COPILOT_API: {
    readonly BASE_URL: "https://api.githubcopilot.com";
    readonly GITHUB_BASE_URL: "https://api.github.com";
    readonly ENDPOINTS: {
        readonly MODELS: "/models";
        readonly CHAT_COMPLETIONS: "/chat/completions";
        readonly EMBEDDINGS: "/embeddings";
        readonly ORG_BILLING: (org: string) => string;
        readonly ORG_SEATS: (org: string) => string;
        readonly USER_COPILOT: "/user/copilot_access";
    };
    readonly URLS: {
        readonly MODELS: "https://api.githubcopilot.com/models";
        readonly CHAT_COMPLETIONS: "https://api.githubcopilot.com/chat/completions";
        readonly EMBEDDINGS: "https://api.githubcopilot.com/embeddings";
        readonly ORG_BILLING: (org: string) => string;
        readonly ORG_SEATS: (org: string) => string;
        readonly USER_COPILOT: "https://api.github.com/user/copilot_access";
    };
    readonly HEADERS: {
        readonly DEFAULT: {
            readonly Accept: "application/json";
            readonly "Content-Type": "application/json";
        };
        readonly WITH_AUTH: (token: string) => {
            Authorization: string;
            Accept: string;
            "Content-Type": string;
        };
        readonly VSCODE_CLIENT: {
            readonly "User-Agent": "VSCode-Copilot";
            readonly "X-GitHub-Api-Version": "2022-11-28";
        };
    };
    readonly RATE_LIMITS: {
        readonly TPM_RETRY_DELAY_BASE: 1000;
        readonly TPM_RETRY_MAX_DELAY: 10000;
        readonly DEFAULT_MAX_RETRIES: 3;
        readonly EXPONENTIAL_BACKOFF_FACTOR: 2;
    };
    readonly STATUS_CODES: {
        readonly OK: 200;
        readonly UNAUTHORIZED: 401;
        readonly FORBIDDEN: 403;
        readonly NOT_FOUND: 404;
        readonly TOO_MANY_REQUESTS: 429;
        readonly INTERNAL_SERVER_ERROR: 500;
    };
    readonly ERRORS: {
        readonly INVALID_TOKEN: "Invalid token format. GitHub Copilot API requires tokens starting with \"gho_\"";
        readonly CREDENTIALS_REQUIRED: "GitHub Copilot API credentials are required";
        readonly TPM_QUOTA_EXCEEDED: "TPM (Transactions Per Minute) quota exceeded";
        readonly API_ERROR: (status: number, message: string) => string;
    };
};
export type GitHubCopilotEndpoint = keyof typeof GITHUB_COPILOT_API.ENDPOINTS;
export type GitHubCopilotUrl = keyof typeof GITHUB_COPILOT_API.URLS;
export type GitHubCopilotStatusCode = typeof GITHUB_COPILOT_API.STATUS_CODES[keyof typeof GITHUB_COPILOT_API.STATUS_CODES];
export declare class GitHubCopilotEndpoints {
    static getModelsUrl(): string;
    static getChatCompletionsUrl(): string;
    static getEmbeddingsUrl(): string;
    static getOrgBillingUrl(org: string): string;
    static getOrgSeatsUrl(org: string): string;
    static getUserCopilotUrl(): string;
    static getAuthHeaders(token: string, includeVSCodeHeaders?: boolean): Record<string, string>;
    static getEmbeddingsHeaders(token: string): Record<string, string>;
    private static generateUUID;
    static getRetryDelay(attempt: number): number;
    static isTpmQuotaError(statusCode: number): boolean;
    static validateToken(token: string): boolean;
}
