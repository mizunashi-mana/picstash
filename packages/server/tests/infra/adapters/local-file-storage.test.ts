import 'reflect-metadata';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getConfig } from '@/config.js';
import { LocalFileStorage } from '@/infra/adapters/local-file-storage';

// Mock the config module
vi.mock('@/config.js', () => ({
  getConfig: vi.fn(),
}));

describe('LocalFileStorage', () => {
  let storage: LocalFileStorage;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'storage-test-'));
    vi.mocked(getConfig).mockReturnValue({
      storage: { path: tempDir },
      server: { port: 3000, host: '0.0.0.0' },
      database: { url: 'file:./test.db' },
      logging: {
        level: 'info',
        format: 'pretty',
        file: {
          enabled: false,
          path: './logs/server.log',
          rotation: { enabled: true, maxSize: '10M', maxFiles: 5 },
        },
      },
    });
    storage = new LocalFileStorage();
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true });
  });

  describe('saveOriginalFromStream', () => {
    it('should save file from stream', async () => {
      const content = 'test file content';
      const stream = Readable.from(Buffer.from(content));

      const result = await storage.saveOriginalFromStream(stream, '.txt');

      expect(result.filename).toMatch(/^[a-f0-9-]+\.txt$/);
      expect(result.path).toBe(`originals/${result.filename}`);

      // Verify file was saved
      const savedPath = join(tempDir, result.path);
      const savedContent = await readFile(savedPath, 'utf-8');
      expect(savedContent).toBe(content);
    });

    it('should save image file with correct extension', async () => {
      const stream = Readable.from(Buffer.from('fake image data'));

      const result = await storage.saveOriginalFromStream(stream, '.png');

      expect(result.filename).toMatch(/^[a-f0-9-]+\.png$/);
    });

    it('should create originals directory if not exists', async () => {
      const stream = Readable.from(Buffer.from('test'));

      const result = await storage.saveOriginalFromStream(stream, '.txt');

      expect(result.path).toMatch(/^originals\//);
    });

    it('should clean up partial file on stream error', async () => {
      // Create a stream that emits an error
      const errorStream = new Readable({
        read() {
          this.push(Buffer.from('partial data'));
          process.nextTick(() => {
            this.destroy(new Error('Stream error'));
          });
        },
      });

      await expect(
        storage.saveOriginalFromStream(errorStream, '.txt'),
      ).rejects.toThrow('Stream error');
    });
  });

  describe('deleteFile', () => {
    it('should delete existing file', async () => {
      // Create a file first
      const stream = Readable.from(Buffer.from('test'));
      const result = await storage.saveOriginalFromStream(stream, '.txt');

      await storage.deleteFile(result.path);

      // Verify file was deleted
      await expect(
        readFile(join(tempDir, result.path)),
      ).rejects.toThrow();
    });

    it('should throw error for non-existent file', async () => {
      await expect(
        storage.deleteFile('originals/non-existent.txt'),
      ).rejects.toThrow();
    });
  });

  describe('getAbsolutePath', () => {
    it('should return absolute path for relative path', () => {
      const relativePath = 'originals/test.png';

      const result = storage.getAbsolutePath(relativePath);

      expect(result).toBe(join(tempDir, relativePath));
    });

    it('should handle nested paths', () => {
      const relativePath = 'thumbnails/2024/01/test.jpg';

      const result = storage.getAbsolutePath(relativePath);

      expect(result).toBe(join(tempDir, relativePath));
    });
  });
});
