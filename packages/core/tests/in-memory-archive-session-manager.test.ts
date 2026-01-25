import 'reflect-metadata';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import AdmZip from 'adm-zip';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { InMemoryArchiveSessionManager } from '@/index.js';
import type { CoreConfig } from '@/config.js';
import type { ArchiveHandler } from '@/index.js';

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

// Mock handler for testing
class MockZipHandler implements ArchiveHandler {
  readonly archiveType = 'zip' as const;

  canHandle(filePath: string, mimeType: string): boolean {
    return filePath.endsWith('.zip') || mimeType.includes('zip');
  }

  async listEntries(archivePath: string): Promise<
    Array<{
      index: number;
      filename: string;
      path: string;
      size: number;
      isDirectory: boolean;
    }>
  > {
    const zip = new AdmZip(archivePath);
    return zip.getEntries().map((entry, index) => ({
      index,
      filename: entry.name,
      path: entry.entryName,
      size: entry.header.size,
      isDirectory: entry.isDirectory,
    }));
  }

  async extractEntry(archivePath: string, entryIndex: number): Promise<Buffer> {
    const zip = new AdmZip(archivePath);
    const entries = zip.getEntries();
    const entry = entries[entryIndex];
    if (entry === undefined) {
      throw new Error(`Entry ${entryIndex} not found`);
    }
    return entry.getData();
  }
}

function createReadableStream(buffer: Buffer): Readable {
  return Readable.from(buffer);
}

describe('InMemoryArchiveSessionManager', () => {
  let manager: InMemoryArchiveSessionManager;
  let tempDir: string;
  let testZipBuffer: Buffer;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'session-test-'));
    const config = createTestConfig(tempDir);
    manager = new InMemoryArchiveSessionManager(config, [new MockZipHandler()]);

    // Create a test ZIP buffer with images
    const zip = new AdmZip();
    zip.addFile('image1.png', Buffer.from('fake png data'));
    zip.addFile('image2.jpg', Buffer.from('fake jpg data'));
    zip.addFile('subfolder/image3.gif', Buffer.from('fake gif data'));
    zip.addFile('readme.txt', Buffer.from('not an image'));
    testZipBuffer = zip.toBuffer();
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true });
  });

  describe('createSession', () => {
    it('should create a session for valid ZIP archive', async () => {
      const result = await manager.createSession({
        filename: 'test.zip',
        mimeType: 'application/zip',
        stream: createReadableStream(testZipBuffer),
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.session.filename).toBe('test.zip');
        expect(result.session.archiveType).toBe('zip');
        expect(result.session.imageEntries).toHaveLength(3);
      }
    });

    it('should filter out non-image files', async () => {
      const result = await manager.createSession({
        filename: 'test.zip',
        mimeType: 'application/zip',
        stream: createReadableStream(testZipBuffer),
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const filenames = result.session.imageEntries.map(e => e.filename);
        expect(filenames).not.toContain('readme.txt');
        expect(filenames).toContain('image1.png');
        expect(filenames).toContain('image2.jpg');
        expect(filenames).toContain('image3.gif');
      }
    });

    it('should return error for unsupported format', async () => {
      const result = await manager.createSession({
        filename: 'test.7z',
        mimeType: 'application/x-7z-compressed',
        stream: createReadableStream(Buffer.from('fake 7z data')),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('UNSUPPORTED_FORMAT');
      }
    });

    it('should return error for archive with no images', async () => {
      const zip = new AdmZip();
      zip.addFile('readme.txt', Buffer.from('no images here'));
      zip.addFile('data.json', Buffer.from('{}'));

      const result = await manager.createSession({
        filename: 'text-only.zip',
        mimeType: 'application/zip',
        stream: createReadableStream(zip.toBuffer()),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('EMPTY_ARCHIVE');
      }
    });

    it('should re-throw non-FILE_TOO_LARGE errors during stream processing', async () => {
      // Create a stream that emits an error other than FILE_TOO_LARGE
      const errorStream = new Readable({
        read() {
          // Emit an error after a small delay
          process.nextTick(() => {
            this.destroy(new Error('STREAM_ERROR'));
          });
        },
      });

      await expect(
        manager.createSession({
          filename: 'test.zip',
          mimeType: 'application/zip',
          stream: errorStream,
        }),
      ).rejects.toThrow('STREAM_ERROR');
    });

    it('should filter out files with path traversal', async () => {
      const zip = new AdmZip();
      zip.addFile('normal.png', Buffer.from('normal image'));
      zip.addFile('../malicious.png', Buffer.from('path traversal'));
      zip.addFile('subdir/../trick.jpg', Buffer.from('traversal trick'));

      const result = await manager.createSession({
        filename: 'test.zip',
        mimeType: 'application/zip',
        stream: createReadableStream(zip.toBuffer()),
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const paths = result.session.imageEntries.map(e => e.path);
        expect(paths).toContain('normal.png');
        expect(paths).not.toContain('../malicious.png');
        expect(paths).not.toContain('subdir/../trick.jpg');
      }
    });
  });

  describe('getSession', () => {
    it('should return session by ID', async () => {
      const createResult = await manager.createSession({
        filename: 'test.zip',
        mimeType: 'application/zip',
        stream: createReadableStream(testZipBuffer),
      });

      expect(createResult.success).toBe(true);
      if (createResult.success) {
        const session = manager.getSession(createResult.session.id);
        expect(session).toBeDefined();
        expect(session?.filename).toBe('test.zip');
      }
    });

    it('should return undefined for non-existent session', () => {
      const session = manager.getSession('non-existent-id');
      expect(session).toBeUndefined();
    });
  });

  describe('extractImage', () => {
    it('should extract image from session', async () => {
      const createResult = await manager.createSession({
        filename: 'test.zip',
        mimeType: 'application/zip',
        stream: createReadableStream(testZipBuffer),
      });

      expect(createResult.success).toBe(true);
      if (createResult.success) {
        const imageEntry = createResult.session.imageEntries.find(
          e => e.filename === 'image1.png',
        );
        expect(imageEntry).toBeDefined();

        const buffer = await manager.extractImage(
          createResult.session.id,
          imageEntry!.index,
        );
        expect(buffer.toString()).toBe('fake png data');
      }
    });

    it('should throw error for non-existent session', async () => {
      await expect(
        manager.extractImage('non-existent-id', 0),
      ).rejects.toThrow('Session non-existent-id not found');
    });

    it('should throw error for non-existent entry', async () => {
      const createResult = await manager.createSession({
        filename: 'test.zip',
        mimeType: 'application/zip',
        stream: createReadableStream(testZipBuffer),
      });

      expect(createResult.success).toBe(true);
      if (createResult.success) {
        await expect(
          manager.extractImage(createResult.session.id, 999),
        ).rejects.toThrow('Entry 999 not found');
      }
    });
  });

  describe('deleteSession', () => {
    it('should delete session and cleanup', async () => {
      const createResult = await manager.createSession({
        filename: 'test.zip',
        mimeType: 'application/zip',
        stream: createReadableStream(testZipBuffer),
      });

      expect(createResult.success).toBe(true);
      if (createResult.success) {
        await manager.deleteSession(createResult.session.id);

        const session = manager.getSession(createResult.session.id);
        expect(session).toBeUndefined();
      }
    });

    it('should not throw for non-existent session', async () => {
      // Should not throw
      await expect(
        manager.deleteSession('non-existent-id'),
      ).resolves.toBeUndefined();
    });
  });
});
