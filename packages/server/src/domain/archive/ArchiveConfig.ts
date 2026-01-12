/**
 * Archive configuration constants
 */

/** Maximum archive file size in bytes (500MB) */
export const MAX_ARCHIVE_SIZE = 500 * 1024 * 1024;

/** Supported image extensions for archive extraction */
export const SUPPORTED_IMAGE_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.bmp',
] as const;

export type SupportedImageExtension = typeof SUPPORTED_IMAGE_EXTENSIONS[number];

/**
 * MIME type mapping for image extensions
 */
export const IMAGE_EXTENSION_MIME_MAP: Record<SupportedImageExtension, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
};

/**
 * Type guard to check if a string is a supported image extension
 */
export function isSupportedImageExtension(extension: string): extension is SupportedImageExtension {
  const ext = extension.toLowerCase();
  return SUPPORTED_IMAGE_EXTENSIONS.includes(ext as SupportedImageExtension);
}

/**
 * Get MIME type from file extension
 */
export function getMimeTypeFromExtension(extension: string): string {
  const lowerExt = extension.toLowerCase();
  if (!isSupportedImageExtension(lowerExt)) {
    return 'application/octet-stream';
  }
  return IMAGE_EXTENSION_MIME_MAP[lowerExt];
}
