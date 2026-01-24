"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectN8nVersion = detectN8nVersion;
exports.isN8nV2OrHigher = isN8nV2OrHigher;
exports.isChatHubAvailable = isChatHubAvailable;
exports.getN8nVersionString = getN8nVersionString;
function detectN8nVersion() {
    try {
        const n8nWorkflow = require('n8n-workflow/package.json');
        if (n8nWorkflow === null || n8nWorkflow === void 0 ? void 0 : n8nWorkflow.version) {
            return parseVersionString(n8nWorkflow.version);
        }
    }
    catch (error) {
    }
    try {
        if (typeof global !== 'undefined' && global.N8N_VERSION) {
            return parseVersionString(global.N8N_VERSION);
        }
    }
    catch (error) {
    }
    try {
        if (process.env.N8N_VERSION) {
            return parseVersionString(process.env.N8N_VERSION);
        }
    }
    catch (error) {
    }
    try {
        const apiTypes = require('@n8n/api-types');
        if (apiTypes.chatHubLLMProviderSchema) {
            return {
                version: '2.0.0',
                major: 2,
                minor: 0,
                patch: 0,
                isV2OrHigher: true,
            };
        }
    }
    catch (error) {
    }
    return null;
}
function parseVersionString(versionString) {
    const cleanVersion = versionString.replace(/^v/, '');
    const parts = cleanVersion.split('.').map(p => parseInt(p, 10));
    const [major = 0, minor = 0, patch = 0] = parts;
    return {
        version: cleanVersion,
        major,
        minor,
        patch,
        isV2OrHigher: major >= 2,
    };
}
function isN8nV2OrHigher() {
    var _a;
    const versionInfo = detectN8nVersion();
    return (_a = versionInfo === null || versionInfo === void 0 ? void 0 : versionInfo.isV2OrHigher) !== null && _a !== void 0 ? _a : false;
}
function isChatHubAvailable() {
    try {
        const apiTypes = require('@n8n/api-types');
        return !!(apiTypes.chatHubLLMProviderSchema && apiTypes.PROVIDER_CREDENTIAL_TYPE_MAP);
    }
    catch (error) {
        return false;
    }
}
function getN8nVersionString() {
    const versionInfo = detectN8nVersion();
    if (!versionInfo) {
        return 'unknown';
    }
    return `${versionInfo.version} (v${versionInfo.major})`;
}
