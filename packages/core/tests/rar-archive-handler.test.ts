import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import AdmZip from 'adm-zip';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { RarArchiveHandler } from '@/index.js';

describe('RarArchiveHandler', () => {
  let handler: RarArchiveHandler;
  let tempDir: string;

  beforeEach(async () => {
    handler = new RarArchiveHandler();
    tempDir = await mkdtemp(join(tmpdir(), 'rar-test-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true });
  });

  describe('archiveType', () => {
    it('should return rar', () => {
      expect(handler.archiveType).toBe('rar');
    });
  });

  describe('canHandle', () => {
    it('should return true for .rar files', () => {
      expect(handler.canHandle('archive.rar', '')).toBe(true);
      expect(handler.canHandle('ARCHIVE.RAR', '')).toBe(true);
    });

    it('should return true for rar MIME types', () => {
      expect(handler.canHandle('archive', 'application/vnd.rar')).toBe(true);
      expect(handler.canHandle('archive', 'application/x-rar-compressed')).toBe(
        true,
      );
      expect(handler.canHandle('archive', 'application/x-rar')).toBe(true);
    });

    it('should return false for non-rar files', () => {
      expect(handler.canHandle('archive.zip', '')).toBe(false);
      expect(handler.canHandle('archive.7z', '')).toBe(false);
      expect(handler.canHandle('archive', 'application/zip')).toBe(false);
    });
  });

  describe('listEntries', () => {
    it('should throw error for invalid RAR file', async () => {
      // Create an invalid RAR file (actually a ZIP)
      const zip = new AdmZip();
      zip.addFile('test.txt', Buffer.from('hello'));
      const invalidRarPath = join(tempDir, 'invalid.rar');
      await writeFile(invalidRarPath, zip.toBuffer());

      await expect(handler.listEntries(invalidRarPath)).rejects.toThrow();
    });
  });

  describe('extractEntry', () => {
    it('should throw error for invalid index on invalid file', async () => {
      // Create an invalid RAR file (actually a ZIP)
      const zip = new AdmZip();
      zip.addFile('test.txt', Buffer.from('hello'));
      const invalidRarPath = join(tempDir, 'invalid.rar');
      await writeFile(invalidRarPath, zip.toBuffer());

      await expect(handler.extractEntry(invalidRarPath, 0)).rejects.toThrow();
    });
  });

  // NOTE: Integration tests with real RAR files would require:
  // 1. A pre-committed RAR fixture file, or
  // 2. RAR creation tools (rar/unrar) to be installed
  // These are skipped in unit tests to avoid external dependencies.
});
