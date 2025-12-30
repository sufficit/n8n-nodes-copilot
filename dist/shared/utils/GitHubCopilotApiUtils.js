"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeGitHubCopilotRequest = makeGitHubCopilotRequest;
exports.uploadFileToCopilot = uploadFileToCopilot;
exports.downloadFileFromUrl = downloadFileFromUrl;
exports.getFileFromBinary = getFileFromBinary;
exports.getImageMimeType = getImageMimeType;
exports.getAudioMimeType = getAudioMimeType;
exports.validateFileSize = validateFileSize;
exports.estimateTokens = estimateTokens;
exports.validateTokenLimit = validateTokenLimit;
exports.truncateToTokenLimit = truncateToTokenLimit;
const GitHubCopilotEndpoints_1 = require("./GitHubCopilotEndpoints");
const OAuthTokenManager_1 = require("./OAuthTokenManager");
const DynamicModelsManager_1 = require("./DynamicModelsManager");
const ModelVersionRequirements_1 = require("../models/ModelVersionRequirements");
async function makeGitHubCopilotRequest(context, endpoint, body, hasMedia = false, retryConfig) {
    var _a, _b, _c;
    const MAX_RETRIES = (_a = retryConfig === null || retryConfig === void 0 ? void 0 : retryConfig.maxRetries) !== null && _a !== void 0 ? _a : 3;
    const BASE_DELAY = (_b = retryConfig === null || retryConfig === void 0 ? void 0 : retryConfig.baseDelay) !== null && _b !== void 0 ? _b : 500;
    const RETRY_ON_403 = (_c = retryConfig === null || retryConfig === void 0 ? void 0 : retryConfig.retryOn403) !== null && _c !== void 0 ? _c : true;
    const model = body.model;
    let credentialType = "githubCopilotApi";
    try {
        credentialType = context.getNodeParameter("credentialType", 0, "githubCopilotApi");
    }
    catch {
        console.log("🔍 No credentialType parameter found, using default: githubCopilotApi");
    }
    const credentials = await context.getCredentials(credentialType);
    console.log(`🔍 ${credentialType} Credentials Debug:`, Object.keys(credentials));
    const githubToken = credentials.token;
    if (!githubToken) {
        throw new Error("GitHub token not found in credentials");
    }
    if (!githubToken.startsWith("ghu_") && !githubToken.startsWith("github_pat_") && !githubToken.startsWith("gho_")) {
        throw new Error("Invalid GitHub token format. Must start with ghu_, github_pat_, or gho_");
    }
    console.log(`🔄 Using GitHub token to generate OAuth token...`);
    let token;
    try {
        token = await OAuthTokenManager_1.OAuthTokenManager.getValidOAuthToken(githubToken);
        console.log(`✅ OAuth token ready (auto-generated from GitHub token)`);
        DynamicModelsManager_1.DynamicModelsManager.getAvailableModels(token)
            .then((models) => {
            console.log(`✅ Models list updated: ${models.length} models available`);
        })
            .catch((error) => {
            console.warn(`⚠️ Failed to update models list: ${error instanceof Error ? error.message : String(error)}`);
        });
    }
    catch (error) {
        throw new Error(`Failed to generate OAuth token: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (!token) {
        console.error(`❌ Available ${credentialType} credential properties:`, Object.keys(credentials));
        console.error(`❌ Full ${credentialType} credential object:`, JSON.stringify(credentials, null, 2));
        throw new Error(`GitHub Copilot: No access token found in ${credentialType} credentials. Available properties: ` + Object.keys(credentials).join(", "));
    }
    const tokenPrefix = token.substring(0, Math.min(4, token.indexOf("_") + 1)) || token.substring(0, 4);
    const tokenSuffix = token.substring(Math.max(0, token.length - 5));
    console.log(`🔍 GitHub Copilot ${credentialType} Debug: Using token ${tokenPrefix}...${tokenSuffix}`);
    if (!token.startsWith("gho_") && !token.startsWith("ghu_") && !token.startsWith("github_pat_")) {
        console.warn(`⚠️ Unexpected token format: ${tokenPrefix}...${tokenSuffix}. Trying API call anyway.`);
    }
    const minVSCodeVersion = model ? (0, ModelVersionRequirements_1.getMinVSCodeVersion)(model) : "1.95.0";
    const additionalHeaders = model ? (0, ModelVersionRequirements_1.getAdditionalHeaders)(model) : {};
    if (model) {
        console.log(`🔧 Model: ${model} requires VS Code version: ${minVSCodeVersion}`);
    }
    const headers = {
        ...GitHubCopilotEndpoints_1.GITHUB_COPILOT_API.HEADERS.WITH_AUTH(token),
        "User-Agent": "GitHubCopilotChat/0.35.0",
        "Editor-Version": `vscode/${minVSCodeVersion}`,
        "Editor-Plugin-Version": "copilot-chat/0.35.0",
        "X-GitHub-Api-Version": "2025-05-01",
        "X-Interaction-Type": "copilot-chat",
        "OpenAI-Intent": "conversation-panel",
        "Copilot-Integration-Id": "vscode-chat",
        ...additionalHeaders,
    };
    if (hasMedia) {
        headers["Copilot-Vision-Request"] = "true";
        headers["Copilot-Media-Request"] = "true";
    }
    const options = {
        method: "POST",
        headers,
        body: JSON.stringify(body),
    };
    async function uploadFile(buffer, filename, mimeType = 'application/octet-stream') {
        const url = `${GitHubCopilotEndpoints_1.GITHUB_COPILOT_API.BASE_URL}/copilot/chat/attachments/files`;
        let form;
        try {
            form = new FormData();
            const blob = new Blob([buffer], { type: mimeType });
            form.append('file', blob, filename);
        }
        catch (err) {
            const FormData = require('form-data');
            form = new FormData();
            form.append('file', buffer, { filename, contentType: mimeType });
        }
        const uploadHeaders = {
            ...GitHubCopilotEndpoints_1.GITHUB_COPILOT_API.HEADERS.WITH_AUTH(token),
            'X-GitHub-Api-Version': '2025-05-01',
            'X-Interaction-Type': 'copilot-chat',
            'OpenAI-Intent': 'conversation-panel',
            'Copilot-Integration-Id': 'vscode-chat',
        };
        if (typeof form.getHeaders === 'function') {
            Object.assign(uploadHeaders, form.getHeaders());
        }
        const res = await fetch(url, {
            method: 'POST',
            headers: uploadHeaders,
            body: form,
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`File upload failed: ${res.status} ${res.statusText} - ${text}`);
        }
        const json = await res.json();
        return json;
    }
    const fullUrl = `${GitHubCopilotEndpoints_1.GITHUB_COPILOT_API.BASE_URL}${endpoint}`;
    let lastError = null;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await fetch(fullUrl, options);
            if (response.status === 403 && RETRY_ON_403 && attempt < MAX_RETRIES) {
                const delayMs = BASE_DELAY * Math.pow(2, attempt - 1);
                const jitter = Math.random() * delayMs * 0.2;
                const totalDelay = Math.floor(delayMs + jitter);
                console.warn(`⚠️ GitHub Copilot API 403 error on attempt ${attempt}/${MAX_RETRIES}. Retrying in ${totalDelay}ms...`);
                await new Promise(resolve => setTimeout(resolve, totalDelay));
                continue;
            }
            if (!response.ok) {
                const errorText = await response.text();
                if (response.status === 400) {
                    console.log(`🚫 400 Bad Request detected - not retrying`);
                    throw new Error(`GitHub Copilot API error: ${response.status} ${response.statusText}. ${errorText}`);
                }
                const tokenPrefix = token.substring(0, 4);
                const tokenSuffix = token.substring(token.length - 5);
                const tokenInfo = `${tokenPrefix}...${tokenSuffix}`;
                console.error(`❌ GitHub Copilot API Error: ${response.status} ${response.statusText}`);
                console.error(`❌ Error details: ${errorText}`);
                console.error(`❌ Attempt: ${attempt}/${MAX_RETRIES}`);
                throw new Error(`GitHub Copilot API error: ${response.status} ${response.statusText}. ${errorText} [Token: ${tokenInfo}] [Attempt: ${attempt}/${MAX_RETRIES}]`);
            }
            if (attempt > 1) {
                console.log(`✅ GitHub Copilot API succeeded on attempt ${attempt}/${MAX_RETRIES}`);
            }
            const responseData = await response.json();
            responseData._retryMetadata = {
                attempts: attempt,
                retries: attempt - 1,
                succeeded: true
            };
            return responseData;
        }
        catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            if (attempt < MAX_RETRIES) {
                const delayMs = BASE_DELAY * Math.pow(2, attempt - 1);
                const jitter = Math.random() * delayMs * 0.2;
                const totalDelay = Math.floor(delayMs + jitter);
                console.warn(`⚠️ GitHub Copilot API error on attempt ${attempt}/${MAX_RETRIES}: ${lastError.message}. Retrying in ${totalDelay}ms...`);
                await new Promise(resolve => setTimeout(resolve, totalDelay));
                continue;
            }
            throw lastError;
        }
    }
    throw lastError || new Error("GitHub Copilot API request failed after all retries");
}
async function uploadFileToCopilot(context, buffer, filename, mimeType = 'application/octet-stream') {
    let credentialType = 'githubCopilotApi';
    try {
        credentialType = context.getNodeParameter('credentialType', 0, 'githubCopilotApi');
    }
    catch { }
    const credentials = await context.getCredentials(credentialType);
    if (!credentials || !credentials.token) {
        throw new Error('GitHub Copilot: No token found in credentials for file upload');
    }
    const githubToken = credentials.token;
    const token = await OAuthTokenManager_1.OAuthTokenManager.getValidOAuthToken(githubToken);
    const url = `${GitHubCopilotEndpoints_1.GITHUB_COPILOT_API.BASE_URL}/copilot/chat/attachments/files`;
    let form;
    try {
        form = new FormData();
        const blob = new Blob([buffer], { type: mimeType });
        form.append('file', blob, filename);
    }
    catch (err) {
        const FormData = require('form-data');
        form = new FormData();
        form.append('file', buffer, { filename, contentType: mimeType });
    }
    const headers = {
        ...GitHubCopilotEndpoints_1.GITHUB_COPILOT_API.HEADERS.WITH_AUTH(token),
        'X-GitHub-Api-Version': '2025-05-01',
        'X-Interaction-Type': 'copilot-chat',
        'OpenAI-Intent': 'conversation-panel',
        'Copilot-Integration-Id': 'vscode-chat',
        'Copilot-Vision-Request': 'true',
        'Copilot-Media-Request': 'true',
    };
    if (typeof form.getHeaders === 'function') {
        Object.assign(headers, form.getHeaders());
    }
    const res = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: form,
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`File upload failed: ${res.status} ${res.statusText} - ${text}`);
    }
    return await res.json();
}
async function downloadFileFromUrl(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to download file from URL: ${response.status} ${response.statusText}`);
    }
    return Buffer.from(await response.arrayBuffer());
}
async function getFileFromBinary(context, itemIndex, propertyName) {
    const items = context.getInputData();
    const item = items[itemIndex];
    if (!item.binary || !item.binary[propertyName]) {
        throw new Error(`No binary data found in property "${propertyName}"`);
    }
    const binaryData = item.binary[propertyName];
    if (binaryData.data) {
        return Buffer.from(binaryData.data, "base64");
    }
    else if (binaryData.id) {
        return await context.helpers.getBinaryDataBuffer(itemIndex, propertyName);
    }
    else {
        throw new Error(`Invalid binary data format in property "${propertyName}"`);
    }
}
function getImageMimeType(filename) {
    const ext = filename.toLowerCase().split(".").pop();
    switch (ext) {
        case "jpg":
        case "jpeg":
            return "image/jpeg";
        case "png":
            return "image/png";
        case "webp":
            return "image/webp";
        case "gif":
            return "image/gif";
        default:
            return "image/jpeg";
    }
}
function getAudioMimeType(filename) {
    const ext = filename.toLowerCase().split(".").pop();
    switch (ext) {
        case "mp3":
            return "audio/mpeg";
        case "wav":
            return "audio/wav";
        case "m4a":
            return "audio/mp4";
        case "flac":
            return "audio/flac";
        case "ogg":
            return "audio/ogg";
        case "aac":
            return "audio/aac";
        default:
            return "audio/mpeg";
    }
}
function validateFileSize(buffer, maxSizeKB = 1024) {
    const sizeKB = buffer.length / 1024;
    if (sizeKB > maxSizeKB) {
        throw new Error(`File size ${sizeKB.toFixed(2)}KB exceeds limit of ${maxSizeKB}KB`);
    }
}
function estimateTokens(base64String) {
    return Math.ceil((base64String.length / 4 * 3) / 4);
}
function validateTokenLimit(estimatedTokens, maxTokens = 128000) {
    if (estimatedTokens <= maxTokens) {
        return { valid: true };
    }
    return {
        valid: false,
        message: `Content too large: ${estimatedTokens} tokens exceeds limit of ${maxTokens}. Consider using smaller files or text.`
    };
}
function truncateToTokenLimit(content, maxTokens = 100000) {
    const originalTokens = Math.ceil(content.length / 4);
    if (originalTokens <= maxTokens) {
        return {
            content,
            truncated: false,
            originalTokens,
            finalTokens: originalTokens
        };
    }
    const targetLength = Math.floor(content.length * (maxTokens / originalTokens));
    const truncatedContent = content.slice(0, targetLength) + "...[truncated]";
    return {
        content: truncatedContent,
        truncated: true,
        originalTokens,
        finalTokens: Math.ceil(truncatedContent.length / 4)
    };
}
