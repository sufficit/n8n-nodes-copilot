/**
 * Test script to verify OAuth scopes configuration
 * Tests the new GitHubCopilotApi credential with proper OAuth scopes
 */

const fs = require('fs');

async function testOAuthScopes() {
    console.log('🔍 Testing OAuth Scopes Configuration...\n');
    
    try {
        // Load token from file
        const token = fs.readFileSync('./.token', 'utf8').trim();
        
        if (!token.startsWith('gho_')) {
            throw new Error('Token deve ser um GitHub Copilot token (formato: gho_*)');
        }
        
        console.log(`✅ Token loaded: ${token.substring(0, 10)}...${token.substring(token.length - 4)}`);
        
        // Test GitHub Copilot Models API
        console.log('\n📡 Testing GitHub Copilot Models API...');
        
        const response = await fetch('https://api.githubcopilot.com/models', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'User-Agent': 'n8n-copilot-nodes/3.12.1',
                'Editor-Version': 'vscode/1.95.0',
                'Editor-Plugin-Version': 'copilot-chat/0.22.0',
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`📊 Response status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log(`✅ Models API successful! Found ${data.data?.length || 0} models`);
            
            // Show available models
            if (data.data && data.data.length > 0) {
                console.log('\n📋 Available Models:');
                data.data
                    .filter(model => model.model_picker_enabled !== false)
                    .slice(0, 5) // Show first 5 models
                    .forEach(model => {
                        console.log(`  • ${model.name} (${model.created_by})`);
                    });
                
                if (data.data.length > 5) {
                    console.log(`  ... and ${data.data.length - 5} more models`);
                }
            }
            
            return { success: true, models: data.data?.length || 0 };
        } else {
            const errorText = await response.text();
            console.log(`❌ API Error: ${response.status} - ${errorText}`);
            return { success: false, error: errorText };
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        return { success: false, error: error.message };
    }
}

// Run test
testOAuthScopes()
    .then(result => {
        console.log('\n📈 Test Summary:');
        console.log(`Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
        if (result.models) {
            console.log(`Models: ${result.models} available`);
        }
        if (result.error) {
            console.log(`Error: ${result.error}`);
        }
        
        console.log('\n🎯 OAuth Scopes Status:');
        console.log('The GitHubCopilotApi credential should be configured with:');
        console.log('Scopes: "copilot user read:user read:org"');
        console.log('Authorization URL: https://github.com/login/oauth/authorize');
        console.log('Access Token URL: https://github.com/login/oauth/access_token');
        
        process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
        console.error('Script error:', error);
        process.exit(1);
    });