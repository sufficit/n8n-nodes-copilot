/**
 * OAuth Token Manager for GitHub Copilot
 * 
 * Automatically generates and caches OAuth tokens from GitHub tokens (gho_*)
 * Tokens are cached in memory and auto-renewed before expiration
 */

import crypto from 'crypto';
import https from 'https';

interface OAuthTokenCache {
	token: string;
	expiresAt: number;
	generatedAt: number;
	refreshIn: number;
}

interface OAuthResponse {
	token: string;
	expires_at: number;
	refresh_in: number;
	chat_enabled: boolean;
	sku: string;
	endpoints: {
		api: string;
		proxy: string;
		telemetry: string;
	};
}

export class OAuthTokenManager {
	private static tokenCache: Map<string, OAuthTokenCache> = new Map();
	private static machineIdCache: Map<string, string> = new Map();

	/**
	 * Get valid OAuth token (generates new if expired or near expiration)
	 * @param githubToken - GitHub CLI token (gho_*)
	 * @returns Valid OAuth token
	 */
	static async getValidOAuthToken(githubToken: string): Promise<string> {
		if (!githubToken || !githubToken.startsWith('gho_')) {
			throw new Error('Invalid GitHub token. Must start with gho_');
		}

		const cacheKey = this.getCacheKey(githubToken);
		const cached = this.tokenCache.get(cacheKey);

		// Check if we have a valid cached token (with 2 minute buffer before expiration)
		if (cached && cached.expiresAt > Date.now() + 120000) {
			const remainingMinutes = Math.round((cached.expiresAt - Date.now()) / 1000 / 60);
			console.log(`✅ Using cached OAuth token (${remainingMinutes} minutes remaining)`);
			return cached.token;
		}

		// Generate new token
		console.log('🔄 Generating new OAuth token...');
		const newToken = await this.generateOAuthToken(githubToken);
		return newToken;
	}

	/**
	 * Generate new OAuth token from GitHub token
	 */
	private static async generateOAuthToken(githubToken: string): Promise<string> {
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

			const req = https.request(options, (res) => {
				let data = '';
				res.on('data', (chunk) => (data += chunk));
				res.on('end', () => {
					if (res.statusCode === 200) {
						try {
							const response: OAuthResponse = JSON.parse(data);
							const oauthToken = response.token;
							const expiresAt = response.expires_at * 1000; // Convert to ms
							const refreshIn = response.refresh_in;

							// Cache the token
							const cacheKey = this.getCacheKey(githubToken);
							this.tokenCache.set(cacheKey, {
								token: oauthToken,
								expiresAt: expiresAt,
								generatedAt: Date.now(),
								refreshIn: refreshIn,
							});

							const expiresInMinutes = Math.round((expiresAt - Date.now()) / 1000 / 60);
							console.log(
								`✅ OAuth token generated successfully (expires in ${expiresInMinutes} minutes)`,
							);
							resolve(oauthToken);
						} catch (error) {
							reject(new Error(`Failed to parse OAuth token response: ${error}`));
						}
					} else {
						reject(
							new Error(
								`Failed to generate OAuth token: ${res.statusCode} ${res.statusMessage}`,
							),
						);
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

	/**
	 * Get or generate persistent machine ID for a GitHub token
	 */
	private static getMachineId(githubToken: string): string {
		const cacheKey = this.getCacheKey(githubToken);

		if (!this.machineIdCache.has(cacheKey)) {
			const uuid = crypto.randomUUID();
			const machineId = crypto.createHash('sha256').update(uuid).digest('hex');
			this.machineIdCache.set(cacheKey, machineId);
			console.log('🆔 Generated new machine ID');
		}

		return this.machineIdCache.get(cacheKey)!;
	}

	/**
	 * Generate session ID (unique for each token generation)
	 */
	private static generateSessionId(): string {
		return `${crypto.randomUUID()}${Date.now()}`;
	}

	/**
	 * Get cache key from GitHub token (first 20 chars)
	 */
	private static getCacheKey(githubToken: string): string {
		return githubToken.substring(0, 20);
	}

	/**
	 * Clear cache for specific GitHub token
	 */
	static clearCache(githubToken: string): void {
		const cacheKey = this.getCacheKey(githubToken);
		this.tokenCache.delete(cacheKey);
		this.machineIdCache.delete(cacheKey);
		console.log('🗑️ OAuth token cache cleared');
	}

	/**
	 * Get cache info for debugging
	 */
	static getCacheInfo(githubToken: string): OAuthTokenCache | null {
		const cacheKey = this.getCacheKey(githubToken);
		return this.tokenCache.get(cacheKey) || null;
	}

	/**
	 * Check if token needs refresh
	 */
	static needsRefresh(githubToken: string, bufferMinutes: number = 2): boolean {
		const cacheKey = this.getCacheKey(githubToken);
		const cached = this.tokenCache.get(cacheKey);

		if (!cached) return true;

		const bufferMs = bufferMinutes * 60 * 1000;
		return cached.expiresAt <= Date.now() + bufferMs;
	}
}
