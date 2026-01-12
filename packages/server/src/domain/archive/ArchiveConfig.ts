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
 * Get MIME type from file extension
 */
export function getMimeTypeFromExtension(extension: string): string {
  const ext = extension.toLowerCase() as SupportedImageExtension;
  const mimeType = IMAGE_EXTENSION_MIME_MAP[ext] as string | undefined;
  return mimeType ?? 'application/octet-stream';
}
