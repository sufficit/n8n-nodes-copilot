/**
 * Integration Test - n8n Runtime Environment
 * 
 * Tests provider injection in a simulated n8n runtime environment.
 * This script attempts to create conditions similar to running inside n8n.
 * 
 * Usage:
 *   node tests/integration-test.js
 * 
 * Options:
 *   --version=2.15.3  - Simulate specific n8n version
 *   --auto-inject     - Enable auto-injection
 *   --debug           - Enable debug logging
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
	version: null,
	autoInject: false,
	debug: false
};

args.forEach(arg => {
	if (arg.startsWith('--version=')) {
		options.version = arg.split('=')[1];
	} else if (arg === '--auto-inject') {
		options.autoInject = true;
	} else if (arg === '--debug') {
		options.debug = true;
	}
});

// Setup environment
if (options.version) {
	process.env.N8N_VERSION = options.version;
	console.log(`✓ Simulating n8n version: ${options.version}`);
}

if (options.autoInject) {
	process.env.GITHUB_COPILOT_AUTO_INJECT = 'true';
	console.log('✓ Auto-injection enabled');
}

if (options.debug) {
	process.env.GITHUB_COPILOT_DEBUG = 'true';
	console.log('✓ Debug logging enabled');
}

console.log('\n' + '='.repeat(70));
console.log('🧪 Integration Test - n8n Runtime Environment');
console.log('='.repeat(70) + '\n');

// Test sequence
const results = [];

function testStep(name, fn) {
	console.log(`\n📋 ${name}`);
	console.log('-'.repeat(70));
	
	try {
		const result = fn();
		console.log('✓ Passed\n');
		results.push({ name, passed: true });
		return result;
	} catch (error) {
		console.error(`✗ Failed: ${error.message}\n`);
		if (options.debug) {
			console.error(error.stack);
		}
		results.push({ name, passed: false, error: error.message });
		return null;
	}
}

// Test 1: Module Loading
testStep('Test 1: Module Loading', () => {
	console.log('Loading modules...');
	
	const versionDetection = require('../dist/shared/utils/version-detection');
	console.log('  ✓ version-detection.js loaded');
	
	const providerInjection = require('../dist/shared/utils/provider-injection');
	console.log('  ✓ provider-injection.js loaded');
	
	return { versionDetection, providerInjection };
});

// Test 2: Version Detection
const modules = testStep('Test 2: Version Detection', () => {
	const versionDetection = require('../dist/shared/utils/version-detection');
	
	console.log('Detecting n8n version...');
	const versionInfo = versionDetection.detectN8nVersion();
	
	if (versionInfo) {
		console.log(`  ✓ Detected: ${versionInfo.version}`);
		console.log(`  ✓ Is v2+: ${versionInfo.isV2OrHigher}`);
	} else {
		console.log('  ℹ️  No version detected (development environment)');
	}
	
	console.log('\nChecking Chat Hub availability...');
	const chatHubAvailable = versionDetection.isChatHubAvailable();
	console.log(`  ✓ Chat Hub available: ${chatHubAvailable}`);
	
	return { versionDetection, versionInfo, chatHubAvailable };
});

// Test 3: Manual Injection
if (modules) {
	testStep('Test 3: Manual Injection', () => {
		const providerInjection = require('../dist/shared/utils/provider-injection');
		
		console.log('Attempting manual injection...');
		const status = providerInjection.injectGitHubCopilotProvider({
			debug: options.debug,
			force: false
		});
		
		console.log(`  Attempted: ${status.attempted}`);
		console.log(`  Success: ${status.success}`);
		console.log(`  n8n Version: ${status.n8nVersion}`);
		console.log(`  Chat Hub Available: ${status.chatHubAvailable}`);
		
		if (status.error) {
			console.log(`  Error: ${status.error}`);
		}
		
		if (status.modifications.length > 0) {
			console.log(`\n  Modifications (${status.modifications.length}):`);
			status.modifications.forEach(mod => {
				console.log(`    • ${mod}`);
			});
		}
		
		return status;
	});
}

// Test 4: Idempotency Check
if (modules) {
	testStep('Test 4: Idempotency Check', () => {
		const providerInjection = require('../dist/shared/utils/provider-injection');
		
		console.log('Calling injection twice...');
		
		const status1 = providerInjection.injectGitHubCopilotProvider({ debug: false });
		console.log(`  First call - Success: ${status1.success}`);
		
		const status2 = providerInjection.injectGitHubCopilotProvider({ debug: false });
		console.log(`  Second call - Success: ${status2.success}`);
		
		if (status1.success === status2.success && status1.attempted === status2.attempted) {
			console.log('  ✓ Idempotent behavior confirmed');
		} else {
			throw new Error('Injection not idempotent');
		}
		
		return { status1, status2 };
	});
}

// Test 5: Force Injection
if (modules) {
	testStep('Test 5: Force Injection', () => {
		const providerInjection = require('../dist/shared/utils/provider-injection');
		
		console.log('Testing force injection...');
		const status = providerInjection.injectGitHubCopilotProvider({
			debug: options.debug,
			force: true
		});
		
		console.log(`  Success: ${status.success}`);
		console.log(`  Modifications: ${status.modifications.length}`);
		
		return status;
	});
}

// Test 6: Status Validation
if (modules) {
	testStep('Test 6: Status Validation', () => {
		const providerInjection = require('../dist/shared/utils/provider-injection');
		
		console.log('Validating injection status...');
		const status = providerInjection.getInjectionStatus();
		
		console.log('  Status structure:');
		console.log(`    - attempted: ${typeof status.attempted === 'boolean' ? '✓' : '✗'}`);
		console.log(`    - success: ${typeof status.success === 'boolean' ? '✓' : '✗'}`);
		console.log(`    - n8nVersion: ${typeof status.n8nVersion === 'string' ? '✓' : '✗'}`);
		console.log(`    - chatHubAvailable: ${typeof status.chatHubAvailable === 'boolean' ? '✓' : '✗'}`);
		console.log(`    - modifications: ${Array.isArray(status.modifications) ? '✓' : '✗'}`);
		
		const isProviderInjected = providerInjection.isProviderInjected();
		console.log(`\n  Provider injected: ${isProviderInjected}`);
		
		return { status, isProviderInjected };
	});
}

// Test 7: Module Inspection
testStep('Test 7: Module Inspection', () => {
	console.log('Checking n8n modules...');
	
	const modules = [
		'@n8n/api-types',
		'n8n-workflow',
		'n8n'
	];
	
	const found = {};
	
	modules.forEach(moduleName => {
		try {
			const resolved = require.resolve(moduleName);
			found[moduleName] = true;
			console.log(`  ✓ ${moduleName}: found`);
		} catch {
			found[moduleName] = false;
			console.log(`  ℹ️  ${moduleName}: not found (expected in dev)`);
		}
	});
	
	// Try to inspect @n8n/api-types if available
	if (found['@n8n/api-types']) {
		try {
			const apiTypes = require('@n8n/api-types');
			
			if (apiTypes.chatHubLLMProviderSchema?.enum) {
				const providers = apiTypes.chatHubLLMProviderSchema.enum;
				const hasGithub = providers.includes('githubCopilot');
				
				console.log(`\n  chatHubLLMProviderSchema.enum:`);
				console.log(`    - Total providers: ${providers.length}`);
				console.log(`    - Has githubCopilot: ${hasGithub ? '✓' : '✗'}`);
				
				if (hasGithub) {
					console.log('    - GitHub Copilot position: ' + providers.indexOf('githubCopilot'));
				}
			}
		} catch (error) {
			console.log(`  ⚠️  Could not inspect @n8n/api-types: ${error.message}`);
		}
	}
	
	return found;
});

// Generate report
console.log('\n' + '='.repeat(70));
console.log('📊 Test Results Summary');
console.log('='.repeat(70) + '\n');

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
const total = results.length;

results.forEach(result => {
	const icon = result.passed ? '✓' : '✗';
	const color = result.passed ? '\x1b[32m' : '\x1b[31m';
	console.log(`${color}${icon}\x1b[0m ${result.name}`);
	if (result.error) {
		console.log(`  Error: ${result.error}`);
	}
});

console.log(`\nTotal: ${total} | Passed: ${passed} | Failed: ${failed}`);

// Save detailed report
const report = {
	timestamp: new Date().toISOString(),
	options,
	environment: {
		nodeVersion: process.version,
		cwd: process.cwd(),
		env: {
			N8N_VERSION: process.env.N8N_VERSION,
			GITHUB_COPILOT_AUTO_INJECT: process.env.GITHUB_COPILOT_AUTO_INJECT,
			GITHUB_COPILOT_DEBUG: process.env.GITHUB_COPILOT_DEBUG
		}
	},
	results: results.map(r => ({
		name: r.name,
		passed: r.passed,
		error: r.error
	})),
	summary: {
		total,
		passed,
		failed,
		passRate: ((passed / total) * 100).toFixed(1) + '%'
	}
};

if (modules) {
	const providerInjection = require('../dist/shared/utils/provider-injection');
	report.injectionStatus = providerInjection.getInjectionStatus();
}

const reportPath = path.join(__dirname, 'integration-test-report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

console.log(`\n📄 Report saved: ${reportPath}`);

console.log('\n' + '='.repeat(70));

if (failed === 0) {
	console.log('✅ All tests passed!');
	process.exit(0);
} else {
	console.log(`❌ ${failed} test(s) failed`);
	process.exit(1);
}
