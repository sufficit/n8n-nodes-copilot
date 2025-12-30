interface OAuthTokenCache {
    token: string;
    expiresAt: number;
    generatedAt: number;
    refreshIn: number;
}
export declare class OAuthTokenManager {
    private static tokenCache;
    private static machineIdCache;
    static getValidOAuthToken(githubToken: string): Promise<string>;
    private static generateOAuthToken;
    private static getMachineId;
    private static generateSessionId;
    private static getCacheKey;
    static clearCache(githubToken: string): void;
    static getCacheInfo(githubToken: string): OAuthTokenCache | null;
    static needsRefresh(githubToken: string, bufferMinutes?: number): boolean;
}
export {};
