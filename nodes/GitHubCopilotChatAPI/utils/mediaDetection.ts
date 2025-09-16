import { IExecuteFunctions } from 'n8n-workflow';
import { processImageFile } from './index';

/**
 * Process image file for GitHub Copilot API
 */
export async function processMediaFile(
    context: IExecuteFunctions,
    itemIndex: number,
    source: 'manual' | 'url' | 'binary',
    mediaFile?: string,
    mediaUrl?: string,
    binaryProperty?: string,
): Promise<{
    type: 'image' | 'unknown';
    dataUrl?: string;
    description: string;
    mimeType: string;
}> {
    try {
        // Process as image
        const imageResult = await processImageFile(
            context,
            itemIndex,
            source,
            mediaFile,
            mediaUrl,
            binaryProperty
        );
        
        // Validate image format for GitHub Copilot API
        const formatValidation = validateImageFormat(imageResult.mimeType);
        if (!formatValidation.isValid) {
            throw new Error(suggestImageConversion(imageResult.mimeType));
        }
        
        return {
            type: 'image',
            dataUrl: `data:${imageResult.mimeType};base64,${imageResult.data}`,
            description: `Image file: ${imageResult.filename} (${Math.round(imageResult.size / 1024)}KB, ${imageResult.mimeType})`,
            mimeType: imageResult.mimeType,
        };
    } catch (error) {
        return {
            type: 'unknown',
            description: `Error processing image file: ${error instanceof Error ? error.message : 'Unknown error'}`,
            mimeType: 'unknown',
        };
    }
}

/**
 * Determine if MIME type is supported for images by GitHub Copilot API
 */
export function isImageMimeType(mimeType: string): boolean {
    const supportedFormats = [
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/gif',
        'image/webp'
    ];
    return supportedFormats.includes(mimeType.toLowerCase());
}

/**
 * Validate image format for GitHub Copilot API
 */
export function validateImageFormat(mimeType: string): { isValid: boolean; error?: string } {
    if (!isImageMimeType(mimeType)) {
        const supportedFormats = ['PNG', 'JPEG', 'GIF', 'WebP'];
        return {
            isValid: false,
            error: `Unsupported image format: ${mimeType}. GitHub Copilot API only supports: ${supportedFormats.join(', ')}`
        };
    }
    return { isValid: true };
}

/**
 * Get file extension from MIME type
 */
export function getFileExtensionFromMimeType(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
        'image/png': 'png',
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'image/bmp': 'bmp',
        'image/tiff': 'tiff',
        'image/svg+xml': 'svg',
    };
    return mimeToExt[mimeType.toLowerCase()] || 'unknown';
}

/**
 * Suggest conversion options for unsupported formats
 */
export function suggestImageConversion(mimeType: string): string {
    const ext = getFileExtensionFromMimeType(mimeType);
    const supportedFormats = ['PNG', 'JPEG', 'GIF', 'WebP'];
    
    return `Image format ${ext.toUpperCase()} is not supported by GitHub Copilot API. ` +
           `Please convert your image to one of these formats: ${supportedFormats.join(', ')}. ` +
           `Recommended: Convert to PNG or WebP for best compatibility.`;
}