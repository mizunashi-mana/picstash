import {
  isImageUrl,
  extractFilenameFromUrl,
  MAX_IMAGES_PER_PAGE,
  SUPPORTED_IMAGE_EXTENSIONS,
} from './UrlCrawlConfig.js';
import type { CrawledImageEntry } from './CrawledImageEntry.js';

interface ExtractContext {
  imageUrls: Set<string>;
  entries: CrawledImageEntry[];
  baseUrl: string;
}

/**
 * Add an image entry if it's valid and not a duplicate
 */
function addEntry(
  ctx: ExtractContext,
  rawUrl: string | undefined,
  alt?: string,
): void {
  if (rawUrl === undefined || rawUrl === '') {
    return;
  }
  const absoluteUrl = resolveUrl(rawUrl, ctx.baseUrl);
  if (absoluteUrl !== null && !ctx.imageUrls.has(absoluteUrl)) {
    ctx.imageUrls.add(absoluteUrl);
    ctx.entries.push({
      index: ctx.entries.length,
      url: absoluteUrl,
      filename: extractFilenameFromUrl(absoluteUrl),
      alt: alt !== undefined && alt !== '' ? alt : undefined,
    });
  }
}

/**
 * Add an image entry only if it has an image extension
 */
function addImageEntry(ctx: ExtractContext, rawUrl: string | undefined): void {
  if (rawUrl === undefined || rawUrl === '') {
    return;
  }
  const absoluteUrl = resolveUrl(rawUrl, ctx.baseUrl);
  if (absoluteUrl !== null && isImageUrl(absoluteUrl) && !ctx.imageUrls.has(absoluteUrl)) {
    ctx.imageUrls.add(absoluteUrl);
    ctx.entries.push({
      index: ctx.entries.length,
      url: absoluteUrl,
      filename: extractFilenameFromUrl(absoluteUrl),
    });
  }
}

/**
 * Extract from <img> tags with src before alt
 */
function extractFromImgTags(html: string, ctx: ExtractContext): void {
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*(?:alt=["']([^"']*)["'])?[^>]*>/gi;
  const matches = html.matchAll(imgRegex);
  for (const match of matches) {
    addEntry(ctx, match[1], match[2]);
  }
}

/**
 * Extract from <img> tags with alt before src
 */
function extractFromImgTagsAltFirst(html: string, ctx: ExtractContext): void {
  const imgRegexAltFirst = /<img[^>]+alt=["']([^"']*)["'][^>]+src=["']([^"']+)["'][^>]*>/gi;
  const matches = html.matchAll(imgRegexAltFirst);
  for (const match of matches) {
    addEntry(ctx, match[2], match[1]);
  }
}

/**
 * Extract from <a> tags that link directly to images
 */
function extractFromLinks(html: string, ctx: ExtractContext): void {
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
  const matches = html.matchAll(linkRegex);
  for (const match of matches) {
    addImageEntry(ctx, match[1]);
  }
}

/**
 * Extract from CSS background-image
 */
function extractFromBackgroundImages(html: string, ctx: ExtractContext): void {
  const bgImageRegex = /background(?:-image)?:\s*url\(['"]?([^'")]+)['"]?\)/gi;
  const matches = html.matchAll(bgImageRegex);
  for (const match of matches) {
    addImageEntry(ctx, match[1]);
  }
}

/**
 * Extract from srcset attribute
 */
function extractFromSrcset(html: string, ctx: ExtractContext): void {
  const srcsetRegex = /srcset=["']([^"']+)["']/gi;
  const matches = html.matchAll(srcsetRegex);
  for (const match of matches) {
    const srcset = match[1];
    if (srcset !== undefined && srcset !== '') {
      // srcset format: "url1 1x, url2 2x" or "url1 100w, url2 200w"
      const srcsetParts = srcset.split(',');
      for (const part of srcsetParts) {
        const urlPart = part.trim().split(/\s+/)[0];
        addEntry(ctx, urlPart);
      }
    }
  }
}

/**
 * Extract from data-src (lazy loading)
 */
function extractFromDataSrc(html: string, ctx: ExtractContext): void {
  const dataSrcRegex = /data-(?:src|original|lazy)=["']([^"']+)["']/gi;
  const matches = html.matchAll(dataSrcRegex);
  for (const match of matches) {
    addEntry(ctx, match[1]);
  }
}

/**
 * Extract image URLs from HTML content
 */
export function extractImageUrls(html: string, baseUrl: string): CrawledImageEntry[] {
  const ctx: ExtractContext = {
    imageUrls: new Set<string>(),
    entries: [],
    baseUrl,
  };

  extractFromImgTags(html, ctx);
  extractFromImgTagsAltFirst(html, ctx);
  extractFromLinks(html, ctx);
  extractFromBackgroundImages(html, ctx);
  extractFromSrcset(html, ctx);
  extractFromDataSrc(html, ctx);

  // Limit the number of images
  return ctx.entries.slice(0, MAX_IMAGES_PER_PAGE);
}

/**
 * Extract page title from HTML
 */
export function extractPageTitle(html: string): string | undefined {
  const titleMatch = /<title[^>]*>([^<]+)<\/title>/i.exec(html);
  return titleMatch?.[1]?.trim();
}

/**
 * Resolve a potentially relative URL to an absolute URL
 */
function resolveUrl(url: string, baseUrl: string): string | null {
  try {
    // Skip data URLs, javascript:, etc.
    if (url.startsWith('data:') || url.startsWith('javascript:') || url.startsWith('#')) {
      return null;
    }

    const resolved = new URL(url, baseUrl);

    // Only allow http and https protocols
    if (resolved.protocol !== 'http:' && resolved.protocol !== 'https:') {
      return null;
    }

    return resolved.href;
  }
  catch {
    return null;
  }
}

/**
 * Filter entries to only include supported image formats
 */
export function filterImageEntries(entries: CrawledImageEntry[]): CrawledImageEntry[] {
  return entries
    .filter((entry) => {
      try {
        const urlObj = new URL(entry.url);
        const pathname = urlObj.pathname.toLowerCase();
        const pathWithoutQuery = pathname.split('?')[0] ?? pathname;

        // Check if URL ends with supported extension
        const hasImageExtension = SUPPORTED_IMAGE_EXTENSIONS.some(ext =>
          pathWithoutQuery.endsWith(ext),
        );

        // Also accept URLs that might be images but don't have clear extensions
        // (e.g., CDN URLs like /image/abc123)
        // We'll validate the actual content type when fetching
        return hasImageExtension || !pathWithoutQuery.includes('.');
      }
      catch {
        return false;
      }
    })
    .map((entry, index) => ({
      ...entry,
      index, // Re-index after filtering
    }));
}
