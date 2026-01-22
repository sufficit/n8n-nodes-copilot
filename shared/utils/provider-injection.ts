/**
 * GitHub Copilot Provider Runtime Injection
 * 
 * Dynamically injects GitHub Copilot as a Chat Hub provider in n8n v2+.
 * This allows GitHub Copilot to appear in the providers list without modifying n8n core.
 * 
 * ⚠️ WARNING: This is advanced runtime modification and may break with n8n updates.
 * Use at your own risk and test thoroughly after n8n upgrades.
 * 
 * @module provider-injection
 */

import { isChatHubAvailable, isN8nV2OrHigher, getN8nVersionString } from './version-detection';

/**
 * Provider injection status
 */
export interface ProviderInjectionStatus {
	/** Whether injection was attempted */
	attempted: boolean;
	/** Whether injection was successful */
	success: boolean;
	/** n8n version detected */
	n8nVersion: string;
	/** Whether Chat Hub is available */
	chatHubAvailable: boolean;
	/** Error message if injection failed */
	error?: string;
	/** List of modifications made */
	modifications: string[];
}

let injectionStatus: ProviderInjectionStatus | null = null;

/**
 * Inject GitHub Copilot provider into n8n Chat Hub
 * 
 * Only runs if n8n v2+ is detected and Chat Hub is available.
 * Safe to call multiple times - will only inject once.
 * 
 * @param options - Injection options
 * @returns Injection status
 */
export function injectGitHubCopilotProvider(options: {
	/** Enable debug logging */
	debug?: boolean;
	/** Force injection even if already done */
	force?: boolean;
} = {}): ProviderInjectionStatus {
	const { debug = false, force = false } = options;

	// Return cached status if already injected (unless force=true)
	if (injectionStatus && !force) {
		if (debug) {
			console.log('[GitHub Copilot] Provider already injected:', injectionStatus);
		}
		return injectionStatus;
	}

	// Initialize status
	const status: ProviderInjectionStatus = {
		attempted: true,
		success: false,
		n8nVersion: getN8nVersionString(),
		chatHubAvailable: false,
		modifications: [],
	};

	try {
		// Check if running in n8n v2+
		if (!isN8nV2OrHigher()) {
			status.error = `n8n v2+ required. Detected: ${status.n8nVersion}`;
			if (debug) {
				console.log('[GitHub Copilot] Skipping injection:', status.error);
			}
			injectionStatus = status;
			return status;
		}

		// Check if Chat Hub is available
		if (!isChatHubAvailable()) {
			status.error = 'Chat Hub APIs not available';
			if (debug) {
				console.log('[GitHub Copilot] Skipping injection:', status.error);
			}
			injectionStatus = status;
			return status;
		}

		status.chatHubAvailable = true;

		// Perform injection
		injectIntoApiTypes(status, debug);
		injectIntoConstants(status, debug);
		injectIntoFrontend(status, debug);

		// Mark as successful if at least one modification was made
		status.success = status.modifications.length > 0;

		if (debug) {
			console.log('[GitHub Copilot] Provider injection completed:', status);
		}
	} catch (error) {
		status.error = error instanceof Error ? error.message : String(error);
		if (debug) {
			console.error('[GitHub Copilot] Provider injection failed:', error);
		}
	}

	injectionStatus = status;
	return status;
}

/**
 * Inject into @n8n/api-types
 */
function injectIntoApiTypes(status: ProviderInjectionStatus, debug: boolean): void {
	try {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const apiTypes = require('@n8n/api-types');

		// Inject into provider schema enum
		if (apiTypes.chatHubLLMProviderSchema?._def?.values) {
			const values = apiTypes.chatHubLLMProviderSchema._def.values;
			if (!values.includes('githubCopilot')) {
				values.push('githubCopilot');
				status.modifications.push('Added githubCopilot to chatHubLLMProviderSchema');
				if (debug) {
					console.log('[GitHub Copilot] ✓ Injected into chatHubLLMProviderSchema');
				}
			}
		}

		// Inject into credential type map
		if (apiTypes.PROVIDER_CREDENTIAL_TYPE_MAP) {
			if (!apiTypes.PROVIDER_CREDENTIAL_TYPE_MAP.githubCopilot) {
				apiTypes.PROVIDER_CREDENTIAL_TYPE_MAP.githubCopilot = 'gitHubCopilotApi';
				status.modifications.push('Added githubCopilot to PROVIDER_CREDENTIAL_TYPE_MAP');
				if (debug) {
					console.log('[GitHub Copilot] ✓ Injected into PROVIDER_CREDENTIAL_TYPE_MAP');
				}
			}
		}

		// Inject into empty chat models response
		if (apiTypes.emptyChatModelsResponse) {
			if (!apiTypes.emptyChatModelsResponse.githubCopilot) {
				apiTypes.emptyChatModelsResponse.githubCopilot = { models: [] };
				status.modifications.push('Added githubCopilot to emptyChatModelsResponse');
				if (debug) {
					console.log('[GitHub Copilot] ✓ Injected into emptyChatModelsResponse');
				}
			}
		}
	} catch (error) {
		if (debug) {
			console.warn('[GitHub Copilot] Failed to inject into @n8n/api-types:', error);
		}
	}
}

/**
 * Inject into chat-hub.constants.ts
 */
function injectIntoConstants(status: ProviderInjectionStatus, debug: boolean): void {
	try {
		// Try to require the constants module
		// This path may vary depending on n8n installation
		const possiblePaths = [
			'@n8n/cli/dist/modules/chat-hub/chat-hub.constants',
			'n8n/dist/modules/chat-hub/chat-hub.constants',
		];

		let constants: any = null;
		for (const path of possiblePaths) {
			try {
				// eslint-disable-next-line @typescript-eslint/no-var-requires
				constants = require(path);
				if (constants.PROVIDER_NODE_TYPE_MAP) {
					break;
				}
			} catch {
				// Try next path
				continue;
			}
		}

		if (!constants) {
			if (debug) {
				console.warn('[GitHub Copilot] Could not find chat-hub.constants module');
			}
			return;
		}

		// Inject into provider node type map
		if (constants.PROVIDER_NODE_TYPE_MAP) {
			if (!constants.PROVIDER_NODE_TYPE_MAP.githubCopilot) {
				constants.PROVIDER_NODE_TYPE_MAP.githubCopilot = 'n8n-nodes-copilot.gitHubCopilotChatModel';
				status.modifications.push('Added githubCopilot to PROVIDER_NODE_TYPE_MAP');
				if (debug) {
					console.log('[GitHub Copilot] ✓ Injected into PROVIDER_NODE_TYPE_MAP');
				}
			}
		}
	} catch (error) {
		if (debug) {
			console.warn('[GitHub Copilot] Failed to inject into constants:', error);
		}
	}
}

/**
 * Inject into frontend constants
 */
function injectIntoFrontend(status: ProviderInjectionStatus, debug: boolean): void {
	try {
		// Frontend injection is more complex as it's browser-side code
		// We need to inject via window global or store mutation
		if (typeof globalThis !== 'undefined' && (globalThis as any).window) {
			// Running in browser context
			// Try to inject via Vue store or global state
			const win = (globalThis as any).window;

			// Look for n8n's Vue store
			if (win.__VUE_DEVTOOLS_GLOBAL_HOOK__?.store) {
				// Store mutation would go here
				// This is highly dependent on n8n's internal structure
				if (debug) {
					console.log('[GitHub Copilot] Browser context detected, but store injection not yet implemented');
				}
			}
		} else {
			if (debug) {
				console.log('[GitHub Copilot] Not in browser context, skipping frontend injection');
			}
		}
	} catch (error) {
		if (debug) {
			console.warn('[GitHub Copilot] Failed to inject into frontend:', error);
		}
	}
}

/**
 * Get current injection status
 * 
 * @returns Current injection status or null if not attempted
 */
export function getInjectionStatus(): ProviderInjectionStatus | null {
	return injectionStatus;
}

/**
 * Check if provider injection is active
 * 
 * @returns True if GitHub Copilot provider is injected and active
 */
export function isProviderInjected(): boolean {
	return injectionStatus?.success ?? false;
}

/**
 * Initialize provider injection automatically on module load (if enabled)
 * 
 * Set environment variable GITHUB_COPILOT_AUTO_INJECT=true to enable
 */
export function autoInject(): void {
	const autoInjectEnabled = process.env.GITHUB_COPILOT_AUTO_INJECT === 'true';
	const debugEnabled = process.env.GITHUB_COPILOT_DEBUG === 'true';

	if (autoInjectEnabled) {
		if (debugEnabled) {
			console.log('[GitHub Copilot] Auto-injection enabled');
		}
		injectGitHubCopilotProvider({ debug: debugEnabled });
	}
}
