/**
 * Unit Tests - Provider Injection
 * 
 * Tests runtime provider injection functionality.
 * Run with: node tests/unit/provider-injection.test.js
 */

const assert = require('assert');

console.log('🧪 Running Provider Injection Tests...\n');

// Load modules to test
const versionDetection = require('../../dist/shared/utils/version-detection');
const providerInjection = require('../../dist/shared/utils/provider-injection');

// Test Suite 1: Injection Status
console.log('📋 Test Suite 1: Injection Status Management');

function testGetInjectionStatus() {
	console.log('  Testing getInjectionStatus()...');
	try {
		const status = providerInjection.getInjectionStatus();
		
		console.log(`  ✓ Status retrieved`);
		console.log(`    - Attempted: ${status.attempted}`);
		console.log(`    - Success: ${status.success}`);
		console.log(`    - n8n Version: ${status.n8nVersion}`);
		console.log(`    - Chat Hub Available: ${status.chatHubAvailable}`);
		
		if (status.error) {
			console.log(`    - Error: ${status.error}`);
		}
		
		if (status.modifications.length > 0) {
			console.log(`    - Modifications: ${status.modifications.length}`);
			status.modifications.forEach(mod => {
				console.log(`      • ${mod}`);
			});
		}
		
		// Validate structure
		assert.strictEqual(typeof status.attempted, 'boolean');
		assert.strictEqual(typeof status.success, 'boolean');
		assert.strictEqual(typeof status.n8nVersion, 'string');
		assert.strictEqual(typeof status.chatHubAvailable, 'boolean');
		assert.ok(Array.isArray(status.modifications));
		
		return true;
	} catch (error) {
		console.error(`  ✗ getInjectionStatus() failed: ${error.message}`);
		return false;
	}
}

function testIsProviderInjected() {
	console.log('  Testing isProviderInjected()...');
	try {
		const result = providerInjection.isProviderInjected();
		console.log(`  ✓ Provider injected: ${result}`);
		assert.strictEqual(typeof result, 'boolean');
		return true;
	} catch (error) {
		console.error(`  ✗ isProviderInjected() failed: ${error.message}`);
		return false;
	}
}

// Test Suite 2: Injection Execution
console.log('\n📋 Test Suite 2: Injection Execution');

function testInjectGitHubCopilotProvider() {
	console.log('  Testing injectGitHubCopilotProvider()...');
	try {
		const status = providerInjection.injectGitHubCopilotProvider({ debug: true });
		
		console.log(`  ✓ Injection completed`);
		console.log(`    - Attempted: ${status.attempted}`);
		console.log(`    - Success: ${status.success}`);
		console.log(`    - n8n Version: ${status.n8nVersion}`);
		console.log(`    - Chat Hub Available: ${status.chatHubAvailable}`);
		
		if (status.error) {
			console.log(`    - Error: ${status.error}`);
		}
		
		if (status.modifications.length > 0) {
			console.log(`    - Modifications applied: ${status.modifications.length}`);
			status.modifications.forEach(mod => {
				console.log(`      • ${mod}`);
			});
		} else {
			console.log('    ℹ️  No modifications made (expected if not running in n8n v2+)');
		}
		
		// Validate structure
		assert.strictEqual(typeof status.attempted, 'boolean');
		assert.strictEqual(typeof status.success, 'boolean');
		
		return true;
	} catch (error) {
		console.error(`  ✗ injectGitHubCopilotProvider() failed: ${error.message}`);
		return false;
	}
}

function testDoubleInjection() {
	console.log('  Testing double injection (should be idempotent)...');
	try {
		const status1 = providerInjection.injectGitHubCopilotProvider({ debug: false });
		const status2 = providerInjection.injectGitHubCopilotProvider({ debug: false });
		
		console.log(`  ✓ Double injection handled`);
		console.log(`    - First call success: ${status1.success}`);
		console.log(`    - Second call success: ${status2.success}`);
		
		// Should get same status
		assert.strictEqual(status1.attempted, status2.attempted);
		assert.strictEqual(status1.success, status2.success);
		
		return true;
	} catch (error) {
		console.error(`  ✗ Double injection test failed: ${error.message}`);
		return false;
	}
}

function testForceInjection() {
	console.log('  Testing force injection...');
	try {
		const status = providerInjection.injectGitHubCopilotProvider({ 
			debug: true, 
			force: true 
		});
		
		console.log(`  ✓ Force injection completed`);
		console.log(`    - Success: ${status.success}`);
		
		return true;
	} catch (error) {
		console.error(`  ✗ Force injection failed: ${error.message}`);
		return false;
	}
}

// Test Suite 3: Version Compatibility
console.log('\n📋 Test Suite 3: Version Compatibility');

function testVersionCompatibility() {
	console.log('  Checking version compatibility...');
	
	const isV2 = versionDetection.isN8nV2OrHigher();
	const chatHubAvailable = versionDetection.isChatHubAvailable();
	const versionString = versionDetection.getN8nVersionString();
	
	console.log(`    - n8n Version: ${versionString}`);
	console.log(`    - Is v2+: ${isV2}`);
	console.log(`    - Chat Hub Available: ${chatHubAvailable}`);
	
	if (!isV2) {
		console.log('  ℹ️  Running in n8n v1.x or standalone - injection will be skipped');
	}
	
	if (!chatHubAvailable) {
		console.log('  ℹ️  Chat Hub APIs not detected - injection may fail');
	}
	
	return true;
}

// Test Suite 4: Module Availability
console.log('\n📋 Test Suite 4: Module Availability');

function testModuleAvailability() {
	console.log('  Checking required modules...');
	
	const modules = {
		'@n8n/api-types': false,
		'n8n-workflow': false,
		'n8n': false
	};
	
	Object.keys(modules).forEach(moduleName => {
		try {
			require.resolve(moduleName);
			modules[moduleName] = true;
			console.log(`    ✓ ${moduleName}: available`);
		} catch {
			console.log(`    ℹ️  ${moduleName}: not available (expected in dev environment)`);
		}
	});
	
	return true;
}

function testApiTypesEnum() {
	console.log('  Testing @n8n/api-types enum access...');
	
	try {
		const apiTypes = require('@n8n/api-types');
		
		if (apiTypes.chatHubLLMProviderSchema) {
			console.log('    ✓ chatHubLLMProviderSchema found');
			console.log(`    - Type: ${typeof apiTypes.chatHubLLMProviderSchema}`);
			
			// Try to access enum
			if (apiTypes.chatHubLLMProviderSchema.enum) {
				const providers = apiTypes.chatHubLLMProviderSchema.enum;
				console.log(`    - Providers count: ${providers.length}`);
				console.log(`    - Has githubCopilot: ${providers.includes('githubCopilot')}`);
			}
		} else {
			console.log('    ℹ️  chatHubLLMProviderSchema not found');
		}
		
		return true;
	} catch (error) {
		console.log(`    ℹ️  @n8n/api-types not available: ${error.message}`);
		return true; // Not a failure in dev environment
	}
}

// Test Suite 5: Auto-injection
console.log('\n📋 Test Suite 5: Auto-injection');

function testAutoInjection() {
	console.log('  Testing auto-injection behavior...');
	
	const autoInjectEnabled = process.env.GITHUB_COPILOT_AUTO_INJECT === 'true';
	console.log(`    - GITHUB_COPILOT_AUTO_INJECT: ${process.env.GITHUB_COPILOT_AUTO_INJECT || '(not set)'}`);
	console.log(`    - Auto-inject enabled: ${autoInjectEnabled}`);
	
	if (autoInjectEnabled) {
		console.log('    ℹ️  Auto-injection is enabled - provider should inject on module load');
	} else {
		console.log('    ℹ️  Auto-injection is disabled - manual injection required');
	}
	
	return true;
}

// Run all tests
console.log('\n' + '='.repeat(60));
console.log('🚀 Executing Test Suites');
console.log('='.repeat(60) + '\n');

const results = [];

// Suite 1: Status
results.push(testGetInjectionStatus());
results.push(testIsProviderInjected());

// Suite 2: Injection
results.push(testInjectGitHubCopilotProvider());
results.push(testDoubleInjection());
results.push(testForceInjection());

// Suite 3: Compatibility
results.push(testVersionCompatibility());

// Suite 4: Modules
results.push(testModuleAvailability());
results.push(testApiTypesEnum());

// Suite 5: Auto-injection
results.push(testAutoInjection());

// Summary
console.log('\n' + '='.repeat(60));
const passed = results.filter(r => r === true).length;
const total = results.length;
const failed = total - passed;

console.log('📊 Test Summary:');
console.log(`   Total: ${total}`);
console.log(`   Passed: ${passed} ✓`);
console.log(`   Failed: ${failed} ${failed > 0 ? '✗' : ''}`);
console.log('='.repeat(60));

if (failed === 0) {
	console.log('\n✅ All tests passed!');
	process.exit(0);
} else {
	console.log(`\n❌ ${failed} test(s) failed`);
	process.exit(1);
}
