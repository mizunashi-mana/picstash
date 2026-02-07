import 'reflect-metadata';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LocalFileStorage } from '@/index.js';
import type { CoreConfig } from '@/config.js';

function createTestConfig(tempDir: string): CoreConfig {
  return {
    storage: { path: tempDir },
    database: { path: join(tempDir, 'test.db') },
    logging: {
      level: 'info',
      format: 'pretty',
      file: {
        enabled: false,
        path: join(tempDir, 'logs/server.log'),
        rotation: { enabled: true, maxSize: '10M', maxFiles: 5 },
      },
    },
  };
}

describe('LocalFileStorage', () => {
  let storage: LocalFileStorage;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'storage-test-'));
    const config = createTestConfig(tempDir);
    storage = new LocalFileStorage(config);
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true });
  });

  describe('deleteFile', () => {
    it('should delete existing file', async () => {
      // Create a file first
      const stream = Readable.from(Buffer.from('test'));
      const result = await storage.saveFile(stream, { category: 'originals', extension: '.txt' });

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

  describe('saveFile', () => {
    it('should save file from stream with category', async () => {
      const content = 'test file content';
      const stream = Readable.from(Buffer.from(content));

      const result = await storage.saveFile(stream, { category: 'originals', extension: '.txt' });

      expect(result.filename).toMatch(/^[a-f0-9-]+\.txt$/);
      expect(result.path).toBe(`originals/${result.filename}`);

      const savedContent = await readFile(join(tempDir, result.path), 'utf-8');
      expect(savedContent).toBe(content);
    });

    it('should save file to thumbnails category', async () => {
      const stream = Readable.from(Buffer.from('thumb data'));

      const result = await storage.saveFile(stream, { category: 'thumbnails', extension: '.jpg' });

      expect(result.path).toMatch(/^thumbnails\//);
    });

    it('should use explicit filename when provided', async () => {
      const stream = Readable.from(Buffer.from('data'));

      const result = await storage.saveFile(stream, {
        category: 'originals',
        extension: '.png',
        filename: 'my-file.png',
      });

      expect(result.filename).toBe('my-file.png');
      expect(result.path).toBe('originals/my-file.png');
    });

    it('should clean up partial file on stream error', async () => {
      const errorStream = new Readable({
        read() {
          this.push(Buffer.from('partial data'));
          process.nextTick(() => {
            this.destroy(new Error('Stream error'));
          });
        },
      });

      await expect(
        storage.saveFile(errorStream, { category: 'originals', extension: '.txt' }),
      ).rejects.toThrow('Stream error');
    });
  });

  describe('saveFileFromBuffer', () => {
    it('should save buffer to file', async () => {
      const content = Buffer.from('buffer content');

      const result = await storage.saveFileFromBuffer(content, {
        category: 'thumbnails',
        extension: '.jpg',
      });

      expect(result.filename).toMatch(/^[a-f0-9-]+\.jpg$/);
      expect(result.path).toBe(`thumbnails/${result.filename}`);

      const savedContent = await readFile(join(tempDir, result.path));
      expect(savedContent).toEqual(content);
    });

    it('should use explicit filename when provided', async () => {
      const content = Buffer.from('buffer content');

      const result = await storage.saveFileFromBuffer(content, {
        category: 'thumbnails',
        extension: '.jpg',
        filename: 'custom-thumb.jpg',
      });

      expect(result.filename).toBe('custom-thumb.jpg');
      expect(result.path).toBe('thumbnails/custom-thumb.jpg');
    });
  });

  describe('readFile', () => {
    it('should read file contents as buffer', async () => {
      const content = 'readable content';
      const stream = Readable.from(Buffer.from(content));
      const saved = await storage.saveFile(stream, { category: 'originals', extension: '.txt' });

      const data = await storage.readFile(saved.path);

      expect(data.toString('utf-8')).toBe(content);
    });

    it('should throw for non-existent file', async () => {
      await expect(
        storage.readFile('originals/non-existent.txt'),
      ).rejects.toThrow();
    });
  });

  describe('readFileAsStream', () => {
    it('should return a readable stream', async () => {
      const content = 'stream content';
      const stream = Readable.from(Buffer.from(content));
      const saved = await storage.saveFile(stream, { category: 'originals', extension: '.txt' });

      const readStream = await storage.readFileAsStream(saved.path);

      const chunks: Buffer[] = [];
      for await (const chunk of readStream) {
        chunks.push(Buffer.from(chunk as Buffer));
      }
      const data = Buffer.concat(chunks).toString('utf-8');
      expect(data).toBe(content);
    });
  });

  describe('getFileSize', () => {
    it('should return file size in bytes', async () => {
      const content = 'size test content';
      const stream = Readable.from(Buffer.from(content));
      const saved = await storage.saveFile(stream, { category: 'originals', extension: '.txt' });

      const size = await storage.getFileSize(saved.path);

      expect(size).toBe(Buffer.byteLength(content));
    });

    it('should throw for non-existent file', async () => {
      await expect(
        storage.getFileSize('originals/non-existent.txt'),
      ).rejects.toThrow();
    });
  });

  describe('fileExists', () => {
    it('should return true for existing file', async () => {
      const stream = Readable.from(Buffer.from('exists'));
      const saved = await storage.saveFile(stream, { category: 'originals', extension: '.txt' });

      const exists = await storage.fileExists(saved.path);

      expect(exists).toBe(true);
    });

    it('should return false for non-existent file', async () => {
      const exists = await storage.fileExists('originals/non-existent.txt');

      expect(exists).toBe(false);
    });
  });
});
