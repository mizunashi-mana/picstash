import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import JSZip from 'jszip';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ZipArchiveHandler } from '@/index.js';

describe('ZipArchiveHandler', () => {
  let handler: ZipArchiveHandler;
  let tempDir: string;
  let testZipPath: string;

  beforeEach(async () => {
    handler = new ZipArchiveHandler();
    tempDir = await mkdtemp(join(tmpdir(), 'zip-test-'));

    // Create a test ZIP file with some images
    const zip = new JSZip();
    zip.file('image1.png', Buffer.from('fake png data 1'));
    zip.file('image2.jpg', Buffer.from('fake jpg data 2'));
    zip.file('subfolder/image3.gif', Buffer.from('fake gif data 3'));
    zip.file('readme.txt', Buffer.from('not an image'));

    testZipPath = join(tempDir, 'test.zip');
    const buffer = await zip.generateAsync({ type: 'nodebuffer' });
    await writeFile(testZipPath, buffer);
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true });
  });

  describe('canHandle', () => {
    it('should return true for .zip files', () => {
      expect(handler.canHandle('archive.zip', '')).toBe(true);
      expect(handler.canHandle('ARCHIVE.ZIP', '')).toBe(true);
    });

    it('should return true for zip MIME types', () => {
      expect(handler.canHandle('archive', 'application/zip')).toBe(true);
      expect(handler.canHandle('archive', 'application/x-zip-compressed')).toBe(true);
    });

    it('should return false for non-zip files', () => {
      expect(handler.canHandle('archive.rar', '')).toBe(false);
      expect(handler.canHandle('archive.7z', '')).toBe(false);
      expect(handler.canHandle('archive', 'application/x-rar')).toBe(false);
    });
  });

  describe('listEntries', () => {
    it('should list all entries in the archive', async () => {
      const entries = await handler.listEntries(testZipPath);

      expect(entries).toHaveLength(4);
      expect(entries.map(e => e.filename)).toContain('image1.png');
      expect(entries.map(e => e.filename)).toContain('image2.jpg');
      expect(entries.map(e => e.filename)).toContain('image3.gif');
      expect(entries.map(e => e.filename)).toContain('readme.txt');
    });

    it('should include correct paths for nested files', async () => {
      const entries = await handler.listEntries(testZipPath);
      const nestedEntry = entries.find(e => e.path === 'subfolder/image3.gif');

      expect(nestedEntry).toBeDefined();
      expect(nestedEntry?.path).toBe('subfolder/image3.gif');
      // Verify basename extraction works correctly
      expect(nestedEntry?.filename).toBe('image3.gif');
    });

    it('should include entry indices', async () => {
      const entries = await handler.listEntries(testZipPath);
      const indices = entries.map(e => e.index);

      expect(indices).toEqual([0, 1, 2, 3]);
    });
  });

  describe('extractEntry', () => {
    it('should extract entry by index', async () => {
      const entries = await handler.listEntries(testZipPath);
      const imageEntry = entries.find(e => e.filename === 'image1.png');

      const buffer = await handler.extractEntry(testZipPath, imageEntry!.index);

      expect(buffer.toString()).toBe('fake png data 1');
    });

    it('should throw error for invalid index', async () => {
      await expect(handler.extractEntry(testZipPath, 999)).rejects.toThrow(
        'Entry index 999 out of range',
      );
    });

    it('should throw error for negative index', async () => {
      await expect(handler.extractEntry(testZipPath, -1)).rejects.toThrow(
        'Entry index -1 out of range',
      );
    });
  });

  describe('corrupted ZIP handling (EOCD missing)', () => {
    let corruptedZipPath: string;
    const testContent = 'PNG image data here';

    beforeEach(async () => {
      // Create a valid ZIP first
      // ZIP structure: [Local File Headers + Data] [Central Directory] [EOCD]
      const zip = new JSZip();
      zip.file('image.png', Buffer.from(testContent));
      const validZipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

      // Find EOCD signature from the end (PK\x05\x06 = 0x50 0x4B 0x05 0x06)
      // Search backwards from the end of the file
      const corruptedBuffer = Buffer.from(validZipBuffer);
      let eocdPos = -1;
      for (let i = corruptedBuffer.length - 22; i >= 0; i--) {
        if (
          corruptedBuffer[i] === 0x50
          && corruptedBuffer[i + 1] === 0x4b
          && corruptedBuffer[i + 2] === 0x05
          && corruptedBuffer[i + 3] === 0x06
        ) {
          eocdPos = i;
          break;
        }
      }

      if (eocdPos >= 0) {
        // Truncate the file at the EOCD position to remove it entirely
        // This ensures yauzl fails with "EOCD not found"
        const truncatedBuffer = corruptedBuffer.subarray(0, eocdPos);
        corruptedZipPath = join(tempDir, 'corrupted.zip');
        await writeFile(corruptedZipPath, truncatedBuffer);
      }
      else {
        throw new Error('EOCD not found in test ZIP');
      }
    });

    it('should list entries from corrupted ZIP using fallback streaming mode', async () => {
      const entries = await handler.listEntries(corruptedZipPath);

      expect(entries).toHaveLength(1);
      expect(entries[0]?.filename).toBe('image.png');
      expect(entries[0]?.isDirectory).toBe(false);
    });

    it('should extract entry from corrupted ZIP using fallback streaming mode', async () => {
      const entries = await handler.listEntries(corruptedZipPath);
      expect(entries).toHaveLength(1);

      const buffer = await handler.extractEntry(corruptedZipPath, 0);

      expect(buffer.toString()).toBe(testContent);
    });

    it('should throw error when extracting directory entry in fallback mode', async () => {
      // Create a corrupted ZIP with a directory entry
      const zipWithDir = new JSZip();
      zipWithDir.folder('folder');
      zipWithDir.file('folder/file.txt', Buffer.from('content'));
      const validBuffer = await zipWithDir.generateAsync({ type: 'nodebuffer' });

      // Truncate to remove EOCD
      const truncatedBuffer = validBuffer.subarray(0, validBuffer.length - 22);
      const zipWithDirPath = join(tempDir, 'corrupted-with-dir.zip');
      await writeFile(zipWithDirPath, truncatedBuffer);

      const entries = await handler.listEntries(zipWithDirPath);
      const dirEntry = entries.find(e => e.isDirectory);
      expect(dirEntry).toBeDefined();

      await expect(handler.extractEntry(zipWithDirPath, dirEntry!.index)).rejects.toThrow(
        'Cannot extract a directory entry',
      );
    });

    it('should throw error for invalid index in fallback mode', async () => {
      await expect(handler.extractEntry(corruptedZipPath, 999)).rejects.toThrow(
        'Entry index 999 not found',
      );
    });

    it('should handle empty corrupted ZIP gracefully', async () => {
      // Create a minimal ZIP structure that will be detected as corrupted
      // but has no valid entries (just some garbage that looks like a ZIP header)
      const emptyCorruptedPath = join(tempDir, 'empty-corrupted.zip');
      // Write minimal data that will fail EOCD check but won't parse any entries
      await writeFile(emptyCorruptedPath, Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00]));

      const entries = await handler.listEntries(emptyCorruptedPath);
      expect(entries).toHaveLength(0);
    });
  });
});
