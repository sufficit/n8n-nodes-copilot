/**
 * n8n Version Detection Utility
 * 
 * Detects the n8n version to enable conditional features.
 * Used to enable Chat Hub provider injection only in n8n v2+.
 * 
 * @module version-detection
 */

/**
 * Detected n8n version information
 */
export interface N8nVersionInfo {
	/** Full version string (e.g., "2.15.3") */
	version: string;
	/** Major version number (e.g., 2) */
	major: number;
	/** Minor version number (e.g., 15) */
	minor: number;
	/** Patch version number (e.g., 3) */
	patch: number;
	/** Whether this is n8n v2 or higher */
	isV2OrHigher: boolean;
}

/**
 * Attempts to detect n8n version from various sources
 * 
 * @returns Detected version info or null if detection fails
 */
export function detectN8nVersion(): N8nVersionInfo | null {
	try {
		// Method 1: Try to import n8n-workflow package
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const n8nWorkflow = require('n8n-workflow/package.json');
		if (n8nWorkflow?.version) {
			return parseVersionString(n8nWorkflow.version);
		}
	} catch (error) {
		// n8n-workflow not found, try other methods
	}

	try {
		// Method 2: Try to get version from n8n global (if available in runtime)
		// This works when running inside n8n
		if (typeof global !== 'undefined' && (global as any).N8N_VERSION) {
			return parseVersionString((global as any).N8N_VERSION);
		}
	} catch (error) {
		// Global not available
	}

	try {
		// Method 3: Try to get from process environment
		if (process.env.N8N_VERSION) {
			return parseVersionString(process.env.N8N_VERSION);
		}
	} catch (error) {
		// Environment variable not set
	}

	try {
		// Method 4: Check for n8n v2 specific APIs
		// If Chat Hub APIs exist, it's likely v2
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const apiTypes = require('@n8n/api-types');
		if (apiTypes.chatHubLLMProviderSchema) {
			// Chat Hub exists, assume v2.0.0 as minimum
			return {
				version: '2.0.0',
				major: 2,
				minor: 0,
				patch: 0,
				isV2OrHigher: true,
			};
		}
	} catch (error) {
		// @n8n/api-types not available or doesn't have Chat Hub
	}

	// Detection failed
	return null;
}

/**
 * Parse version string into structured format
 * 
 * @param versionString - Version string like "2.15.3" or "v2.15.3"
 * @returns Parsed version info
 */
function parseVersionString(versionString: string): N8nVersionInfo {
	// Remove 'v' prefix if present
	const cleanVersion = versionString.replace(/^v/, '');
	
	// Split into parts
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

/**
 * Check if running in n8n v2 or higher
 * 
 * @returns True if n8n v2+, false otherwise
 */
export function isN8nV2OrHigher(): boolean {
	const versionInfo = detectN8nVersion();
	return versionInfo?.isV2OrHigher ?? false;
}

/**
 * Check if Chat Hub feature is available
 * This is more reliable than version detection for feature checking
 * 
 * @returns True if Chat Hub APIs are available
 */
export function isChatHubAvailable(): boolean {
	try {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const apiTypes = require('@n8n/api-types');
		return !!(apiTypes.chatHubLLMProviderSchema && apiTypes.PROVIDER_CREDENTIAL_TYPE_MAP);
	} catch (error) {
		return false;
	}
}

/**
 * Get n8n version info for logging/debugging
 * 
 * @returns Version info string or "unknown"
 */
export function getN8nVersionString(): string {
	const versionInfo = detectN8nVersion();
	if (!versionInfo) {
		return 'unknown';
	}
	return `${versionInfo.version} (v${versionInfo.major})`;
}
