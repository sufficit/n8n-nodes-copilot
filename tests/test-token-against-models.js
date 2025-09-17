/**
 * Debug script to test GitHub Copilot OAuth2 token and identify "unknown integration" issue
 */

const fs = require('fs');

async function debugUnknownIntegration() {
    console.log('🔍 GitHub Copilot OAuth2 Debug - Unknown Integration Issue\n');
    
    try {
        // Load token from file
        const token = fs.readFileSync('../.token', 'utf8').trim();
        
        if (!token.startsWith('gho_')) {
            throw new Error('Token deve ser um GitHub Copilot token (formato: gho_*)');
        }
        
        console.log(`✅ Token loaded (últimos 5): ...${token.slice(-5)}\n`);
        
        // Test 1: Different header combinations to identify the issue
        const headerVariations = [
            {
                name: 'Minimal Headers (Working)',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            },
            {
                name: 'Minimal + User-Agent',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'User-Agent': 'n8n-github-copilot/1.0.0'
                }
            },
            {
                name: 'VS Code Default Headers',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'User-Agent': 'vscode-copilot',
                    'Copilot-Integration-Id': 'vscode-chat',
                    'Editor-Version': 'vscode/1.85.0',
                    'Editor-Plugin-Version': 'copilot-chat/0.12.0',
                    'Content-Type': 'application/json'
                }
            },
            {
                name: 'VS Code Without Integration ID',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'User-Agent': 'vscode-copilot',
                    'Editor-Version': 'vscode/1.85.0',
                    'Editor-Plugin-Version': 'copilot-chat/0.12.0',
                    'Content-Type': 'application/json'
                }
            },
            {
                name: 'Only User-Agent vscode-copilot',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'User-Agent': 'vscode-copilot'
                }
            },
            {
                name: 'GitHub Standard Headers',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github+json',
                    'User-Agent': 'n8n-github-copilot/1.0.0'
                }
            },
            {
                name: 'OpenAI Compatible Headers',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'User-Agent': 'OpenAI/NodeJS'
                }
            }
        ];
        
        console.log('🧪 Testing different header combinations...\n');
        
        const results = [];
        
        for (const variation of headerVariations) {
            console.log(`📡 Testing: ${variation.name}`);
            console.log('Headers:', JSON.stringify(variation.headers, null, 2));
            
            try {
                const response = await fetch('https://api.githubcopilot.com/models', {
                    method: 'GET',
                    headers: variation.headers
                });
                
                console.log(`📊 Response: ${response.status} ${response.statusText}`);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log(`✅ SUCCESS! Found ${data.data?.length || 0} models`);
                    console.log('🎯 This header combination works!');
                    
                    // Store successful result
                    results.push({
                        name: variation.name,
                        status: 'SUCCESS',
                        modelCount: data.data?.length || 0,
                        headers: variation.headers
                    });
                    
                    // Show some models for reference
                    if (data.data && data.data.length > 0) {
                        console.log('📋 Available models:');
                        data.data.slice(0, 5).forEach(model => {
                            console.log(`   - ${model.id} (${model.owned_by})`);
                        });
                        if (data.data.length > 5) {
                            console.log(`   ... and ${data.data.length - 5} more models`);
                        }
                    }
                    console.log(''); // Continue testing other combinations
                } else {
                    const errorText = await response.text();
                    console.log(`❌ Error: ${errorText}`);
                    
                    // Store failed result
                    results.push({
                        name: variation.name,
                        status: 'FAILED',
                        error: errorText,
                        headers: variation.headers
                    });
                    
                    if (errorText.includes('unknown integration')) {
                        console.log('🔍 "unknown integration" error detected with this header set');
                    }
                }
            } catch (error) {
                console.log(`❌ Request failed: ${error.message}`);
                
                // Store error result
                results.push({
                    name: variation.name,
                    status: 'ERROR',
                    error: error.message,
                    headers: variation.headers
                });
                
                if (error.message.includes('400') || error.message.includes('unknown integration')) {
                    console.log(`🔑 Token completo para debug: ${token}`);
                }
            }
            
            console.log('─'.repeat(60));
        }
        
        // Test 2: Check token scopes via GitHub API
        console.log('\n🔐 Testing token scopes via GitHub API...');
        
        try {
            const scopeResponse = await fetch('https://api.github.com/user', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github+json',
                    'X-GitHub-Api-Version': '2022-11-28'
                }
            });
            
            console.log(`📊 GitHub API Response: ${scopeResponse.status}`);
            
            if (scopeResponse.ok) {
                const scopes = scopeResponse.headers.get('X-OAuth-Scopes');
                const acceptedScopes = scopeResponse.headers.get('X-Accepted-OAuth-Scopes');
                
                console.log(`✅ Current OAuth Scopes: ${scopes || 'Not available'}`);
                console.log(`📋 Accepted OAuth Scopes: ${acceptedScopes || 'Not available'}`);
                
                // Check if we have copilot scope
                if (scopes && scopes.includes('copilot')) {
                    console.log('✅ Copilot scope is present');
                } else {
                    console.log('❌ Copilot scope is MISSING - this is likely the issue!');
                }
            } else {
                console.log('❌ Cannot check token scopes');
            }
        } catch (error) {
            console.log(`❌ Scope check failed: ${error.message}`);
            console.log(`🔑 Token completo para debug: ${token}`);
        }
        
        return { success: results.some(r => r.status === 'SUCCESS'), results, error: results.length === 0 ? 'No tests completed' : null };
        
    } catch (error) {
        console.error('❌ Debug failed:', error.message);
        console.log(`🔑 Token completo para debug: ${token}`);
        return { success: results.some(r => r.status === 'SUCCESS'), results, error: error.message };
    }
}

// Run debug
debugUnknownIntegration()
    .then(result => {
        console.log('\n📈 Debug Summary:');
        console.log(`Status: ${result.success ? '✅ FOUND WORKING SOLUTIONS' : '❌ NO WORKING SOLUTIONS'}`);
        
        if (result.results) {
            console.log('\n📊 All Test Results:');
            
            // Show successful combinations first
            const successful = result.results.filter(r => r.status === 'SUCCESS');
            if (successful.length > 0) {
                console.log('\n✅ WORKING COMBINATIONS:');
                successful.forEach(r => {
                    console.log(`   🎯 ${r.name}: ${r.modelCount} models found`);
                });
            }
            
            // Show failed combinations
            const failed = result.results.filter(r => r.status !== 'SUCCESS');
            if (failed.length > 0) {
                console.log('\n❌ FAILED COMBINATIONS:');
                failed.forEach(r => {
                    console.log(`   ❌ ${r.name}: ${r.error || 'Unknown error'}`);
                });
            }
            
            // Show detailed working headers
            if (successful.length > 0) {
                console.log('\n🎯 Best Working Headers Configuration:');
                console.log(JSON.stringify(successful[0].headers, null, 2));
                console.log('\n💡 Recommendation: Use the minimal working headers in production');
            }
        }
        
        if (result.error && !result.success) {
            console.log(`\nScript Error: ${result.error}`);
            console.log('\n💡 Next Steps:');
            console.log('1. Check if token has correct OAuth scopes');
            console.log('2. Verify the OAuth app configuration in GitHub');
            console.log('3. Try regenerating the OAuth token with correct scopes');
        }
        
        process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
        console.error('Script error:', error);
        console.log('🔑 Token para debug manual:', fs.readFileSync('./.token', 'utf8').trim());
        process.exit(1);
    });