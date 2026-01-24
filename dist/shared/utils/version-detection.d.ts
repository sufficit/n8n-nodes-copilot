export interface N8nVersionInfo {
    version: string;
    major: number;
    minor: number;
    patch: number;
    isV2OrHigher: boolean;
}
export declare function detectN8nVersion(): N8nVersionInfo | null;
export declare function isN8nV2OrHigher(): boolean;
export declare function isChatHubAvailable(): boolean;
export declare function getN8nVersionString(): string;
