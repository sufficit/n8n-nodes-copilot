import { IExecuteFunctions } from 'n8n-workflow';
export declare function processMediaFile(context: IExecuteFunctions, itemIndex: number, source: 'manual' | 'url' | 'binary', mediaFile?: string, mediaUrl?: string, binaryProperty?: string): Promise<{
    type: 'image' | 'unknown';
    dataUrl?: string;
    description: string;
    mimeType: string;
}>;
export declare function isImageMimeType(mimeType: string): boolean;
export declare function validateImageFormat(mimeType: string): {
    isValid: boolean;
    error?: string;
};
export declare function getFileExtensionFromMimeType(mimeType: string): string;
export declare function suggestImageConversion(mimeType: string): string;
