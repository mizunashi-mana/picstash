import { describe, expect, it } from 'vitest';
import {
  isImageContentType,
  getExtensionFromContentType,
  isImageUrl,
  extractFilenameFromUrl,
} from '@/domain/url-crawl/index.js';

describe('isImageContentType', () => {
  it('should return true for image content types', () => {
    expect(isImageContentType('image/jpeg')).toBe(true);
    expect(isImageContentType('image/png')).toBe(true);
    expect(isImageContentType('image/gif')).toBe(true);
    expect(isImageContentType('image/webp')).toBe(true);
    expect(isImageContentType('image/bmp')).toBe(true);
  });

  it('should return true for image content types with charset', () => {
    expect(isImageContentType('image/jpeg; charset=utf-8')).toBe(true);
    expect(isImageContentType('image/png; boundary=something')).toBe(true);
  });

  it('should return false for non-image content types', () => {
    expect(isImageContentType('text/html')).toBe(false);
    expect(isImageContentType('text/html; charset=utf-8')).toBe(false);
    expect(isImageContentType('application/json')).toBe(false);
    expect(isImageContentType('application/octet-stream')).toBe(false);
  });

  it('should handle empty or invalid content types', () => {
    expect(isImageContentType('')).toBe(false);
  });
});

describe('getExtensionFromContentType', () => {
  it('should return correct extension for supported image types', () => {
    expect(getExtensionFromContentType('image/jpeg')).toBe('.jpg');
    expect(getExtensionFromContentType('image/png')).toBe('.png');
    expect(getExtensionFromContentType('image/gif')).toBe('.gif');
    expect(getExtensionFromContentType('image/webp')).toBe('.webp');
    expect(getExtensionFromContentType('image/bmp')).toBe('.bmp');
  });

  it('should handle content types with charset', () => {
    expect(getExtensionFromContentType('image/jpeg; charset=utf-8')).toBe('.jpg');
    expect(getExtensionFromContentType('image/png; boundary=something')).toBe('.png');
  });

  it('should return undefined for unsupported types', () => {
    expect(getExtensionFromContentType('image/tiff')).toBeUndefined();
    expect(getExtensionFromContentType('image/svg+xml')).toBeUndefined();
    expect(getExtensionFromContentType('text/html')).toBeUndefined();
    expect(getExtensionFromContentType('')).toBeUndefined();
  });
});

describe('isImageUrl', () => {
  it('should return true for URLs with image extensions', () => {
    expect(isImageUrl('https://example.com/image.jpg')).toBe(true);
    expect(isImageUrl('https://example.com/image.jpeg')).toBe(true);
    expect(isImageUrl('https://example.com/image.png')).toBe(true);
    expect(isImageUrl('https://example.com/image.gif')).toBe(true);
    expect(isImageUrl('https://example.com/image.webp')).toBe(true);
    expect(isImageUrl('https://example.com/image.bmp')).toBe(true);
  });

  it('should return false for URLs without image extensions', () => {
    expect(isImageUrl('https://example.com/page.html')).toBe(false);
    expect(isImageUrl('https://example.com/')).toBe(false);
    // This is the Twitter case - no extension in path
    expect(isImageUrl('https://pbs.twimg.com/media/G-7eKB6XAAAAsuL?format=jpg&name=large')).toBe(false);
  });
});

describe('extractFilenameFromUrl', () => {
  it('should extract filename from simple URLs', () => {
    expect(extractFilenameFromUrl('https://example.com/image.jpg')).toBe('image.jpg');
    expect(extractFilenameFromUrl('https://example.com/path/to/image.png')).toBe('image.png');
  });

  it('should extract filename from URLs with query strings', () => {
    expect(extractFilenameFromUrl('https://example.com/image.jpg?size=large')).toBe('image.jpg');
  });

  it('should extract filename from Twitter-style URLs', () => {
    // The filename part without extension
    expect(extractFilenameFromUrl('https://pbs.twimg.com/media/G-7eKB6XAAAAsuL?format=jpg&name=large')).toBe('G-7eKB6XAAAAsuL');
  });

  it('should return default for URLs without filename', () => {
    expect(extractFilenameFromUrl('https://example.com/')).toBe('image');
  });
});
