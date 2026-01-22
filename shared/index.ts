/**
 * Shared utilities and models for n8n-nodes-copilot
 * 
 * @module shared
 */

// Version detection utilities
export {
	detectN8nVersion,
	isN8nV2OrHigher,
	isChatHubAvailable,
	getN8nVersionString,
	type N8nVersionInfo,
} from './utils/version-detection';

// Provider injection utilities
export {
	injectGitHubCopilotProvider,
	getInjectionStatus,
	isProviderInjected,
	autoInject,
	type ProviderInjectionStatus,
} from './utils/provider-injection';

// Auto-inject on module load if enabled
import { autoInject } from './utils/provider-injection';
autoInject();
