"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processMediaFile = processMediaFile;
exports.isImageMimeType = isImageMimeType;
exports.validateImageFormat = validateImageFormat;
exports.getFileExtensionFromMimeType = getFileExtensionFromMimeType;
exports.suggestImageConversion = suggestImageConversion;
const index_1 = require("./index");
async function processMediaFile(context, itemIndex, source, mediaFile, mediaUrl, binaryProperty) {
    try {
        const imageResult = await (0, index_1.processImageFile)(context, itemIndex, source, mediaFile, mediaUrl, binaryProperty);
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
    }
    catch (error) {
        return {
            type: 'unknown',
            description: `Error processing image file: ${error instanceof Error ? error.message : 'Unknown error'}`,
            mimeType: 'unknown',
        };
    }
}
function isImageMimeType(mimeType) {
    const supportedFormats = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    return supportedFormats.includes(mimeType.toLowerCase());
}
function validateImageFormat(mimeType) {
    if (!isImageMimeType(mimeType)) {
        const supportedFormats = ['PNG', 'JPEG', 'GIF', 'WebP'];
        return {
            isValid: false,
            error: `Unsupported image format: ${mimeType}. GitHub Copilot API only supports: ${supportedFormats.join(', ')}`,
        };
    }
    return { isValid: true };
}
function getFileExtensionFromMimeType(mimeType) {
    const mimeToExt = {
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
function suggestImageConversion(mimeType) {
    const ext = getFileExtensionFromMimeType(mimeType);
    const supportedFormats = ['PNG', 'JPEG', 'GIF', 'WebP'];
    return (`Image format ${ext.toUpperCase()} is not supported by GitHub Copilot API. ` +
        `Please convert your image to one of these formats: ${supportedFormats.join(', ')}. ` +
        'Recommended: Convert to PNG or WebP for best compatibility.');
}
