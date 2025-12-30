interface DeviceCodeResponse {
    device_code: string;
    user_code: string;
    verification_uri: string;
    verification_uri_complete?: string;
    expires_in: number;
    interval: number;
}
interface CopilotTokenResponse {
    token: string;
    expires_at: number;
    refresh_in: number;
    sku?: string;
    chat_enabled?: boolean;
}
export declare function requestDeviceCode(clientId: string, scopes: string, deviceCodeUrl: string): Promise<DeviceCodeResponse>;
export declare function pollForAccessToken(clientId: string, deviceCode: string, accessTokenUrl: string, interval?: number, maxAttempts?: number): Promise<string>;
export declare function convertToCopilotToken(githubToken: string, copilotTokenUrl: string): Promise<CopilotTokenResponse>;
export declare function executeDeviceFlow(clientId: string, scopes: string, deviceCodeUrl: string, accessTokenUrl: string, copilotTokenUrl: string, onProgress?: (status: DeviceFlowStatus) => void): Promise<DeviceFlowResult>;
export interface DeviceFlowStatus {
    step: number;
    status: "requesting_device_code" | "awaiting_authorization" | "token_obtained" | "complete" | "error";
    message: string;
    deviceData?: {
        userCode: string;
        verificationUri: string;
        verificationUriComplete?: string;
        expiresIn: number;
    };
}
export interface DeviceFlowResult {
    success: boolean;
    accessToken?: string;
    expiresAt?: Date;
    metadata?: {
        sku?: string;
        chatEnabled?: boolean;
        refreshIn?: number;
    };
    error?: string;
}
export {};
