/**
 * Interactive Debug Script - Runtime Provider Injection
 * 
 * Interactive script to test and debug GitHub Copilot provider injection.
 * Provides detailed diagnostics and step-by-step execution.
 * 
 * Usage:
 *   node tests/debug-provider-injection.js
 * 
 * Environment Variables:
 *   GITHUB_COPILOT_DEBUG=true - Enable detailed logging
 *   N8N_VERSION=2.15.3 - Mock n8n version for testing
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Setup readline interface
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

// ANSI colors
const colors = {
	reset: '\x1b[0m',
	bright: '\x1b[1m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	cyan: '\x1b[36m',
	gray: '\x1b[90m'
};

function print(msg, color = 'reset') {
	console.log(`${colors[color]}${msg}${colors.reset}`);
}

function printHeader(title) {
	console.log('\n' + '='.repeat(70));
	print(title, 'bright');
	console.log('='.repeat(70));
}

function printSection(title) {
	console.log();
	print(`📋 ${title}`, 'cyan');
	console.log('-'.repeat(70));
}

async function question(prompt) {
	return new Promise(resolve => {
		rl.question(`${colors.yellow}${prompt}${colors.reset} `, resolve);
	});
}

// Main debug flow
async function main() {
	printHeader('🔍 GitHub Copilot Provider Injection - Debug Tool');
	
	print('\nThis tool helps diagnose why GitHub Copilot is not appearing', 'gray');
	print('in the n8n v2 Chat Hub providers list.\n', 'gray');
	
	// Step 1: Environment Check
	printSection('Step 1: Environment Check');
	
	print('Current working directory:', 'gray');
	console.log(`  ${process.cwd()}`);
	
	print('\nNode.js version:', 'gray');
	console.log(`  ${process.version}`);
	
	print('\nEnvironment variables:', 'gray');
	const envVars = ['N8N_VERSION', 'GITHUB_COPILOT_AUTO_INJECT', 'GITHUB_COPILOT_DEBUG'];
	envVars.forEach(varName => {
		const value = process.env[varName];
		console.log(`  ${varName}: ${value || '(not set)'}`);
	});
	
	await question('\nPress ENTER to continue...');
	
	// Step 2: Module Resolution
	printSection('Step 2: Module Resolution');
	
	const modules = {
		'./dist/shared/utils/version-detection': 'Version Detection Utility',
		'./dist/shared/utils/provider-injection': 'Provider Injection Utility',
		'n8n-workflow': 'n8n Workflow Package',
		'@n8n/api-types': 'n8n API Types',
		'n8n': 'n8n Core Package'
	};
	
	const loadedModules = {};
	
	for (const [modulePath, description] of Object.entries(modules)) {
		try {
			const resolved = require.resolve(modulePath);
			loadedModules[modulePath] = require(modulePath);
			print(`✓ ${description}`, 'green');
			console.log(`  Path: ${resolved}`);
		} catch (error) {
			print(`✗ ${description}: ${error.message}`, 'red');
			
			if (modulePath.startsWith('./')) {
				print('  ERROR: Required module not found!', 'red');
				print('  Please run: npm run build', 'yellow');
				process.exit(1);
			}
		}
	}
	
	await question('\nPress ENTER to continue...');
	
	// Step 3: Version Detection
	printSection('Step 3: n8n Version Detection');
	
	if (!loadedModules['./dist/shared/utils/version-detection']) {
		print('✗ Version detection module not loaded', 'red');
		process.exit(1);
	}
	
	const versionDetection = loadedModules['./dist/shared/utils/version-detection'];
	
	print('Detecting n8n version...', 'gray');
	const versionInfo = versionDetection.detectN8nVersion();
	
	if (versionInfo) {
		print(`✓ n8n detected: ${versionInfo.version}`, 'green');
		console.log(`  Major: ${versionInfo.major}`);
		console.log(`  Minor: ${versionInfo.minor}`);
		console.log(`  Patch: ${versionInfo.patch}`);
		console.log(`  Is v2+: ${versionInfo.isV2OrHigher ? '✓' : '✗'}`);
		
		if (!versionInfo.isV2OrHigher) {
			print('\n⚠️  WARNING: n8n v1.x detected', 'yellow');
			print('   Provider injection only works with n8n v2+', 'yellow');
		}
	} else {
		print('✗ n8n version not detected', 'red');
		print('  Running in standalone/development environment', 'gray');
		
		const mockVersion = await question('\nEnter n8n version to mock (e.g., 2.15.3) or press ENTER to skip: ');
		
		if (mockVersion) {
			process.env.N8N_VERSION = mockVersion;
			print(`✓ Mocked version set to: ${mockVersion}`, 'green');
			
			// Reload module to pick up new env var
			delete require.cache[require.resolve('./dist/shared/utils/version-detection')];
			const vd = require('./dist/shared/utils/version-detection');
			const newInfo = vd.detectN8nVersion();
			
			if (newInfo) {
				print(`✓ Detection with mock: ${newInfo.version} (v2+: ${newInfo.isV2OrHigher})`, 'green');
			}
		}
	}
	
	print('\nChecking Chat Hub availability...', 'gray');
	const chatHubAvailable = versionDetection.isChatHubAvailable();
	
	if (chatHubAvailable) {
		print('✓ Chat Hub APIs detected', 'green');
	} else {
		print('✗ Chat Hub APIs not found', 'red');
		print('  This is expected in development environment', 'gray');
		print('  In production, n8n must be running with Chat Hub enabled', 'gray');
	}
	
	await question('\nPress ENTER to continue...');
	
	// Step 4: Provider Injection Test
	printSection('Step 4: Provider Injection Test');
	
	if (!loadedModules['./dist/shared/utils/provider-injection']) {
		print('✗ Provider injection module not loaded', 'red');
		process.exit(1);
	}
	
	const providerInjection = loadedModules['./dist/shared/utils/provider-injection'];
	
	print('Current injection status:', 'gray');
	const initialStatus = providerInjection.getInjectionStatus();
	console.log(JSON.stringify(initialStatus, null, 2));
	
	const shouldInject = await question('\nAttempt provider injection? (y/n): ');
	
	if (shouldInject.toLowerCase() === 'y') {
		print('\nAttempting injection with debug enabled...', 'yellow');
		
		const injectionStatus = providerInjection.injectGitHubCopilotProvider({ 
			debug: true,
			force: true
		});
		
		console.log();
		if (injectionStatus.success) {
			print('✓ Injection successful!', 'green');
		} else {
			print('✗ Injection failed', 'red');
		}
		
		print('\nInjection Status:', 'cyan');
		console.log(JSON.stringify(injectionStatus, null, 2));
		
		if (injectionStatus.modifications.length > 0) {
			print('\nModifications applied:', 'cyan');
			injectionStatus.modifications.forEach(mod => {
				print(`  • ${mod}`, 'green');
			});
		}
		
		if (injectionStatus.error) {
			print('\nError Details:', 'red');
			console.log(`  ${injectionStatus.error}`);
		}
	}
	
	await question('\nPress ENTER to continue...');
	
	// Step 5: Module Inspection
	printSection('Step 5: n8n Module Inspection');
	
	print('Inspecting @n8n/api-types...', 'gray');
	
	if (loadedModules['@n8n/api-types']) {
		const apiTypes = loadedModules['@n8n/api-types'];
		
		print('✓ Module loaded', 'green');
		
		if (apiTypes.chatHubLLMProviderSchema) {
			print('✓ chatHubLLMProviderSchema found', 'green');
			
			if (apiTypes.chatHubLLMProviderSchema.enum) {
				const providers = apiTypes.chatHubLLMProviderSchema.enum;
				print(`\nAvailable providers (${providers.length}):`, 'cyan');
				providers.forEach(provider => {
					const isGithub = provider === 'githubCopilot';
					const mark = isGithub ? '✓' : ' ';
					const color = isGithub ? 'green' : 'gray';
					print(`  ${mark} ${provider}`, color);
				});
				
				if (providers.includes('githubCopilot')) {
					print('\n✓ GitHub Copilot is in providers list!', 'green');
				} else {
					print('\n✗ GitHub Copilot NOT in providers list', 'red');
				}
			} else {
				print('✗ chatHubLLMProviderSchema.enum not found', 'red');
			}
		} else {
			print('✗ chatHubLLMProviderSchema not found', 'red');
		}
		
		print('\nChecking provider maps...', 'gray');
		
		try {
			const constants = require('n8n/dist/evaluation/chat-hub.constants');
			
			print('✓ chat-hub.constants loaded', 'green');
			
			if (constants.PROVIDER_CREDENTIAL_TYPE_MAP) {
				const hasGithub = 'githubCopilot' in constants.PROVIDER_CREDENTIAL_TYPE_MAP;
				print(`  PROVIDER_CREDENTIAL_TYPE_MAP: ${hasGithub ? '✓' : '✗'}`, hasGithub ? 'green' : 'red');
			}
			
			if (constants.PROVIDER_NODE_TYPE_MAP) {
				const hasGithub = 'githubCopilot' in constants.PROVIDER_NODE_TYPE_MAP;
				print(`  PROVIDER_NODE_TYPE_MAP: ${hasGithub ? '✓' : '✗'}`, hasGithub ? 'green' : 'red');
			}
		} catch (error) {
			print(`  Cannot inspect constants: ${error.message}`, 'gray');
		}
	} else {
		print('✗ @n8n/api-types not available', 'red');
		print('  This is expected in development environment', 'gray');
	}
	
	await question('\nPress ENTER to continue...');
	
	// Step 6: Diagnosis
	printSection('Step 6: Diagnosis & Recommendations');
	
	print('\n📊 Analysis Results:', 'bright');
	console.log();
	
	const isV2 = versionDetection.isN8nV2OrHigher();
	const hasChatHub = versionDetection.isChatHubAvailable();
	const isInjected = providerInjection.isProviderInjected();
	
	if (!isV2) {
		print('❌ Problem: n8n v1.x detected or version unknown', 'red');
		print('   Solution: Upgrade to n8n v2.0 or higher', 'yellow');
		print('   The provider injection feature requires n8n v2+', 'gray');
	}
	
	if (!hasChatHub) {
		print('❌ Problem: Chat Hub APIs not detected', 'red');
		print('   Solution: Ensure you are running inside n8n v2+ instance', 'yellow');
		print('   The injection must happen at n8n runtime, not in development', 'gray');
	}
	
	if (isV2 && hasChatHub && !isInjected) {
		print('❌ Problem: Injection failed despite compatible environment', 'red');
		print('   Solution: Check injection status for specific error', 'yellow');
		print('   Run with GITHUB_COPILOT_DEBUG=true for detailed logs', 'gray');
	}
	
	if (!isV2 || !hasChatHub) {
		print('\n💡 Development Environment Detected', 'cyan');
		print('   To test in production:', 'gray');
		print('   1. Install package in n8n v2+ instance', 'gray');
		print('   2. Set environment variable: GITHUB_COPILOT_AUTO_INJECT=true', 'gray');
		print('   3. Restart n8n', 'gray');
		print('   4. Check n8n logs for injection messages', 'gray');
		print('   5. Open Chat Hub and check providers list', 'gray');
	}
	
	print('\n📝 Next Steps:', 'cyan');
	print('   1. Run unit tests: npm test', 'gray');
	print('   2. Check logs in n8n instance (if running in production)', 'gray');
	print('   3. Verify n8n version: n8n --version', 'gray');
	print('   4. Report issues with injection status JSON', 'gray');
	
	// Save diagnostic report
	const report = {
		timestamp: new Date().toISOString(),
		environment: {
			nodeVersion: process.version,
			cwd: process.cwd(),
			env: {
				N8N_VERSION: process.env.N8N_VERSION,
				GITHUB_COPILOT_AUTO_INJECT: process.env.GITHUB_COPILOT_AUTO_INJECT,
				GITHUB_COPILOT_DEBUG: process.env.GITHUB_COPILOT_DEBUG
			}
		},
		detection: {
			versionInfo,
			isV2,
			chatHubAvailable: hasChatHub
		},
		injection: providerInjection.getInjectionStatus()
	};
	
	const reportPath = path.join(__dirname, 'diagnostic-report.json');
	fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
	
	print(`\n📄 Diagnostic report saved: ${reportPath}`, 'green');
	
	print('\n' + '='.repeat(70), 'gray');
	print('Debug session completed', 'bright');
	print('='.repeat(70), 'gray');
	
	rl.close();
}

// Run
main().catch(error => {
	console.error('\n❌ Fatal error:');
	console.error(error);
	rl.close();
	process.exit(1);
});
