import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import AdmZip from 'adm-zip';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ZipArchiveHandler } from '@/infra/adapters/zip-archive-handler';

describe('ZipArchiveHandler', () => {
  let handler: ZipArchiveHandler;
  let tempDir: string;
  let testZipPath: string;

  beforeEach(async () => {
    handler = new ZipArchiveHandler();
    tempDir = await mkdtemp(join(tmpdir(), 'zip-test-'));

    // Create a test ZIP file with some images
    const zip = new AdmZip();
    zip.addFile('image1.png', Buffer.from('fake png data 1'));
    zip.addFile('image2.jpg', Buffer.from('fake jpg data 2'));
    zip.addFile('subfolder/image3.gif', Buffer.from('fake gif data 3'));
    zip.addFile('readme.txt', Buffer.from('not an image'));

    testZipPath = join(tempDir, 'test.zip');
    await writeFile(testZipPath, zip.toBuffer());
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

    beforeEach(async () => {
      // Create a valid ZIP first
      const zip = new AdmZip();
      zip.addFile('image.png', Buffer.from('PNG image data here'));
      const validZipBuffer = zip.toBuffer();

      // Truncate to remove EOCD (last 22 bytes minimum)
      // Keep enough data for the local file header and compressed data
      const truncatedBuffer = validZipBuffer.subarray(0, validZipBuffer.length - 22);

      corruptedZipPath = join(tempDir, 'corrupted.zip');
      await writeFile(corruptedZipPath, truncatedBuffer);
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

      expect(buffer.toString()).toBe('PNG image data here');
    });

    it('should cache corrupted archive status and use streaming directly on subsequent calls', async () => {
      // First call triggers fallback
      await handler.listEntries(corruptedZipPath);

      // Second call should use streaming directly (no error from yauzl)
      const entries = await handler.listEntries(corruptedZipPath);
      expect(entries).toHaveLength(1);
    });
  });
});
