import { IExecuteFunctions } from 'n8n-workflow';

// Interface for OAuth2 credentials
interface OAuth2Credentials {
    accessToken?: string;
    access_token?: string;
    token?: string;
    oauthTokenData?: {
        access_token?: string;
    };
    [key: string]: unknown;
}

// Interface for manual credentials (used by ChatModel)
interface ManualCredentials {
    token?: string;
    accessToken?: string;
    [key: string]: unknown;
}

// GitHub Copilot API Response interface
export interface CopilotResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Array<{
        index: number;
        message: {
            role: string;
            content: string;
        };
        finish_reason: string;
    }>;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

/**
 * Makes an API request to GitHub Copilot API
 * Works with both OAuth2 and manual token credentials
 */
export async function makeGitHubCopilotRequest(
    context: IExecuteFunctions, 
    endpoint: string, 
    body: Record<string, unknown>,
    credentialType: 'githubCopilotApi' | 'githubApiManual' = 'githubCopilotApi',
    hasMedia = false
): Promise<CopilotResponse> {
    
    let token: string;
    
    // Extract token based on credential type
    if (credentialType === 'githubCopilotApi') {
        // GitHub Copilot OAuth2 credentials with correct scopes
        const credentials = await context.getCredentials('githubCopilotApi') as OAuth2Credentials;
        
        // Debug: Log credential structure for OAuth2
        console.log('🔍 OAuth2 Credentials Debug:', Object.keys(credentials));
        
        // OAuth2 credentials might have different property names
        token = (
            credentials.accessToken || 
            credentials.access_token || 
            credentials.oauthTokenData?.access_token ||
            credentials.token
        ) as string;

        // Validate OAuth2 token exists
        if (!token) {
            console.error('❌ Available OAuth2 credential properties:', Object.keys(credentials));
            console.error('❌ Full OAuth2 credential object:', JSON.stringify(credentials, null, 2));
            throw new Error('GitHub Copilot: No access token found in OAuth2 credentials. Available properties: ' + Object.keys(credentials).join(', '));
        }
        
    } else {
        // Manual credentials (for ChatModel)
        const credentials = await context.getCredentials('githubApiManual') as ManualCredentials;
        
        console.log('🔍 Manual Credentials Debug:', Object.keys(credentials));
        
        token = credentials.token || credentials.accessToken as string;
        
        // Validate manual token exists
        if (!token) {
            console.error('❌ Available manual credential properties:', Object.keys(credentials));
            throw new Error('GitHub Copilot: No access token found in manual credentials. Available properties: ' + Object.keys(credentials).join(', '));
        }
    }

    // Debug: Show token info for troubleshooting
    const tokenPrefix = token.substring(0, Math.min(4, token.indexOf('_') + 1)) || token.substring(0, 4);
    const tokenSuffix = token.substring(Math.max(0, token.length - 5));
    console.log(`🔍 GitHub Copilot ${credentialType} Debug: Using token ${tokenPrefix}...${tokenSuffix}`);
    
    // Note: GitHub Copilot accepts different token formats
    if (!token.startsWith('gho_') && !token.startsWith('ghu_') && !token.startsWith('github_pat_')) {
        console.warn(`⚠️ Unexpected token format: ${tokenPrefix}...${tokenSuffix}. Trying API call anyway.`);
    }
    
    // Prepare headers for GitHub Copilot API (exact VS Code format)
    const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'vscode-copilot',
        // Critical headers for GitHub Copilot API integration
        'Copilot-Integration-Id': 'vscode-chat',
        'Editor-Version': 'vscode/1.85.0',
        'Editor-Plugin-Version': 'copilot-chat/0.12.0',
        'X-Request-Id': `n8n-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        'Openai-Intent': 'conversation-panel',
    };

    // Add required headers for vision/audio requests
    if (hasMedia) {
        headers['Copilot-Vision-Request'] = 'true';
        headers['Copilot-Media-Request'] = 'true';
    }
    
    const options = {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    };

    // Use GitHub Copilot official API endpoint
    const response = await fetch(`https://api.githubcopilot.com${endpoint}`, options);
    
    if (!response.ok) {
        const errorText = await response.text();
        
        // Include token info in error for debugging
        const tokenInfo = `${tokenPrefix}...${tokenSuffix}`;
        
        console.error(`❌ GitHub Copilot API Error: ${response.status} ${response.statusText}`);
        console.error(`❌ Error details: ${errorText}`);
        console.error(`❌ Used credential type: ${credentialType}`);
        console.error(`❌ Token format used: ${tokenInfo}`);
        
        // Enhanced error message with token info for debugging
        const enhancedError = `GitHub Copilot API error: ${response.status} ${response.statusText}. ${errorText} [Token used: ${tokenInfo}]`;
        
        throw new Error(enhancedError);
    }
    
    return await response.json() as CopilotResponse;
}

/**
 * Utility functions for file handling (shared between nodes)
 */
export async function downloadFileFromUrl(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to download file from URL: ${response.status} ${response.statusText}`);
    }
    return Buffer.from(await response.arrayBuffer());
}

export async function getFileFromBinary(
    context: IExecuteFunctions, 
    itemIndex: number, 
    propertyName: string
): Promise<Buffer> {
    const items = context.getInputData();
    const item = items[itemIndex];
    
    if (!item.binary || !item.binary[propertyName]) {
        throw new Error(`No binary data found in property "${propertyName}"`);
    }
    
    const binaryData = item.binary[propertyName];
    
    if (binaryData.data) {
        // Data is base64 encoded
        return Buffer.from(binaryData.data, 'base64');
    } else if (binaryData.id) {
        // Data is in binary data manager
        return await context.helpers.getBinaryDataBuffer(itemIndex, propertyName);
    } else {
        throw new Error(`Invalid binary data format in property "${propertyName}"`);
    }
}

export function getImageMimeType(filename: string): string {
    const ext = filename.toLowerCase().split('.').pop();
    switch (ext) {
        case 'jpg':
        case 'jpeg':
            return 'image/jpeg';
        case 'png':
            return 'image/png';
        case 'webp':
            return 'image/webp';
        case 'gif':
            return 'image/gif';
        default:
            return 'image/jpeg';
    }
}

export function getAudioMimeType(filename: string): string {
    const ext = filename.toLowerCase().split('.').pop();
    switch (ext) {
        case 'mp3':
            return 'audio/mpeg';
        case 'wav':
            return 'audio/wav';
        case 'm4a':
            return 'audio/mp4';
        case 'flac':
            return 'audio/flac';
        case 'ogg':
            return 'audio/ogg';
        case 'aac':
            return 'audio/aac';
        default:
            return 'audio/mpeg';
    }
}

export function validateFileSize(buffer: Buffer, maxSizeKB = 1024): void {
    const sizeKB = buffer.length / 1024;
    if (sizeKB > maxSizeKB) {
        throw new Error(`File size ${sizeKB.toFixed(2)}KB exceeds limit of ${maxSizeKB}KB`);
    }
}

export function estimateTokens(base64String: string): number {
    // Rough estimation: base64 characters / 4 * 3 for bytes, then / 4 for tokens
    return Math.ceil((base64String.length / 4 * 3) / 4);
}

export function validateTokenLimit(estimatedTokens: number, maxTokens = 128000): { 
    valid: boolean; 
    message?: string 
} {
    if (estimatedTokens <= maxTokens) {
        return { valid: true };
    }
    
    return {
        valid: false,
        message: `Content too large: ${estimatedTokens} tokens exceeds limit of ${maxTokens}. Consider using smaller files or text.`
    };
}

export function truncateToTokenLimit(content: string, maxTokens = 100000): { 
    content: string; 
    truncated: boolean; 
    originalTokens: number; 
    finalTokens: number 
} {
    const originalTokens = Math.ceil(content.length / 4); // Rough estimate for text
    
    if (originalTokens <= maxTokens) {
        return {
            content,
            truncated: false,
            originalTokens,
            finalTokens: originalTokens
        };
    }
    
    const targetLength = Math.floor(content.length * (maxTokens / originalTokens));
    const truncatedContent = content.slice(0, targetLength) + '...[truncated]';
    
    return {
        content: truncatedContent,
        truncated: true,
        originalTokens,
        finalTokens: Math.ceil(truncatedContent.length / 4)
    };
}