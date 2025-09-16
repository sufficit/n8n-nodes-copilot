import { IExecuteFunctions } from 'n8n-workflow';
import { ProcessedFileResult, OptimizationOptions } from './types';
import { downloadFileFromUrl, getFileFromBinary, getImageMimeType, validateFileSize, estimateTokens } from './helpers';

export async function processImageFile(
    context: IExecuteFunctions,
    itemIndex: number,
    imageSource: string,
    imageFile?: string,
    imageUrl?: string,
    imageProperty?: string,
    optimization?: OptimizationOptions
): Promise<ProcessedFileResult> {
    let imageBuffer: Buffer;
    let filename: string;

    // Get image data based on source
    switch (imageSource) {
        case 'file':
            if (!imageFile) {
                throw new Error('Image file content is required when source is "file"');
            }
            imageBuffer = Buffer.from(imageFile, 'base64');
            filename = 'uploaded_image.jpg';
            break;

        case 'url':
            if (!imageUrl) {
                throw new Error('Image URL is required when source is "url"');
            }
            imageBuffer = await downloadFileFromUrl(imageUrl);
            filename = imageUrl.split('/').pop() || 'downloaded_image.jpg';
            break;

        case 'binary':
            if (!imageProperty) {
                throw new Error('Image property name is required when source is "binary"');
            }
            imageBuffer = await getFileFromBinary(context, itemIndex, imageProperty);
            
            // Get filename from binary metadata
            const items = context.getInputData();
            const item = items[itemIndex];
            filename = item.binary?.[imageProperty]?.fileName || 'binary_image.jpg';
            break;

        default:
            throw new Error(`Invalid image source: ${imageSource}`);
    }

    // Apply optimization if provided
    if (optimization) {
        imageBuffer = await optimizeImage(imageBuffer, optimization);
    }

    // Validate file size (max 20MB for images)
    validateFileSize(imageBuffer, 20480);

    // Check if we need to compress further
    const base64Image = imageBuffer.toString('base64');
    const estimatedTokens = estimateTokens(base64Image);
    
    if (estimatedTokens > 50000) { // 50k tokens threshold for images
        // Try to compress further
        const compressedBuffer = await optimizeImage(imageBuffer, { 
            quality: 70, 
            maxSizeKB: optimization?.maxSizeKB || 1024 
        });
        
        const compressedBase64 = compressedBuffer.toString('base64');
        const compressedTokens = estimateTokens(compressedBase64);
        
        if (compressedTokens < estimatedTokens) {
            return {
                data: compressedBase64,
                mimeType: getImageMimeType(filename),
                filename,
                size: compressedBuffer.length,
                estimatedTokens: compressedTokens
            };
        }
    }

    const mimeType = getImageMimeType(filename);

    return {
        data: base64Image,
        mimeType,
        filename,
        size: imageBuffer.length,
        estimatedTokens
    };
}

async function optimizeImage(buffer: Buffer, options: OptimizationOptions): Promise<Buffer> {
    // Check if we need compression
    if (options.maxSizeKB && buffer.length / 1024 > options.maxSizeKB) {
        // Simple compression by reducing size (placeholder implementation)
        // In a real scenario, you would use sharp or jimp library
        const compressionRatio = Math.min(0.8, options.maxSizeKB / (buffer.length / 1024));
        const targetSize = Math.floor(buffer.length * compressionRatio);
        
        if (targetSize < buffer.length) {
            // Create a smaller buffer as a simple compression simulation
            // This is a placeholder - real image compression would need an image processing library
            return buffer.slice(0, Math.max(targetSize, 1024)); // Minimum 1KB
        }
    }
    
    return buffer;
}

export function compressImageToTokenLimit(base64Data: string, maxTokens = 50000): string {
    const estimatedTokens = estimateTokens(base64Data);
    
    if (estimatedTokens <= maxTokens) {
        return base64Data;
    }
    
    // Simple compression by truncating data (placeholder)
    // Real implementation would resize/compress the actual image
    const compressionRatio = maxTokens / estimatedTokens;
    const targetLength = Math.floor(base64Data.length * compressionRatio);
    
    return base64Data.slice(0, Math.max(targetLength, 1000)); // Minimum size
}

export function resizeImageDimensions(
    originalWidth: number, 
    originalHeight: number, 
    maxWidth = 1024, 
    maxHeight = 1024
): { width: number; height: number } {
    let { width, height } = { width: originalWidth, height: originalHeight };
    
    if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
    }
    
    if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
    }
    
    return { width: Math.round(width), height: Math.round(height) };
}