/**
 * Extract GitHub Copilot OAuth Token from VS Code Cache
 * 
 * This script searches for the OAuth token in VS Code's storage locations:
 * - globalStorage (extension data)
 * - workspaceStorage (workspace-specific data)
 * - User data directory (settings, state)
 * 
 * The token is automatically refreshed by VS Code and stored in memory/disk cache.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// VS Code storage locations
const VSCODE_PATHS = {
    windows: {
        appData: path.join(os.homedir(), 'AppData', 'Roaming', 'Code'),
        localAppData: path.join(os.homedir(), 'AppData', 'Local', 'Code'),
    },
    linux: {
        config: path.join(os.homedir(), '.config', 'Code'),
        cache: path.join(os.homedir(), '.cache', 'vscode'),
    },
    darwin: {
        library: path.join(os.homedir(), 'Library', 'Application Support', 'Code'),
    }
};

// Detect OS
const platform = process.platform;
let basePaths = [];

if (platform === 'win32') {
    basePaths = [
        VSCODE_PATHS.windows.appData,
        VSCODE_PATHS.windows.localAppData,
    ];
} else if (platform === 'linux') {
    basePaths = [
        VSCODE_PATHS.linux.config,
        VSCODE_PATHS.linux.cache,
    ];
} else if (platform === 'darwin') {
    basePaths = [
        VSCODE_PATHS.darwin.library,
    ];
}

console.log('🔍 Searching for GitHub Copilot OAuth token in VS Code storage...\n');
console.log(`Platform: ${platform}`);
console.log(`Base paths to search: ${basePaths.length}\n`);

// Search patterns for token
const TOKEN_PATTERNS = [
    /tid=[a-f0-9]{32};exp=\d+;sku=[^"'\s]+/gi,
    /"token":\s*"(tid=[^"]+)"/gi,
    /"accessToken":\s*"(tid=[^"]+)"/gi,
    /'token':\s*'(tid=[^']+)'/gi,
    /Bearer\s+(tid=[^"'\s]+)/gi,
];

// File extensions to search
const SEARCH_EXTENSIONS = ['.json', '.db', '.sqlite', '.txt', '.log'];

// Directories to search
const SEARCH_DIRS = [
    'User/globalStorage',
    'User/workspaceStorage',
    'User/state',
    'CachedData',
    'logs',
];

let foundTokens = [];
let filesSearched = 0;
let directoriesSearched = 0;

/**
 * Search for token in file content
 */
function searchInFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        filesSearched++;
        
        for (const pattern of TOKEN_PATTERNS) {
            pattern.lastIndex = 0; // Reset regex
            let match;
            
            while ((match = pattern.exec(content)) !== null) {
                const token = match[1] || match[0];
                
                // Extract clean token
                let cleanToken = token.replace(/^Bearer\s+/i, '');
                cleanToken = cleanToken.replace(/^["']|["']$/g, '');
                cleanToken = cleanToken.replace(/\\n/g, '');  // Remove escaped newlines
                cleanToken = cleanToken.replace(/\n/g, '');   // Remove actual newlines
                
                // Validate token format
                if (cleanToken.startsWith('tid=') && cleanToken.includes('exp=')) {
                    foundTokens.push({
                        token: cleanToken,
                        file: filePath,
                        pattern: pattern.source.substring(0, 50) + '...',
                    });
                }
            }
        }
    } catch (error) {
        // Ignore read errors (binary files, permissions, etc.)
    }
}

/**
 * Recursively search directory
 */
function searchDirectory(dirPath, maxDepth = 3, currentDepth = 0) {
    if (currentDepth > maxDepth) return;
    
    try {
        if (!fs.existsSync(dirPath)) return;
        
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        directoriesSearched++;
        
        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            
            if (entry.isDirectory()) {
                // Skip node_modules and other large dirs
                if (entry.name === 'node_modules' || entry.name === '.git') continue;
                
                searchDirectory(fullPath, maxDepth, currentDepth + 1);
            } else if (entry.isFile()) {
                const ext = path.extname(entry.name);
                
                // Search relevant file types
                if (SEARCH_EXTENSIONS.includes(ext) || entry.name.includes('copilot')) {
                    searchInFile(fullPath);
                }
            }
        }
    } catch (error) {
        // Ignore permission errors
    }
}

/**
 * Parse token and extract information
 */
function parseToken(tokenString) {
    const params = {};
    tokenString.split(';').forEach(pair => {
        const [key, value] = pair.split('=');
        if (key && value) {
            params[key.trim()] = value.trim();
        }
    });
    
    return params;
}

/**
 * Check if token is valid (not expired)
 */
function isTokenValid(tokenString) {
    const params = parseToken(tokenString);
    
    if (!params.exp) return false;
    
    const expiration = parseInt(params.exp) * 1000;
    const now = Date.now();
    
    return expiration > now;
}

// Main search
console.log('Searching in VS Code directories...\n');

for (const basePath of basePaths) {
    console.log(`📂 Searching: ${basePath}`);
    
    // Search specific subdirectories
    for (const subDir of SEARCH_DIRS) {
        const fullPath = path.join(basePath, subDir);
        searchDirectory(fullPath);
    }
    
    // Also search base path
    searchDirectory(basePath, 1);
}

console.log(`\n✓ Searched ${directoriesSearched} directories and ${filesSearched} files\n`);

// Remove duplicates
const uniqueTokens = [];
const tokenSet = new Set();

for (const item of foundTokens) {
    if (!tokenSet.has(item.token)) {
        tokenSet.add(item.token);
        uniqueTokens.push(item);
    }
}

if (uniqueTokens.length === 0) {
    console.log('❌ No OAuth tokens found in VS Code storage.\n');
    console.log('💡 Suggestions:');
    console.log('   1. Make sure GitHub Copilot is active in VS Code');
    console.log('   2. Trigger a Copilot Chat request to refresh the token');
    console.log('   3. Check if VS Code is running with a different user profile');
    console.log('   4. Try using the proxy capture method (mitmproxy)\n');
    process.exit(1);
}

console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log(`                    FOUND ${uniqueTokens.length} OAUTH TOKEN(S)                    `);
console.log('═══════════════════════════════════════════════════════════════════════════════\n');

// Analyze each token
const validTokens = [];

for (let i = 0; i < uniqueTokens.length; i++) {
    const item = uniqueTokens[i];
    const params = parseToken(item.token);
    const valid = isTokenValid(item.token);
    
    console.log(`Token #${i + 1}:`);
    console.log(`  File: ${item.file}`);
    console.log(`  Length: ${item.token.length} characters`);
    console.log(`  Parameters: ${Object.keys(params).length}`);
    
    if (params.exp) {
        const expTimestamp = parseInt(params.exp);
        if (!isNaN(expTimestamp) && expTimestamp > 0) {
            const expDate = new Date(expTimestamp * 1000);
            const now = new Date();
            const minutesLeft = Math.floor((expDate - now) / 1000 / 60);
            
            console.log(`  Expiration: ${expDate.toISOString()}`);
            console.log(`  Status: ${valid ? '✓ VALID' : '✗ EXPIRED'}`);
            
            if (valid) {
                console.log(`  Time left: ${minutesLeft} minutes`);
                validTokens.push(item);
            }
        } else {
            console.log(`  Expiration: Invalid timestamp`);
            console.log(`  Status: ✗ INVALID`);
        }
    }
    
    if (params.sku) {
        console.log(`  Subscription: ${params.sku}`);
    }
    
    console.log(`  Preview: ${item.token.substring(0, 80)}...`);
    console.log();
}

// Save the best token
if (validTokens.length > 0) {
    // Use the most recently found valid token
    const bestToken = validTokens[validTokens.length - 1];
    
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log('                         SAVING BEST TOKEN                                      ');
    console.log('═══════════════════════════════════════════════════════════════════════════════\n');
    
    // Save to .token.oauth file
    const tokenFile = './.token.oauth';
    fs.writeFileSync(tokenFile, bestToken.token, 'utf8');
    
    console.log(`✓ Saved to: ${tokenFile}`);
    console.log(`✓ Token length: ${bestToken.token.length} characters`);
    console.log(`✓ Source: ${path.basename(bestToken.file)}`);
    
    const params = parseToken(bestToken.token);
    if (params.exp) {
        const expDate = new Date(parseInt(params.exp) * 1000);
        const minutesLeft = Math.floor((expDate - Date.now()) / 1000 / 60);
        console.log(`✓ Valid for: ${minutesLeft} minutes`);
    }
    
    console.log('\n💡 Usage:');
    console.log('   const token = fs.readFileSync("./.token.oauth", "utf8").trim();');
    console.log('   headers: { Authorization: `Bearer ${token}` }\n');
    
    // Also save detailed info
    const infoFile = './.token.oauth.info.json';
    const tokenInfo = {
        token: bestToken.token,
        sourceFile: bestToken.file,
        extractedAt: new Date().toISOString(),
        parameters: parseToken(bestToken.token),
        expiresAt: params.exp ? new Date(parseInt(params.exp) * 1000).toISOString() : null,
    };
    
    fs.writeFileSync(infoFile, JSON.stringify(tokenInfo, null, 2), 'utf8');
    console.log(`✓ Token info saved to: ${infoFile}\n`);
    
} else {
    console.log('⚠️  All found tokens are EXPIRED\n');
    console.log('💡 Please trigger a new Copilot Chat request in VS Code to refresh the token\n');
    
    // Save the most recent expired token for reference
    if (uniqueTokens.length > 0) {
        const latestToken = uniqueTokens[uniqueTokens.length - 1];
        const tokenFile = './.token.oauth.expired';
        fs.writeFileSync(tokenFile, latestToken.token, 'utf8');
        console.log(`ℹ️  Saved expired token to: ${tokenFile} (for reference)\n`);
    }
}

console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('                              SEARCH COMPLETE                                   ');
console.log('═══════════════════════════════════════════════════════════════════════════════\n');
