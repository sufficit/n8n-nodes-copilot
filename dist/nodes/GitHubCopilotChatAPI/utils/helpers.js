"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.estimateTokens = exports.getFileFromBinary = exports.downloadFileFromUrl = void 0;
exports.makeApiRequest = makeApiRequest;
exports.getImageMimeType = getImageMimeType;
exports.getImageMimeTypeFromFilename = getImageMimeTypeFromFilename;
exports.validateFileSize = validateFileSize;
const GitHubCopilotApiUtils_1 = require("../../../shared/utils/GitHubCopilotApiUtils");
async function makeApiRequest(context, endpoint, body, hasMedia = false, retryConfig) {
    return await (0, GitHubCopilotApiUtils_1.makeGitHubCopilotRequest)(context, endpoint, body, hasMedia, retryConfig);
}
exports.downloadFileFromUrl = GitHubCopilotApiUtils_1.downloadFileFromUrl;
exports.getFileFromBinary = GitHubCopilotApiUtils_1.getFileFromBinary;
exports.estimateTokens = GitHubCopilotApiUtils_1.estimateTokens;
function getImageMimeType(buffer) {
    const firstBytes = buffer.toString('hex', 0, 4);
    if (firstBytes.startsWith('ffd8'))
        return 'image/jpeg';
    if (firstBytes.startsWith('8950'))
        return 'image/png';
    if (firstBytes.startsWith('4749'))
        return 'image/gif';
    if (firstBytes.startsWith('5249'))
        return 'image/webp';
    return 'application/octet-stream';
}
function getImageMimeTypeFromFilename(filename) {
    const ext = filename.toLowerCase().split('.').pop();
    switch (ext) {
        case 'jpg':
        case 'jpeg':
            return 'image/jpeg';
        case 'png':
            return 'image/png';
        case 'gif':
            return 'image/gif';
        case 'webp':
            return 'image/webp';
        case 'bmp':
            return 'image/bmp';
        case 'tiff':
        case 'tif':
            return 'image/tiff';
        default:
            return 'application/octet-stream';
    }
}
function validateFileSize(buffer, maxSize = 20 * 1024 * 1024) {
    return buffer.length <= maxSize;
}
