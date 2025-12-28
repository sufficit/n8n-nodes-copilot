"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAuthTokenManager = void 0;
const crypto_1 = __importDefault(require("crypto"));
const https_1 = __importDefault(require("https"));
class OAuthTokenManager {
    static async getValidOAuthToken(githubToken) {
        if (!githubToken || !githubToken.startsWith('gho_')) {
            throw new Error('Invalid GitHub token. Must start with gho_');
        }
        const cacheKey = this.getCacheKey(githubToken);
        const cached = this.tokenCache.get(cacheKey);
        if (cached && cached.expiresAt > Date.now() + 120000) {
            const remainingMinutes = Math.round((cached.expiresAt - Date.now()) / 1000 / 60);
            console.log(`✅ Using cached OAuth token (${remainingMinutes} minutes remaining)`);
            return cached.token;
        }
        console.log('🔄 Generating new OAuth token...');
        const newToken = await this.generateOAuthToken(githubToken);
        return newToken;
    }
    static async generateOAuthToken(githubToken) {
        const machineId = this.getMachineId(githubToken);
        const sessionId = this.generateSessionId();
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'api.github.com',
                path: '/copilot_internal/v2/token',
                method: 'GET',
                headers: {
                    'Authorization': `token ${githubToken}`,
                    'Vscode-Machineid': machineId,
                    'Vscode-Sessionid': sessionId,
                    'Editor-Version': 'vscode/1.105.1',
                    'Editor-Plugin-Version': 'copilot-chat/0.32.3',
                    'X-GitHub-Api-Version': '2025-08-20',
                    'Accept': 'application/json',
                    'User-Agent': 'n8n-nodes-copilot/1.0.0',
                },
            };
            const req = https_1.default.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => (data += chunk));
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        try {
                            const response = JSON.parse(data);
                            const oauthToken = response.token;
                            const expiresAt = response.expires_at * 1000;
                            const refreshIn = response.refresh_in;
                            const cacheKey = this.getCacheKey(githubToken);
                            this.tokenCache.set(cacheKey, {
                                token: oauthToken,
                                expiresAt: expiresAt,
                                generatedAt: Date.now(),
                                refreshIn: refreshIn,
                            });
                            const expiresInMinutes = Math.round((expiresAt - Date.now()) / 1000 / 60);
                            console.log(`✅ OAuth token generated successfully (expires in ${expiresInMinutes} minutes)`);
                            resolve(oauthToken);
                        }
                        catch (error) {
                            reject(new Error(`Failed to parse OAuth token response: ${error}`));
                        }
                    }
                    else {
                        reject(new Error(`Failed to generate OAuth token: ${res.statusCode} ${res.statusMessage}`));
                    }
                });
            });
            req.on('error', (error) => {
                reject(new Error(`Network error generating OAuth token: ${error.message}`));
            });
            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('OAuth token generation timeout'));
            });
            req.end();
        });
    }
    static getMachineId(githubToken) {
        const cacheKey = this.getCacheKey(githubToken);
        if (!this.machineIdCache.has(cacheKey)) {
            const uuid = crypto_1.default.randomUUID();
            const machineId = crypto_1.default.createHash('sha256').update(uuid).digest('hex');
            this.machineIdCache.set(cacheKey, machineId);
            console.log('🆔 Generated new machine ID');
        }
        return this.machineIdCache.get(cacheKey);
    }
    static generateSessionId() {
        return `${crypto_1.default.randomUUID()}${Date.now()}`;
    }
    static getCacheKey(githubToken) {
        return githubToken.substring(0, 20);
    }
    static clearCache(githubToken) {
        const cacheKey = this.getCacheKey(githubToken);
        this.tokenCache.delete(cacheKey);
        this.machineIdCache.delete(cacheKey);
        console.log('🗑️ OAuth token cache cleared');
    }
    static getCacheInfo(githubToken) {
        const cacheKey = this.getCacheKey(githubToken);
        return this.tokenCache.get(cacheKey) || null;
    }
    static needsRefresh(githubToken, bufferMinutes = 2) {
        const cacheKey = this.getCacheKey(githubToken);
        const cached = this.tokenCache.get(cacheKey);
        if (!cached)
            return true;
        const bufferMs = bufferMinutes * 60 * 1000;
        return cached.expiresAt <= Date.now() + bufferMs;
    }
}
exports.OAuthTokenManager = OAuthTokenManager;
OAuthTokenManager.tokenCache = new Map();
OAuthTokenManager.machineIdCache = new Map();
