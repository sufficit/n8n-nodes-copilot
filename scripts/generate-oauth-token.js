/**
 * Generate GitHub Copilot OAuth Token (tid=...)
 * 
 * This script replicates the EXACT request that VS Code makes to generate
 * the OAuth token with all parameters (tid, exp, sku, chat, mcp, etc.)
 * 
 * Based on reverse engineering VS Code's authentication flow
 */

const https = require('https');
const fs = require('fs');
const crypto = require('crypto');

console.log('🔐 GitHub Copilot OAuth Token Generator\n');
console.log('This script generates the OAuth token (tid=...) exactly like VS Code does\n');
console.log('═'.repeat(80) + '\n');

/**
 * Generate machine ID (like VS Code does)
 * VS Code generates a SHA-256 hash of machine-specific data
 */
function generateMachineId() {
    // VS Code uses MAC address + hostname + other system info
    // For our purposes, we'll generate a persistent ID
    const machineIdFile = './.machine-id';
    
    if (fs.existsSync(machineIdFile)) {
        const existingId = fs.readFileSync(machineIdFile, 'utf8').trim();
        console.log(`✓ Using existing machine ID: ${existingId.substring(0, 20)}...`);
        return existingId;
    }
    
    // Generate new machine ID
    const randomData = crypto.randomBytes(32);
    const machineId = crypto.createHash('sha256').update(randomData).digest('hex');
    
    fs.writeFileSync(machineIdFile, machineId);
    console.log(`✓ Generated new machine ID: ${machineId.substring(0, 20)}...`);
    
    return machineId;
}

/**
 * Generate session ID (like VS Code does)
 * Format: UUID + timestamp
 */
function generateSessionId() {
    const uuid = crypto.randomUUID();
    const timestamp = Date.now();
    return `${uuid}${timestamp}`;
}

/**
 * Make request to copilot_internal/v2/token endpoint
 * This is the EXACT endpoint VS Code uses to get OAuth tokens
 */
function generateOAuthToken(githubToken, machineId, sessionId) {
    return new Promise((resolve, reject) => {
        console.log('📤 Making request to GitHub Copilot token endpoint...\n');
        
        const options = {
            hostname: 'api.github.com',
            path: '/copilot_internal/v2/token',
            method: 'GET',
            headers: {
                // CRITICAL: These headers must match VS Code exactly
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/json',
                'User-Agent': 'GitHubCopilotChat/0.32.3',
                'Editor-Version': 'vscode/1.105.1',
                'Editor-Plugin-Version': 'copilot-chat/0.32.3',
                'Vscode-Machineid': machineId,
                'Vscode-Sessionid': sessionId,
                'X-GitHub-Api-Version': '2025-08-20'
            }
        };

        console.log('Request details:');
        console.log(`  Endpoint: GET https://api.github.com/copilot_internal/v2/token`);
        console.log(`  Authorization: token ${githubToken.substring(0, 20)}...`);
        console.log(`  Vscode-Machineid: ${machineId.substring(0, 30)}...`);
        console.log(`  Vscode-Sessionid: ${sessionId.substring(0, 40)}...`);
        console.log(`  Editor-Version: vscode/1.105.1`);
        console.log(`  Editor-Plugin-Version: copilot-chat/0.32.3\n`);

        const startTime = Date.now();
        const req = https.request(options, (res) => {
            const duration = Date.now() - startTime;
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                console.log(`⏱️  Response: ${res.statusCode} ${res.statusMessage} (${duration}ms)\n`);

                if (res.statusCode === 200) {
                    try {
                        const response = JSON.parse(data);
                        
                        console.log('✅ SUCCESS! OAuth token generated!\n');
                        console.log('📋 Response details:');
                        console.log(`   Token type: ${typeof response.token}`);
                        console.log(`   Token length: ${response.token?.length || 0} characters`);
                        console.log(`   Expires at: ${response.expires_at ? new Date(response.expires_at * 1000).toISOString() : 'N/A'}`);
                        console.log(`   Chat enabled: ${response.chat_enabled}`);
                        console.log(`   SKU: ${response.sku || 'N/A'}`);
                        
                        if (response.limited_user_quotas) {
                            console.log(`   Quotas: chat=${response.limited_user_quotas.chat}, completions=${response.limited_user_quotas.completions}`);
                        }
                        
                        console.log('\n📊 Full response:');
                        console.log(JSON.stringify(response, null, 2));
                        
                        resolve(response);
                    } catch (error) {
                        console.error('❌ Failed to parse response:', error.message);
                        console.log('Raw response:', data);
                        reject(error);
                    }
                } else if (res.statusCode === 401) {
                    console.error('❌ 401 UNAUTHORIZED');
                    console.log('   GitHub token is invalid or expired');
                    console.log('   Run: node scripts/authenticate.js');
                    console.log(`   Response: ${data}\n`);
                    reject(new Error('Invalid GitHub token'));
                } else if (res.statusCode === 403) {
                    console.error('❌ 403 FORBIDDEN');
                    console.log('   You may not have access to GitHub Copilot');
                    console.log('   Check your subscription at: https://github.com/settings/copilot');
                    console.log(`   Response: ${data}\n`);
                    reject(new Error('Access denied'));
                } else {
                    console.error(`❌ Unexpected response: ${res.statusCode}`);
                    console.log(`   Response: ${data}\n`);
                    reject(new Error(`HTTP ${res.statusCode}`));
                }
            });
        });

        req.on('error', (error) => {
            console.error(`❌ Network error: ${error.message}\n`);
            reject(error);
        });

        req.end();
    });
}

/**
 * Test the generated OAuth token
 */
async function testOAuthToken(token) {
    return new Promise((resolve) => {
        console.log('\n🧪 Testing generated OAuth token...\n');

        const requestBody = JSON.stringify({
            model: 'text-embedding-3-small',
            input: ['Test OAuth token generation']
        });

        const options = {
            hostname: 'api.githubcopilot.com',
            path: '/embeddings',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(requestBody),
                'Editor-Version': 'vscode/1.105.1',
                'X-GitHub-Api-Version': '2025-08-20'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log('✅ OAuth token is VALID and WORKING!\n');
                    resolve(true);
                } else {
                    console.log(`⚠️  OAuth token test returned: ${res.statusCode}`);
                    console.log(`   Response: ${data.substring(0, 200)}\n`);
                    resolve(false);
                }
            });
        });

        req.on('error', (error) => {
            console.log(`❌ Test failed: ${error.message}\n`);
            resolve(false);
        });

        req.write(requestBody);
        req.end();
    });
}

/**
 * Main function
 */
async function main() {
    try {
        // Step 1: Load GitHub token
        console.log('📋 Step 1: Loading GitHub token...\n');
        
        let githubToken;
        
        // Try .token first
        if (fs.existsSync('./.token')) {
            githubToken = fs.readFileSync('./.token', 'utf8').trim();
            console.log(`✓ Loaded from .token: ${githubToken.substring(0, 20)}...\n`);
        } else if (fs.existsSync('./results/github-token.txt')) {
            githubToken = fs.readFileSync('./results/github-token.txt', 'utf8').trim();
            console.log(`✓ Loaded from results/github-token.txt: ${githubToken.substring(0, 20)}...\n`);
        } else {
            console.error('❌ No GitHub token found!\n');
            console.log('💡 Please run authentication first:');
            console.log('   node scripts/authenticate.js\n');
            process.exit(1);
        }

        // Validate token format
        if (!githubToken.startsWith('gho_') && !githubToken.startsWith('ghp_')) {
            console.log('⚠️  Warning: Token does not look like a GitHub token (gho_* or ghp_*)');
            console.log(`   Token starts with: ${githubToken.substring(0, 10)}...\n`);
        }

        // Step 2: Generate machine and session IDs
        console.log('📋 Step 2: Generating VS Code identifiers...\n');
        
        const machineId = generateMachineId();
        const sessionId = generateSessionId();
        
        console.log(`✓ Session ID: ${sessionId.substring(0, 40)}...\n`);

        // Step 3: Generate OAuth token
        console.log('📋 Step 3: Generating OAuth token...\n');
        console.log('═'.repeat(80) + '\n');
        
        const response = await generateOAuthToken(githubToken, machineId, sessionId);
        
        if (!response.token) {
            console.error('❌ Response does not contain token!\n');
            process.exit(1);
        }

        // Step 4: Save OAuth token
        console.log('\n═'.repeat(80));
        console.log('📋 Step 4: Saving OAuth token...\n');
        
        const oauthToken = response.token;
        
        fs.writeFileSync('./.token.oauth', oauthToken);
        console.log(`✓ Saved to: ./.token.oauth`);
        console.log(`✓ Token length: ${oauthToken.length} characters`);
        
        // Parse token to show parameters
        const params = {};
        oauthToken.split(';').forEach(pair => {
            const [key, value] = pair.split('=');
            if (key && value) params[key] = value;
        });
        
        console.log(`✓ Parameters: ${Object.keys(params).length}`);
        console.log('\n📊 Token parameters:');
        Object.keys(params).slice(0, 10).forEach(key => {
            const value = params[key];
            const displayValue = value.length > 40 ? value.substring(0, 40) + '...' : value;
            console.log(`   ${key}: ${displayValue}`);
        });
        
        // Save detailed info
        const tokenInfo = {
            token: oauthToken,
            generatedAt: new Date().toISOString(),
            githubToken: githubToken.substring(0, 20) + '...',
            machineId: machineId,
            sessionId: sessionId,
            response: response,
            parameters: params
        };
        
        fs.writeFileSync('./.token.oauth.generated.json', JSON.stringify(tokenInfo, null, 2));
        console.log(`✓ Details saved to: ./.token.oauth.generated.json\n`);

        // Step 5: Test OAuth token
        console.log('═'.repeat(80));
        console.log('📋 Step 5: Testing OAuth token...');
        
        const isValid = await testOAuthToken(oauthToken);
        
        // Final summary
        console.log('═'.repeat(80));
        console.log('                        FINAL SUMMARY                           ');
        console.log('═'.repeat(80) + '\n');
        
        console.log('✅ OAuth Token Generation: SUCCESS\n');
        console.log('📋 Generated Files:');
        console.log('   .token.oauth - OAuth token (ready to use)');
        console.log('   .token.oauth.generated.json - Full generation details');
        console.log('   .machine-id - Persistent machine identifier\n');
        
        console.log('🔑 Token Details:');
        console.log(`   Type: OAuth token (tid=...)`);
        console.log(`   Length: ${oauthToken.length} characters`);
        console.log(`   Expires: ${response.expires_at ? new Date(response.expires_at * 1000).toLocaleString() : 'N/A'}`);
        console.log(`   Valid: ${isValid ? '✅ YES' : '❌ NO'}\n`);
        
        console.log('💡 Usage:');
        console.log('   const token = fs.readFileSync("./.token.oauth", "utf8").trim();');
        console.log('   headers: { Authorization: `Bearer ${token}` }\n');
        
        console.log('🔄 Refresh:');
        console.log('   Run this script again to generate a new token');
        console.log('   Tokens expire in ~20 minutes\n');
        
        console.log('═'.repeat(80) + '\n');
        
    } catch (error) {
        console.error('\n❌ FAILED:', error.message);
        process.exit(1);
    }
}

// Run
main().catch(console.error);
