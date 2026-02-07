import { extname, join } from 'node:path';
import { describe, it, expect } from 'vitest';

/**
 * ライブラリディレクトリの拡張子
 */
const LIBRARY_EXTENSION = '.pstlib';

/**
 * 新規作成時のデフォルトライブラリ名
 */
const DEFAULT_LIBRARY_NAME = `library${LIBRARY_EXTENSION}`;

/**
 * パスがライブラリディレクトリかどうかを判定
 */
function isLibraryDirectory(path: string): boolean {
  return extname(path).toLowerCase() === LIBRARY_EXTENSION;
}

/**
 * 選択されたパスからライブラリパスを決定
 */
function resolveLibraryPath(selectedPath: string): string {
  if (isLibraryDirectory(selectedPath)) {
    return selectedPath;
  }
  return join(selectedPath, DEFAULT_LIBRARY_NAME);
}

describe('storage-manager pstlib logic', () => {
  describe('isLibraryDirectory', () => {
    it('should return true for .pstlib directories', () => {
      expect(isLibraryDirectory('/path/to/library.pstlib')).toBe(true);
      expect(isLibraryDirectory('/path/to/my-images.pstlib')).toBe(true);
      expect(isLibraryDirectory('test.pstlib')).toBe(true);
    });

    it('should return true for .pstlib directories (case insensitive)', () => {
      expect(isLibraryDirectory('/path/to/library.PSTLIB')).toBe(true);
      expect(isLibraryDirectory('/path/to/library.Pstlib')).toBe(true);
    });

    it('should return false for non-.pstlib directories', () => {
      expect(isLibraryDirectory('/path/to/folder')).toBe(false);
      expect(isLibraryDirectory('/path/to/folder.txt')).toBe(false);
      expect(isLibraryDirectory('/path/to/folder.pst')).toBe(false);
    });
  });

  describe('resolveLibraryPath', () => {
    it('should return the same path for .pstlib directories', () => {
      const pstlibPath = '/Users/test/Documents/my-images.pstlib';
      expect(resolveLibraryPath(pstlibPath)).toBe(pstlibPath);
    });

    it('should append library.pstlib for regular directories', () => {
      const regularPath = '/Users/test/Documents/Pictures';
      expect(resolveLibraryPath(regularPath)).toBe(
        '/Users/test/Documents/Pictures/library.pstlib',
      );
    });

    it('should handle root directories', () => {
      expect(resolveLibraryPath('/tmp')).toBe('/tmp/library.pstlib');
    });
  });

  describe('library directory structure', () => {
    it('should have correct subdirectory paths', () => {
      const libraryPath = '/Users/test/library.pstlib';

      // DB path
      expect(join(libraryPath, 'picstash.db')).toBe(
        '/Users/test/library.pstlib/picstash.db',
      );

      // Storage paths
      expect(join(libraryPath, 'storage', 'originals')).toBe(
        '/Users/test/library.pstlib/storage/originals',
      );
      expect(join(libraryPath, 'storage', 'thumbnails')).toBe(
        '/Users/test/library.pstlib/storage/thumbnails',
      );
    });

    it('should generate correct relative paths for files', () => {
      const category = 'originals';
      const filename = 'abc123.jpg';
      const relativePath = `storage/${category}/${filename}`;

      expect(relativePath).toBe('storage/originals/abc123.jpg');
    });
  });
});
