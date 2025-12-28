import { IExecuteFunctions } from 'n8n-workflow';
import { ProcessedFileResult, OptimizationOptions } from './types';
export declare function processImageFile(context: IExecuteFunctions, itemIndex: number, imageSource: string, imageFile?: string, imageUrl?: string, imageProperty?: string, optimization?: OptimizationOptions): Promise<ProcessedFileResult>;
export declare function compressImageToTokenLimit(base64Data: string, maxTokens?: number): string;
export declare function resizeImageDimensions(originalWidth: number, originalHeight: number, maxWidth?: number, maxHeight?: number): {
    width: number;
    height: number;
};
