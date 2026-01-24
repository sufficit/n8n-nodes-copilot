export interface ProviderInjectionStatus {
    attempted: boolean;
    success: boolean;
    n8nVersion: string;
    chatHubAvailable: boolean;
    error?: string;
    modifications: string[];
}
export declare function injectGitHubCopilotProvider(options?: {
    debug?: boolean;
    force?: boolean;
}): ProviderInjectionStatus;
export declare function getInjectionStatus(): ProviderInjectionStatus | null;
export declare function isProviderInjected(): boolean;
export declare function autoInject(): void;
