import { describe, expect, it } from 'vitest';
import {
  MAX_ARCHIVE_SIZE,
  SUPPORTED_IMAGE_EXTENSIONS,
  IMAGE_EXTENSION_MIME_MAP,
  isSupportedImageExtension,
  getMimeTypeFromExtension,
} from '@/domain/archive/ArchiveConfig';

describe('ArchiveConfig', () => {
  describe('MAX_ARCHIVE_SIZE', () => {
    it('should be 500MB', () => {
      expect(MAX_ARCHIVE_SIZE).toBe(500 * 1024 * 1024);
    });
  });

  describe('SUPPORTED_IMAGE_EXTENSIONS', () => {
    it('should include common image extensions', () => {
      expect(SUPPORTED_IMAGE_EXTENSIONS).toContain('.jpg');
      expect(SUPPORTED_IMAGE_EXTENSIONS).toContain('.jpeg');
      expect(SUPPORTED_IMAGE_EXTENSIONS).toContain('.png');
      expect(SUPPORTED_IMAGE_EXTENSIONS).toContain('.gif');
      expect(SUPPORTED_IMAGE_EXTENSIONS).toContain('.webp');
      expect(SUPPORTED_IMAGE_EXTENSIONS).toContain('.bmp');
    });
  });

  describe('IMAGE_EXTENSION_MIME_MAP', () => {
    it('should map extensions to correct MIME types', () => {
      expect(IMAGE_EXTENSION_MIME_MAP['.jpg']).toBe('image/jpeg');
      expect(IMAGE_EXTENSION_MIME_MAP['.jpeg']).toBe('image/jpeg');
      expect(IMAGE_EXTENSION_MIME_MAP['.png']).toBe('image/png');
      expect(IMAGE_EXTENSION_MIME_MAP['.gif']).toBe('image/gif');
      expect(IMAGE_EXTENSION_MIME_MAP['.webp']).toBe('image/webp');
      expect(IMAGE_EXTENSION_MIME_MAP['.bmp']).toBe('image/bmp');
    });
  });

  describe('isSupportedImageExtension', () => {
    it.each(SUPPORTED_IMAGE_EXTENSIONS)('should return true for %s', (ext) => {
      expect(isSupportedImageExtension(ext)).toBe(true);
    });

    it('should handle uppercase extensions', () => {
      expect(isSupportedImageExtension('.JPG')).toBe(true);
      expect(isSupportedImageExtension('.PNG')).toBe(true);
    });

    it('should return false for unsupported extensions', () => {
      expect(isSupportedImageExtension('.tiff')).toBe(false);
      expect(isSupportedImageExtension('.pdf')).toBe(false);
      expect(isSupportedImageExtension('.svg')).toBe(false);
      expect(isSupportedImageExtension('')).toBe(false);
    });
  });

  describe('getMimeTypeFromExtension', () => {
    it.each([
      ['.jpg', 'image/jpeg'],
      ['.jpeg', 'image/jpeg'],
      ['.png', 'image/png'],
      ['.gif', 'image/gif'],
      ['.webp', 'image/webp'],
      ['.bmp', 'image/bmp'],
    ])('should return correct MIME type for %s', (ext, expectedMime) => {
      expect(getMimeTypeFromExtension(ext)).toBe(expectedMime);
    });

    it('should handle uppercase extensions', () => {
      expect(getMimeTypeFromExtension('.JPG')).toBe('image/jpeg');
      expect(getMimeTypeFromExtension('.PNG')).toBe('image/png');
    });

    it('should return application/octet-stream for unsupported extensions', () => {
      expect(getMimeTypeFromExtension('.tiff')).toBe('application/octet-stream');
      expect(getMimeTypeFromExtension('.pdf')).toBe('application/octet-stream');
      expect(getMimeTypeFromExtension('')).toBe('application/octet-stream');
      expect(getMimeTypeFromExtension('.unknown')).toBe('application/octet-stream');
    });
  });
});
