"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processImageFile = processImageFile;
exports.compressImageToTokenLimit = compressImageToTokenLimit;
exports.resizeImageDimensions = resizeImageDimensions;
const helpers_1 = require("./helpers");
async function processImageFile(context, itemIndex, imageSource, imageFile, imageUrl, imageProperty, optimization) {
    var _a, _b;
    let imageBuffer;
    let filename;
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
            imageBuffer = await (0, helpers_1.downloadFileFromUrl)(imageUrl);
            filename = imageUrl.split('/').pop() || 'downloaded_image.jpg';
            break;
        case 'binary': {
            if (!imageProperty) {
                throw new Error('Image property name is required when source is "binary"');
            }
            imageBuffer = await (0, helpers_1.getFileFromBinary)(context, itemIndex, imageProperty);
            const items = context.getInputData();
            const item = items[itemIndex];
            filename = ((_b = (_a = item.binary) === null || _a === void 0 ? void 0 : _a[imageProperty]) === null || _b === void 0 ? void 0 : _b.fileName) || 'binary_image.jpg';
            break;
        }
        default:
            throw new Error(`Invalid image source: ${imageSource}`);
    }
    if (optimization) {
        imageBuffer = await optimizeImage(imageBuffer, optimization);
    }
    (0, helpers_1.validateFileSize)(imageBuffer, 20480);
    const base64Image = imageBuffer.toString('base64');
    const estimatedTokens = (0, helpers_1.estimateTokens)(base64Image);
    if (estimatedTokens > 50000) {
        const compressedBuffer = await optimizeImage(imageBuffer, {
            quality: 70,
            maxSizeKB: (optimization === null || optimization === void 0 ? void 0 : optimization.maxSizeKB) || 1024,
        });
        const compressedBase64 = compressedBuffer.toString('base64');
        const compressedTokens = (0, helpers_1.estimateTokens)(compressedBase64);
        if (compressedTokens < estimatedTokens) {
            return {
                data: compressedBase64,
                mimeType: (0, helpers_1.getImageMimeType)(compressedBuffer),
                filename,
                size: compressedBuffer.length,
                estimatedTokens: compressedTokens,
            };
        }
    }
    const mimeType = (0, helpers_1.getImageMimeType)(imageBuffer);
    return {
        data: base64Image,
        mimeType,
        filename,
        size: imageBuffer.length,
        estimatedTokens,
    };
}
async function optimizeImage(buffer, options) {
    if (options.maxSizeKB && buffer.length / 1024 > options.maxSizeKB) {
        const compressionRatio = Math.min(0.8, options.maxSizeKB / (buffer.length / 1024));
        const targetSize = Math.floor(buffer.length * compressionRatio);
        if (targetSize < buffer.length) {
            return buffer.slice(0, Math.max(targetSize, 1024));
        }
    }
    return buffer;
}
function compressImageToTokenLimit(base64Data, maxTokens = 50000) {
    const estimatedTokens = (0, helpers_1.estimateTokens)(base64Data);
    if (estimatedTokens <= maxTokens) {
        return base64Data;
    }
    const compressionRatio = maxTokens / estimatedTokens;
    const targetLength = Math.floor(base64Data.length * compressionRatio);
    return base64Data.slice(0, Math.max(targetLength, 1000));
}
function resizeImageDimensions(originalWidth, originalHeight, maxWidth = 1024, maxHeight = 1024) {
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
