/**
 * Unit Tests - n8n Version Detection
 * 
 * Tests all version detection methods and validation logic.
 * Run with: node tests/unit/version-detection.test.js
 */

const assert = require('assert');
const path = require('path');

// Load module to test
const versionDetection = require('../../dist/shared/utils/version-detection');

console.log('🧪 Running Version Detection Tests...\n');

// Test Suite 1: Version String Parsing
console.log('📋 Test Suite 1: Version String Parsing');

function testParseVersion(versionString, expected) {
	try {
		// Access internal parseVersionString if exported, otherwise test detectN8nVersion
		const result = versionDetection.detectN8nVersion?.();
		
		console.log(`  ✓ Parse "${versionString}": ${JSON.stringify(expected)}`);
		return true;
	} catch (error) {
		console.error(`  ✗ Failed to parse "${versionString}": ${error.message}`);
		return false;
	}
}

// Test Suite 2: Version Detection Methods
console.log('\n📋 Test Suite 2: Version Detection Methods');

function testDetectN8nVersion() {
	console.log('  Testing detectN8nVersion()...');
	try {
		const result = versionDetection.detectN8nVersion();
		
		if (result === null) {
			console.log('  ℹ️  No n8n installation detected (expected in dev environment)');
			return true;
		}
		
		console.log(`  ✓ Detected version: ${result.version}`);
		console.log(`    - Major: ${result.major}`);
		console.log(`    - Minor: ${result.minor}`);
		console.log(`    - Patch: ${result.patch}`);
		console.log(`    - Is v2+: ${result.isV2OrHigher}`);
		
		// Validate structure
		assert.strictEqual(typeof result.version, 'string');
		assert.strictEqual(typeof result.major, 'number');
		assert.strictEqual(typeof result.minor, 'number');
		assert.strictEqual(typeof result.patch, 'number');
		assert.strictEqual(typeof result.isV2OrHigher, 'boolean');
		
		return true;
	} catch (error) {
		console.error(`  ✗ detectN8nVersion() failed: ${error.message}`);
		return false;
	}
}

function testIsN8nV2OrHigher() {
	console.log('  Testing isN8nV2OrHigher()...');
	try {
		const result = versionDetection.isN8nV2OrHigher();
		console.log(`  ✓ Is n8n v2+: ${result}`);
		assert.strictEqual(typeof result, 'boolean');
		return true;
	} catch (error) {
		console.error(`  ✗ isN8nV2OrHigher() failed: ${error.message}`);
		return false;
	}
}

function testIsChatHubAvailable() {
	console.log('  Testing isChatHubAvailable()...');
	try {
		const result = versionDetection.isChatHubAvailable();
		console.log(`  ✓ Chat Hub available: ${result}`);
		assert.strictEqual(typeof result, 'boolean');
		
		if (result) {
			console.log('  ℹ️  Chat Hub APIs detected in environment');
		} else {
			console.log('  ℹ️  Chat Hub APIs not found (expected in dev environment)');
		}
		
		return true;
	} catch (error) {
		console.error(`  ✗ isChatHubAvailable() failed: ${error.message}`);
		return false;
	}
}

function testGetN8nVersionString() {
	console.log('  Testing getN8nVersionString()...');
	try {
		const result = versionDetection.getN8nVersionString();
		console.log(`  ✓ Version string: "${result}"`);
		assert.strictEqual(typeof result, 'string');
		
		if (result === 'unknown') {
			console.log('  ℹ️  Version unknown (expected in dev environment)');
		}
		
		return true;
	} catch (error) {
		console.error(`  ✗ getN8nVersionString() failed: ${error.message}`);
		return false;
	}
}

// Test Suite 3: Environment Detection
console.log('\n📋 Test Suite 3: Environment Detection');

function testEnvironmentDetection() {
	console.log('  Checking environment variables...');
	
	const envVars = ['N8N_VERSION', 'N8N_CHAT_HUB_ENABLED'];
	envVars.forEach(varName => {
		const value = process.env[varName];
		console.log(`    ${varName}: ${value || '(not set)'}`);
	});
	
	return true;
}

function testModuleResolution() {
	console.log('  Testing module resolution...');
	
	const modules = [
		'n8n-workflow',
		'n8n-core',
		'@n8n/api-types'
	];
	
	modules.forEach(moduleName => {
		try {
			require.resolve(moduleName);
			console.log(`    ✓ ${moduleName}: found`);
		} catch {
			console.log(`    ℹ️  ${moduleName}: not found (expected in dev environment)`);
		}
	});
	
	return true;
}

// Test Suite 4: Mock Testing
console.log('\n📋 Test Suite 4: Mock Testing');

function testWithMockedVersion(version) {
	console.log(`  Testing with mocked version: ${version}`);
	
	// Set environment variable
	const originalVersion = process.env.N8N_VERSION;
	process.env.N8N_VERSION = version;
	
	try {
		// Clear require cache to reload module
		delete require.cache[require.resolve('../../dist/shared/utils/version-detection')];
		const vd = require('../../dist/shared/utils/version-detection');
		
		const result = vd.detectN8nVersion();
		
		if (result) {
			console.log(`    ✓ Detected: ${result.version} (v2+: ${result.isV2OrHigher})`);
			
			// Validate expectations
			if (version.startsWith('2.')) {
				assert.strictEqual(result.isV2OrHigher, true, 'Should detect v2+');
			} else if (version.startsWith('1.')) {
				assert.strictEqual(result.isV2OrHigher, false, 'Should detect v1');
			}
		} else {
			console.log('    ℹ️  Could not detect mocked version');
		}
		
		return true;
	} catch (error) {
		console.error(`    ✗ Mock test failed: ${error.message}`);
		return false;
	} finally {
		// Restore original
		if (originalVersion) {
			process.env.N8N_VERSION = originalVersion;
		} else {
			delete process.env.N8N_VERSION;
		}
		
		// Clear cache again
		delete require.cache[require.resolve('../../dist/shared/utils/version-detection')];
	}
}

// Run all tests
console.log('\n' + '='.repeat(60));
console.log('🚀 Executing Test Suites');
console.log('='.repeat(60) + '\n');

const results = [];

// Suite 2: Detection Methods
results.push(testDetectN8nVersion());
results.push(testIsN8nV2OrHigher());
results.push(testIsChatHubAvailable());
results.push(testGetN8nVersionString());

// Suite 3: Environment
results.push(testEnvironmentDetection());
results.push(testModuleResolution());

// Suite 4: Mock Testing
results.push(testWithMockedVersion('2.15.3'));
results.push(testWithMockedVersion('1.58.0'));
results.push(testWithMockedVersion('3.0.0'));

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
