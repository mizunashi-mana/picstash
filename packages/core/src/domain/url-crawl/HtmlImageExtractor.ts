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
 * Extract from <img> tags, handling src/alt in any attribute order
 */
function extractFromImgTags(html: string, ctx: ExtractContext): void {
  const imgTagRegex = /<img\b[^>]*>/gi;
  const matches = html.matchAll(imgTagRegex);

  // Attribute-level regexes, independent of attribute order and spacing
  const srcAttrRegex = /\bsrc\s*=\s*(['"])(.*?)\1/i;
  const altAttrRegex = /\balt\s*=\s*(['"])(.*?)\1/i;

  for (const match of matches) {
    const tag = match[0];
    const srcMatch = srcAttrRegex.exec(tag);
    if (srcMatch === null) {
      continue;
    }
    const altMatch = altAttrRegex.exec(tag);
    const src = srcMatch[2];
    const alt = altMatch !== null ? altMatch[2] : undefined;
    addEntry(ctx, src, alt);
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

/** Allowed URL protocols (whitelist) */
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

/**
 * Resolve a potentially relative URL to an absolute URL
 */
function resolveUrl(url: string, baseUrl: string): string | null {
  try {
    // Skip fragment-only URLs
    if (url.startsWith('#')) {
      return null;
    }

    const resolved = new URL(url, baseUrl);

    // Only allow whitelisted protocols (http, https)
    if (!ALLOWED_PROTOCOLS.has(resolved.protocol)) {
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

        // Check if URL ends with a supported image extension
        const hasImageExtension = SUPPORTED_IMAGE_EXTENSIONS.some(ext =>
          pathWithoutQuery.endsWith(ext),
        );

        // Only accept URLs that clearly reference supported image formats
        return hasImageExtension;
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
