"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHubCopilotEndpoints = exports.GITHUB_COPILOT_API = void 0;
exports.GITHUB_COPILOT_API = {
    BASE_URL: "https://api.githubcopilot.com",
    GITHUB_BASE_URL: "https://api.github.com",
    ENDPOINTS: {
        MODELS: "/models",
        CHAT_COMPLETIONS: "/chat/completions",
        EMBEDDINGS: "/embeddings",
        ORG_BILLING: (org) => `/orgs/${org}/copilot/billing`,
        ORG_SEATS: (org) => `/orgs/${org}/copilot/billing/seats`,
        USER_COPILOT: "/user/copilot_access",
    },
    URLS: {
        MODELS: "https://api.githubcopilot.com/models",
        CHAT_COMPLETIONS: "https://api.githubcopilot.com/chat/completions",
        EMBEDDINGS: "https://api.githubcopilot.com/embeddings",
        ORG_BILLING: (org) => `https://api.github.com/orgs/${org}/copilot/billing`,
        ORG_SEATS: (org) => `https://api.github.com/orgs/${org}/copilot/billing/seats`,
        USER_COPILOT: "https://api.github.com/user/copilot_access",
    },
    HEADERS: {
        DEFAULT: {
            "Accept": "application/json",
            "Content-Type": "application/json",
        },
        WITH_AUTH: (token) => ({
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json",
            "Content-Type": "application/json",
        }),
        VSCODE_CLIENT: {
            "User-Agent": "VSCode-Copilot",
            "X-GitHub-Api-Version": "2022-11-28",
        },
    },
    RATE_LIMITS: {
        TPM_RETRY_DELAY_BASE: 1000,
        TPM_RETRY_MAX_DELAY: 10000,
        DEFAULT_MAX_RETRIES: 3,
        EXPONENTIAL_BACKOFF_FACTOR: 2,
    },
    STATUS_CODES: {
        OK: 200,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        TOO_MANY_REQUESTS: 429,
        INTERNAL_SERVER_ERROR: 500,
    },
    ERRORS: {
        INVALID_TOKEN: "Invalid token format. GitHub Copilot API requires tokens starting with \"gho_\"",
        CREDENTIALS_REQUIRED: "GitHub Copilot API credentials are required",
        TPM_QUOTA_EXCEEDED: "TPM (Transactions Per Minute) quota exceeded",
        API_ERROR: (status, message) => `API Error ${status}: ${message}`,
    },
};
class GitHubCopilotEndpoints {
    static getModelsUrl() {
        return exports.GITHUB_COPILOT_API.URLS.MODELS;
    }
    static getChatCompletionsUrl() {
        return exports.GITHUB_COPILOT_API.URLS.CHAT_COMPLETIONS;
    }
    static getEmbeddingsUrl() {
        return exports.GITHUB_COPILOT_API.URLS.EMBEDDINGS;
    }
    static getOrgBillingUrl(org) {
        return exports.GITHUB_COPILOT_API.URLS.ORG_BILLING(org);
    }
    static getOrgSeatsUrl(org) {
        return exports.GITHUB_COPILOT_API.URLS.ORG_SEATS(org);
    }
    static getUserCopilotUrl() {
        return exports.GITHUB_COPILOT_API.URLS.USER_COPILOT;
    }
    static getAuthHeaders(token, includeVSCodeHeaders = false) {
        const headers = exports.GITHUB_COPILOT_API.HEADERS.WITH_AUTH(token);
        if (includeVSCodeHeaders) {
            return {
                ...headers,
                ...exports.GITHUB_COPILOT_API.HEADERS.VSCODE_CLIENT,
            };
        }
        return headers;
    }
    static getEmbeddingsHeaders(token) {
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
    static generateUUID() {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }
    static getRetryDelay(attempt) {
        const delay = exports.GITHUB_COPILOT_API.RATE_LIMITS.TPM_RETRY_DELAY_BASE *
            Math.pow(exports.GITHUB_COPILOT_API.RATE_LIMITS.EXPONENTIAL_BACKOFF_FACTOR, attempt - 1);
        return Math.min(delay, exports.GITHUB_COPILOT_API.RATE_LIMITS.TPM_RETRY_MAX_DELAY);
    }
    static isTpmQuotaError(statusCode) {
        return statusCode === exports.GITHUB_COPILOT_API.STATUS_CODES.FORBIDDEN;
    }
    static validateToken(token) {
        return typeof token === "string" && token.startsWith("gho_");
    }
}
exports.GitHubCopilotEndpoints = GitHubCopilotEndpoints;
