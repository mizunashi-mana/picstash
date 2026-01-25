import { describe, expect, it } from 'vitest';
import {
  isImageFile,
  isSafePath,
  filterImageEntries,
} from '@/domain/archive/ArchiveImageDetector';
import type { ArchiveEntry } from '@/domain/archive/ArchiveEntry';

describe('ArchiveImageDetector', () => {
  describe('isImageFile', () => {
    it.each([
      'image.jpg',
      'image.jpeg',
      'image.png',
      'image.gif',
      'image.webp',
      'image.bmp',
    ])('should return true for %s', (filename) => {
      expect(isImageFile(filename)).toBe(true);
    });

    it.each([
      'IMAGE.JPG',
      'Image.PNG',
      'photo.JPEG',
    ])('should handle uppercase extensions: %s', (filename) => {
      expect(isImageFile(filename)).toBe(true);
    });

    it.each([
      'document.pdf',
      'archive.zip',
      'script.js',
      'data.json',
      'noextension',
      '',
    ])('should return false for non-image files: %s', (filename) => {
      expect(isImageFile(filename)).toBe(false);
    });

    it('should handle files with multiple dots', () => {
      expect(isImageFile('my.photo.jpg')).toBe(true);
      expect(isImageFile('my.photo.txt')).toBe(false);
    });
  });

  describe('isSafePath', () => {
    it('should return true for safe paths', () => {
      expect(isSafePath('images/photo.jpg')).toBe(true);
      expect(isSafePath('folder/subfolder/image.png')).toBe(true);
      expect(isSafePath('photo.jpg')).toBe(true);
    });

    it('should return false for paths with directory traversal', () => {
      expect(isSafePath('../photo.jpg')).toBe(false);
      expect(isSafePath('images/../../../etc/passwd')).toBe(false);
      expect(isSafePath('folder/../photo.jpg')).toBe(false);
    });

    it('should return false for absolute paths', () => {
      expect(isSafePath('/etc/passwd')).toBe(false);
      expect(isSafePath('/images/photo.jpg')).toBe(false);
    });

    it('should handle Windows-style path separators', () => {
      expect(isSafePath('images\\photo.jpg')).toBe(true);
      expect(isSafePath('..\\photo.jpg')).toBe(false);
    });
  });

  describe('filterImageEntries', () => {
    const createEntry = (
      index: number,
      filename: string,
      path: string,
      isDirectory = false,
    ): ArchiveEntry => ({
      index,
      filename,
      path,
      size: 1000,
      isDirectory,
    });

    it('should filter only image files', () => {
      const entries: ArchiveEntry[] = [
        createEntry(0, 'photo.jpg', 'photo.jpg'),
        createEntry(1, 'document.pdf', 'document.pdf'),
        createEntry(2, 'image.png', 'image.png'),
      ];

      const result = filterImageEntries(entries);
      expect(result).toHaveLength(2);
      expect(result.map(e => e.filename)).toEqual(['photo.jpg', 'image.png']);
    });

    it('should exclude directories', () => {
      const entries: ArchiveEntry[] = [
        createEntry(0, 'images', 'images/', true),
        createEntry(1, 'photo.jpg', 'images/photo.jpg'),
      ];

      const result = filterImageEntries(entries);
      expect(result).toHaveLength(1);
      expect(result[0]?.filename).toBe('photo.jpg');
    });

    it('should exclude files with unsafe paths', () => {
      const entries: ArchiveEntry[] = [
        createEntry(0, 'photo.jpg', 'images/photo.jpg'),
        createEntry(1, 'malicious.jpg', '../malicious.jpg'),
        createEntry(2, 'absolute.png', '/etc/absolute.png'),
      ];

      const result = filterImageEntries(entries);
      expect(result).toHaveLength(1);
      expect(result[0]?.path).toBe('images/photo.jpg');
    });

    it('should return empty array for no valid entries', () => {
      const entries: ArchiveEntry[] = [
        createEntry(0, 'document.pdf', 'document.pdf'),
        createEntry(1, 'images', 'images/', true),
      ];

      const result = filterImageEntries(entries);
      expect(result).toHaveLength(0);
    });
  });
});
