"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestDeviceCode = requestDeviceCode;
exports.pollForAccessToken = pollForAccessToken;
exports.convertToCopilotToken = convertToCopilotToken;
exports.executeDeviceFlow = executeDeviceFlow;
async function requestDeviceCode(clientId, scopes, deviceCodeUrl) {
    const response = await fetch(deviceCodeUrl, {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            client_id: clientId,
            scope: scopes,
        }),
    });
    if (!response.ok) {
        throw new Error(`Failed to request device code: ${response.status} ${response.statusText}`);
    }
    return (await response.json());
}
async function pollForAccessToken(clientId, deviceCode, accessTokenUrl, interval = 5, maxAttempts = 180) {
    let currentInterval = interval * 1000;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        await sleep(currentInterval);
        const response = await fetch(accessTokenUrl, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_id: clientId,
                device_code: deviceCode,
                grant_type: "urn:ietf:params:oauth:grant-type:device_code",
            }),
        });
        const data = (await response.json());
        if (data.access_token) {
            return data.access_token;
        }
        if (data.error === "authorization_pending") {
            console.log(`[Device Flow] Attempt ${attempt}/${maxAttempts}: Waiting for authorization...`);
            continue;
        }
        if (data.error === "slow_down") {
            currentInterval += 5000;
            console.log(`[Device Flow] Rate limited, increasing interval to ${currentInterval / 1000}s`);
            continue;
        }
        if (data.error === "expired_token") {
            throw new Error("Device code expired. Please start the Device Flow again.");
        }
        if (data.error === "access_denied") {
            throw new Error("User denied authorization.");
        }
        throw new Error(`OAuth error: ${data.error} - ${data.error_description || "Unknown error"}`);
    }
    throw new Error("Device Flow timeout. Authorization took too long.");
}
async function convertToCopilotToken(githubToken, copilotTokenUrl) {
    const response = await fetch(copilotTokenUrl, {
        method: "GET",
        headers: {
            "Authorization": `token ${githubToken}`,
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2025-04-01",
            "User-Agent": "GitHub-Copilot-Chat/1.0.0 VSCode/1.85.0",
            "Editor-Version": "vscode/1.85.0",
            "Editor-Plugin-Version": "copilot-chat/0.12.0",
        },
    });
    if (!response.ok) {
        console.warn(`[Device Flow] Failed to convert to Copilot token: ${response.status}`);
        return {
            token: githubToken,
            expires_at: Date.now() + (8 * 60 * 60 * 1000),
            refresh_in: 8 * 60 * 60,
        };
    }
    const data = (await response.json());
    return data;
}
async function executeDeviceFlow(clientId, scopes, deviceCodeUrl, accessTokenUrl, copilotTokenUrl, onProgress) {
    try {
        onProgress === null || onProgress === void 0 ? void 0 : onProgress({
            step: 1,
            status: "requesting_device_code",
            message: "Solicitando device code do GitHub...",
        });
        const deviceData = await requestDeviceCode(clientId, scopes, deviceCodeUrl);
        onProgress === null || onProgress === void 0 ? void 0 : onProgress({
            step: 2,
            status: "awaiting_authorization",
            message: "Aguardando sua autorização no GitHub...",
            deviceData: {
                userCode: deviceData.user_code,
                verificationUri: deviceData.verification_uri,
                verificationUriComplete: deviceData.verification_uri_complete,
                expiresIn: deviceData.expires_in,
            },
        });
        const accessToken = await pollForAccessToken(clientId, deviceData.device_code, accessTokenUrl, deviceData.interval);
        onProgress === null || onProgress === void 0 ? void 0 : onProgress({
            step: 3,
            status: "token_obtained",
            message: "Token GitHub OAuth obtido! Convertendo para token Copilot...",
        });
        const copilotData = await convertToCopilotToken(accessToken, copilotTokenUrl);
        onProgress === null || onProgress === void 0 ? void 0 : onProgress({
            step: 4,
            status: "complete",
            message: "✅ Autenticação completa! Token salvo com sucesso.",
        });
        return {
            success: true,
            accessToken: copilotData.token || accessToken,
            expiresAt: new Date(copilotData.expires_at),
            metadata: {
                sku: copilotData.sku,
                chatEnabled: copilotData.chat_enabled,
                refreshIn: copilotData.refresh_in,
            },
        };
    }
    catch (error) {
        onProgress === null || onProgress === void 0 ? void 0 : onProgress({
            step: -1,
            status: "error",
            message: `❌ Erro: ${error instanceof Error ? error.message : String(error)}`,
        });
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
