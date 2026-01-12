import { describe, expect, it } from 'vitest';
import {
  ImageMimeType,
  ALLOWED_IMAGE_MIME_TYPES,
} from '@/domain/image/ImageMimeType';

describe('ImageMimeType', () => {
  describe('isValid', () => {
    it.each(ALLOWED_IMAGE_MIME_TYPES)('should return true for allowed type: %s', (mimeType) => {
      expect(ImageMimeType.isValid(mimeType)).toBe(true);
    });

    it('should return false for unsupported MIME types', () => {
      expect(ImageMimeType.isValid('image/tiff')).toBe(false);
      expect(ImageMimeType.isValid('image/svg+xml')).toBe(false);
      expect(ImageMimeType.isValid('application/pdf')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(ImageMimeType.isValid('')).toBe(false);
    });

    it('should return false for malformed MIME types', () => {
      expect(ImageMimeType.isValid('jpeg')).toBe(false);
      expect(ImageMimeType.isValid('image')).toBe(false);
      expect(ImageMimeType.isValid('image/')).toBe(false);
    });
  });

  describe('create', () => {
    it('should create ImageMimeType for valid MIME types', () => {
      const mimeType = ImageMimeType.create('image/jpeg');
      expect(mimeType).not.toBeNull();
      expect(mimeType?.value).toBe('image/jpeg');
    });

    it('should return null for invalid MIME types', () => {
      expect(ImageMimeType.create('image/tiff')).toBeNull();
      expect(ImageMimeType.create('')).toBeNull();
    });
  });

  describe('getAllowedTypes', () => {
    it('should return all allowed MIME types', () => {
      const types = ImageMimeType.getAllowedTypes();
      expect(types).toContain('image/jpeg');
      expect(types).toContain('image/png');
      expect(types).toContain('image/gif');
      expect(types).toContain('image/webp');
      expect(types).toContain('image/bmp');
    });
  });

  describe('toString', () => {
    it('should return the MIME type string', () => {
      const mimeType = ImageMimeType.create('image/png');
      expect(mimeType?.toString()).toBe('image/png');
    });
  });

  describe('equals', () => {
    it('should return true for same MIME types', () => {
      const a = ImageMimeType.create('image/jpeg');
      const b = ImageMimeType.create('image/jpeg');
      expect(a?.equals(b!)).toBe(true);
    });

    it('should return false for different MIME types', () => {
      const a = ImageMimeType.create('image/jpeg');
      const b = ImageMimeType.create('image/png');
      expect(a?.equals(b!)).toBe(false);
    });
  });
});
