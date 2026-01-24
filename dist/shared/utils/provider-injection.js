"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.injectGitHubCopilotProvider = injectGitHubCopilotProvider;
exports.getInjectionStatus = getInjectionStatus;
exports.isProviderInjected = isProviderInjected;
exports.autoInject = autoInject;
const version_detection_1 = require("./version-detection");
let injectionStatus = null;
function injectGitHubCopilotProvider(options = {}) {
    const { debug = false, force = false } = options;
    if (injectionStatus && !force) {
        if (debug) {
            console.log('[GitHub Copilot] Provider already injected:', injectionStatus);
        }
        return injectionStatus;
    }
    const status = {
        attempted: true,
        success: false,
        n8nVersion: (0, version_detection_1.getN8nVersionString)(),
        chatHubAvailable: false,
        modifications: [],
    };
    try {
        if (!(0, version_detection_1.isN8nV2OrHigher)()) {
            status.error = `n8n v2+ required. Detected: ${status.n8nVersion}`;
            if (debug) {
                console.log('[GitHub Copilot] Skipping injection:', status.error);
            }
            injectionStatus = status;
            return status;
        }
        if (!(0, version_detection_1.isChatHubAvailable)()) {
            status.error = 'Chat Hub APIs not available';
            if (debug) {
                console.log('[GitHub Copilot] Skipping injection:', status.error);
            }
            injectionStatus = status;
            return status;
        }
        status.chatHubAvailable = true;
        injectIntoApiTypes(status, debug);
        injectIntoConstants(status, debug);
        injectIntoFrontend(status, debug);
        status.success = status.modifications.length > 0;
        if (debug) {
            console.log('[GitHub Copilot] Provider injection completed:', status);
        }
    }
    catch (error) {
        status.error = error instanceof Error ? error.message : String(error);
        if (debug) {
            console.error('[GitHub Copilot] Provider injection failed:', error);
        }
    }
    injectionStatus = status;
    return status;
}
function injectIntoApiTypes(status, debug) {
    var _a, _b;
    try {
        const apiTypes = require('@n8n/api-types');
        if ((_b = (_a = apiTypes.chatHubLLMProviderSchema) === null || _a === void 0 ? void 0 : _a._def) === null || _b === void 0 ? void 0 : _b.values) {
            const values = apiTypes.chatHubLLMProviderSchema._def.values;
            if (!values.includes('githubCopilot')) {
                values.push('githubCopilot');
                status.modifications.push('Added githubCopilot to chatHubLLMProviderSchema');
                if (debug) {
                    console.log('[GitHub Copilot] ✓ Injected into chatHubLLMProviderSchema');
                }
            }
        }
        if (apiTypes.PROVIDER_CREDENTIAL_TYPE_MAP) {
            if (!apiTypes.PROVIDER_CREDENTIAL_TYPE_MAP.githubCopilot) {
                apiTypes.PROVIDER_CREDENTIAL_TYPE_MAP.githubCopilot = 'gitHubCopilotApi';
                status.modifications.push('Added githubCopilot to PROVIDER_CREDENTIAL_TYPE_MAP');
                if (debug) {
                    console.log('[GitHub Copilot] ✓ Injected into PROVIDER_CREDENTIAL_TYPE_MAP');
                }
            }
        }
        if (apiTypes.emptyChatModelsResponse) {
            if (!apiTypes.emptyChatModelsResponse.githubCopilot) {
                apiTypes.emptyChatModelsResponse.githubCopilot = { models: [] };
                status.modifications.push('Added githubCopilot to emptyChatModelsResponse');
                if (debug) {
                    console.log('[GitHub Copilot] ✓ Injected into emptyChatModelsResponse');
                }
            }
        }
    }
    catch (error) {
        if (debug) {
            console.warn('[GitHub Copilot] Failed to inject into @n8n/api-types:', error);
        }
    }
}
function injectIntoConstants(status, debug) {
    try {
        const possiblePaths = [
            '@n8n/cli/dist/modules/chat-hub/chat-hub.constants',
            'n8n/dist/modules/chat-hub/chat-hub.constants',
        ];
        let constants = null;
        for (const path of possiblePaths) {
            try {
                constants = require(path);
                if (constants.PROVIDER_NODE_TYPE_MAP) {
                    break;
                }
            }
            catch {
                continue;
            }
        }
        if (!constants) {
            if (debug) {
                console.warn('[GitHub Copilot] Could not find chat-hub.constants module');
            }
            return;
        }
        if (constants.PROVIDER_NODE_TYPE_MAP) {
            if (!constants.PROVIDER_NODE_TYPE_MAP.githubCopilot) {
                constants.PROVIDER_NODE_TYPE_MAP.githubCopilot = 'n8n-nodes-copilot.gitHubCopilotChatModel';
                status.modifications.push('Added githubCopilot to PROVIDER_NODE_TYPE_MAP');
                if (debug) {
                    console.log('[GitHub Copilot] ✓ Injected into PROVIDER_NODE_TYPE_MAP');
                }
            }
        }
    }
    catch (error) {
        if (debug) {
            console.warn('[GitHub Copilot] Failed to inject into constants:', error);
        }
    }
}
function injectIntoFrontend(status, debug) {
    var _a;
    try {
        if (typeof globalThis !== 'undefined' && globalThis.window) {
            const win = globalThis.window;
            if ((_a = win.__VUE_DEVTOOLS_GLOBAL_HOOK__) === null || _a === void 0 ? void 0 : _a.store) {
                if (debug) {
                    console.log('[GitHub Copilot] Browser context detected, but store injection not yet implemented');
                }
            }
        }
        else {
            if (debug) {
                console.log('[GitHub Copilot] Not in browser context, skipping frontend injection');
            }
        }
    }
    catch (error) {
        if (debug) {
            console.warn('[GitHub Copilot] Failed to inject into frontend:', error);
        }
    }
}
function getInjectionStatus() {
    return injectionStatus;
}
function isProviderInjected() {
    var _a;
    return (_a = injectionStatus === null || injectionStatus === void 0 ? void 0 : injectionStatus.success) !== null && _a !== void 0 ? _a : false;
}
function autoInject() {
    const autoInjectEnabled = process.env.GITHUB_COPILOT_AUTO_INJECT === 'true';
    const debugEnabled = process.env.GITHUB_COPILOT_DEBUG === 'true';
    if (autoInjectEnabled) {
        if (debugEnabled) {
            console.log('[GitHub Copilot] Auto-injection enabled');
        }
        injectGitHubCopilotProvider({ debug: debugEnabled });
    }
}
