import { IExecuteFunctions } from "n8n-workflow";

import {
  makeGitHubCopilotRequest,
  CopilotResponse,
  downloadFileFromUrl as sharedDownloadFileFromUrl,
  getFileFromBinary as sharedGetFileFromBinary,
  estimateTokens as sharedEstimateTokens,
} from "../../../shared/utils/GitHubCopilotApiUtils";

/**
 * API request wrapper for GitHub Copilot Chat API node
 * Uses OAuth2 credentials specifically configured for GitHub Copilot
 */
export async function makeApiRequest(
  context: IExecuteFunctions,
  endpoint: string,
  body: Record<string, unknown>,
  hasMedia = false,
): Promise<CopilotResponse> {
  return await makeGitHubCopilotRequest(context, endpoint, body, hasMedia);
}

// Re-export shared utility functions for backward compatibility
export const downloadFileFromUrl = sharedDownloadFileFromUrl;
export const getFileFromBinary = sharedGetFileFromBinary;
export const estimateTokens = sharedEstimateTokens;

// Media-specific functions (only used by ChatAPI node)
export function getImageMimeType(buffer: Buffer): string {
  const firstBytes = buffer.toString("hex", 0, 4);
  if (firstBytes.startsWith("ffd8")) return "image/jpeg";
  if (firstBytes.startsWith("8950")) return "image/png";
  if (firstBytes.startsWith("4749")) return "image/gif";
  if (firstBytes.startsWith("5249")) return "image/webp";
  return "application/octet-stream";
}

export function getImageMimeTypeFromFilename(filename: string): string {
  const ext = filename.toLowerCase().split(".").pop();
  switch (ext) {
  case "jpg":
  case "jpeg":
    return "image/jpeg";
  case "png":
    return "image/png";
  case "gif":
    return "image/gif";
  case "webp":
    return "image/webp";
  case "bmp":
    return "image/bmp";
  case "tiff":
  case "tif":
    return "image/tiff";
  default:
    return "application/octet-stream";
  }
}

export function validateFileSize(buffer: Buffer, maxSize = 20 * 1024 * 1024): boolean {
  return buffer.length <= maxSize;
}

// Export types
export type { CopilotResponse };
