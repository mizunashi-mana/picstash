/**
 * URL crawl configuration constants
 */

/** Fetch timeout in milliseconds (30 seconds) */
export const FETCH_TIMEOUT_MS = 30_000;

/** Maximum number of images to extract from a single page */
export const MAX_IMAGES_PER_PAGE = 500;

/** User-Agent for HTTP requests */
export const USER_AGENT
  = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/** Supported image extensions for crawling */
export const SUPPORTED_IMAGE_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.bmp',
] as const;

export type SupportedImageExtension = (typeof SUPPORTED_IMAGE_EXTENSIONS)[number];

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
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type guard pattern
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

/**
 * Check if a URL points to a supported image file
 */
export function isImageUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    // Remove query string for extension check
    const pathWithoutQuery = pathname.split('?')[0] ?? pathname;
    return SUPPORTED_IMAGE_EXTENSIONS.some(ext => pathWithoutQuery.endsWith(ext));
  }
  catch {
    return false;
  }
}

/**
 * Extract filename from URL
 */
export function extractFilenameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const pathWithoutQuery = pathname.split('?')[0] ?? pathname;
    const segments = pathWithoutQuery.split('/');
    const filename = segments[segments.length - 1];
    if (filename !== undefined && filename !== '' && filename.length > 0) {
      return decodeURIComponent(filename);
    }
    return 'image';
  }
  catch {
    return 'image';
  }
}
