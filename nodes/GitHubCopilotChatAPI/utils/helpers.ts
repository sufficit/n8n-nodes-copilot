import { IExecuteFunctions } from 'n8n-workflow';
import { CopilotResponse } from './types';

export async function makeApiRequest(
    context: IExecuteFunctions, 
    endpoint: string, 
    body: Record<string, unknown>,
    hasMedia = false
): Promise<CopilotResponse> {
    const credentials = await context.getCredentials('githubApi');
    
    const headers: Record<string, string> = {
        'Authorization': `Bearer ${credentials.accessToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'n8n-github-copilot-chat-api-node',
    };

    // Add required header for vision/audio requests
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
        throw new Error(`GitHub Copilot API error: ${response.status} ${response.statusText}. ${errorText}`);
    }
    
    return await response.json() as CopilotResponse;
}

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