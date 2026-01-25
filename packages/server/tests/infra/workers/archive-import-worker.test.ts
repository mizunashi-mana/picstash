import { describe, expect, it, vi } from 'vitest';
import { createArchiveImportJobHandler, ARCHIVE_IMPORT_JOB_TYPE } from '@/infra/workers/archive-import-worker.js';
import type { ArchiveSessionManager, ArchiveSession } from '@/application/ports/archive-session-manager.js';
import type { FileStorage } from '@/application/ports/file-storage.js';
import type { ImageProcessor } from '@/application/ports/image-processor.js';
import type { ImageRepository } from '@/application/ports/image-repository.js';
import type { Job } from '@/application/ports/job-queue.js';
import type { ArchiveImportJobPayload } from '@/infra/workers/archive-import-worker.js';

// Mock fs/promises to avoid actual file system operations
vi.mock('node:fs/promises', () => ({
  stat: vi.fn().mockResolvedValue({ size: 1000 }),
}));

function createMockArchiveSessionManager(): ArchiveSessionManager {
  return {
    createSession: vi.fn(),
    getSession: vi.fn(),
    deleteSession: vi.fn(),
    extractImage: vi.fn(),
  };
}

function createMockImageRepository(): ImageRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findByIds: vi.fn(),
    findAll: vi.fn(),
    findAllPaginated: vi.fn(),
    search: vi.fn(),
    searchPaginated: vi.fn(),
    updateById: vi.fn(),
    deleteById: vi.fn(),
    findIdsWithoutEmbedding: vi.fn(),
    findByIdWithEmbedding: vi.fn(),
    findWithEmbedding: vi.fn(),
    updateEmbedding: vi.fn(),
    clearAllEmbeddings: vi.fn(),
    count: vi.fn(),
    countWithEmbedding: vi.fn(),
  };
}

function createMockFileStorage(): FileStorage {
  return {
    saveOriginalFromStream: vi.fn(),
    getAbsolutePath: vi.fn(),
    deleteFile: vi.fn(),
  };
}

function createMockImageProcessor(): ImageProcessor {
  return {
    getMetadata: vi.fn(),
    generateThumbnail: vi.fn(),
    generateThumbnailFromBuffer: vi.fn(),
  };
}

function createMockJob(payload: ArchiveImportJobPayload): Job<ArchiveImportJobPayload> {
  return {
    id: 'test-job-id',
    type: ARCHIVE_IMPORT_JOB_TYPE,
    status: 'active',
    payload,
    progress: 0,
    attempts: 1,
    maxAttempts: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe('archive-import-worker', () => {
  describe('ARCHIVE_IMPORT_JOB_TYPE', () => {
    it('should export the correct job type', () => {
      expect(ARCHIVE_IMPORT_JOB_TYPE).toBe('archive-import');
    });
  });

  describe('createArchiveImportJobHandler', () => {
    it('should return all failed results if session not found', async () => {
      const mockSessionManager = createMockArchiveSessionManager();
      vi.mocked(mockSessionManager.getSession).mockReturnValue(undefined);

      const handler = createArchiveImportJobHandler({
        archiveSessionManager: mockSessionManager,
        imageRepository: createMockImageRepository(),
        fileStorage: createMockFileStorage(),
        imageProcessor: createMockImageProcessor(),
      });

      const job = createMockJob({ sessionId: 'invalid-session', indices: [0, 1, 2] });
      const updateProgress = vi.fn();

      const result = await handler(job, updateProgress);

      expect(result.totalRequested).toBe(3);
      expect(result.successCount).toBe(0);
      expect(result.failedCount).toBe(3);
      expect(result.results).toHaveLength(3);
      expect(result.results.every(r => r.error === 'Session not found')).toBe(true);
    });

    it('should return failed result for entry not found in archive', async () => {
      const mockSessionManager = createMockArchiveSessionManager();
      const mockSession: ArchiveSession = {
        id: 'session-1',
        filename: 'test.zip',
        archiveType: 'zip',
        archivePath: '/tmp/test.zip',
        imageEntries: [
          { index: 0, filename: 'img1.png', path: '/img1.png', size: 1000, isDirectory: false },
        ],
        createdAt: new Date(),
      };
      vi.mocked(mockSessionManager.getSession).mockReturnValue(mockSession);

      const handler = createArchiveImportJobHandler({
        archiveSessionManager: mockSessionManager,
        imageRepository: createMockImageRepository(),
        fileStorage: createMockFileStorage(),
        imageProcessor: createMockImageProcessor(),
      });

      const job = createMockJob({ sessionId: 'session-1', indices: [99] }); // index 99 doesn't exist
      const updateProgress = vi.fn();

      const result = await handler(job, updateProgress);

      expect(result.totalRequested).toBe(1);
      expect(result.successCount).toBe(0);
      expect(result.failedCount).toBe(1);
      expect(result.results[0]?.error).toBe('Entry 99 not found in archive');
    });

    it('should successfully import images', async () => {
      const mockSessionManager = createMockArchiveSessionManager();
      const mockSession: ArchiveSession = {
        id: 'session-1',
        filename: 'test.zip',
        archiveType: 'zip',
        archivePath: '/tmp/test.zip',
        imageEntries: [
          { index: 0, filename: 'img1.png', path: '/img1.png', size: 1000, isDirectory: false },
          { index: 1, filename: 'img2.jpg', path: '/img2.jpg', size: 2000, isDirectory: false },
        ],
        createdAt: new Date(),
      };
      vi.mocked(mockSessionManager.getSession).mockReturnValue(mockSession);
      vi.mocked(mockSessionManager.extractImage).mockResolvedValue(Buffer.from('image-data'));

      const mockFileStorage = createMockFileStorage();
      vi.mocked(mockFileStorage.saveOriginalFromStream).mockResolvedValue({
        path: 'uploads/test.png',
        filename: 'test.png',
      });
      vi.mocked(mockFileStorage.getAbsolutePath).mockReturnValue('/abs/uploads/test.png');

      const mockImageProcessor = createMockImageProcessor();
      vi.mocked(mockImageProcessor.getMetadata).mockResolvedValue({
        width: 800,
        height: 600,
      });
      vi.mocked(mockImageProcessor.generateThumbnail).mockResolvedValue({
        filename: 'test.png',
        path: 'thumbnails/test.png',
      });

      const mockImageRepository = createMockImageRepository();
      vi.mocked(mockImageRepository.create).mockResolvedValue({
        id: 'img-id-1',
        path: 'uploads/test.png',
        thumbnailPath: 'thumbnails/test.png',
        mimeType: 'image/png',
        size: 1000,
        width: 800,
        height: 600,
        title: 'Image 2026-01-25',
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const handler = createArchiveImportJobHandler({
        archiveSessionManager: mockSessionManager,
        imageRepository: mockImageRepository,
        fileStorage: mockFileStorage,
        imageProcessor: mockImageProcessor,
      });

      const job = createMockJob({ sessionId: 'session-1', indices: [0] });
      const updateProgress = vi.fn();

      const result = await handler(job, updateProgress);

      expect(result.totalRequested).toBe(1);
      expect(result.successCount).toBe(1);
      expect(result.failedCount).toBe(0);
      expect(result.results[0]?.success).toBe(true);
      expect(result.results[0]?.imageId).toBe('img-id-1');
      expect(updateProgress).toHaveBeenCalled();
    });

    it('should update progress during processing', async () => {
      const mockSessionManager = createMockArchiveSessionManager();
      const mockSession: ArchiveSession = {
        id: 'session-1',
        filename: 'test.zip',
        archiveType: 'zip',
        archivePath: '/tmp/test.zip',
        imageEntries: [
          { index: 0, filename: 'img1.png', path: '/img1.png', size: 1000, isDirectory: false },
          { index: 1, filename: 'img2.png', path: '/img2.png', size: 2000, isDirectory: false },
        ],
        createdAt: new Date(),
      };
      vi.mocked(mockSessionManager.getSession).mockReturnValue(mockSession);
      vi.mocked(mockSessionManager.extractImage).mockResolvedValue(Buffer.from('image-data'));

      const mockFileStorage = createMockFileStorage();
      vi.mocked(mockFileStorage.saveOriginalFromStream).mockResolvedValue({
        path: 'uploads/test.png',
        filename: 'test.png',
      });
      vi.mocked(mockFileStorage.getAbsolutePath).mockReturnValue('/abs/uploads/test.png');

      const mockImageProcessor = createMockImageProcessor();
      vi.mocked(mockImageProcessor.getMetadata).mockResolvedValue({
        width: 800,
        height: 600,
      });
      vi.mocked(mockImageProcessor.generateThumbnail).mockResolvedValue({
        filename: 'test.png',
        path: 'thumbnails/test.png',
      });

      const mockImageRepository = createMockImageRepository();
      vi.mocked(mockImageRepository.create).mockResolvedValue({
        id: 'img-id-1',
        path: 'uploads/test.png',
        thumbnailPath: 'thumbnails/test.png',
        mimeType: 'image/png',
        size: 1000,
        width: 800,
        height: 600,
        title: 'Image 2026-01-25',
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const handler = createArchiveImportJobHandler({
        archiveSessionManager: mockSessionManager,
        imageRepository: mockImageRepository,
        fileStorage: mockFileStorage,
        imageProcessor: mockImageProcessor,
      });

      const job = createMockJob({ sessionId: 'session-1', indices: [0, 1] });
      const updateProgress = vi.fn();

      await handler(job, updateProgress);

      // Progress should be updated for each image and at completion
      expect(updateProgress).toHaveBeenCalledTimes(3); // 2 images + final 100%
      expect(updateProgress).toHaveBeenLastCalledWith(100);
    });

    it('should cleanup files on metadata error', async () => {
      const mockSessionManager = createMockArchiveSessionManager();
      const mockSession: ArchiveSession = {
        id: 'session-1',
        filename: 'test.zip',
        archiveType: 'zip',
        archivePath: '/tmp/test.zip',
        imageEntries: [
          { index: 0, filename: 'img1.png', path: '/img1.png', size: 1000, isDirectory: false },
        ],
        createdAt: new Date(),
      };
      vi.mocked(mockSessionManager.getSession).mockReturnValue(mockSession);
      vi.mocked(mockSessionManager.extractImage).mockResolvedValue(Buffer.from('image-data'));

      const mockFileStorage = createMockFileStorage();
      vi.mocked(mockFileStorage.saveOriginalFromStream).mockResolvedValue({
        path: 'uploads/test.png',
        filename: 'test.png',
      });
      vi.mocked(mockFileStorage.getAbsolutePath).mockReturnValue('/abs/uploads/test.png');
      vi.mocked(mockFileStorage.deleteFile).mockResolvedValue();

      const mockImageProcessor = createMockImageProcessor();
      vi.mocked(mockImageProcessor.getMetadata).mockRejectedValue(new Error('Invalid image'));

      const handler = createArchiveImportJobHandler({
        archiveSessionManager: mockSessionManager,
        imageRepository: createMockImageRepository(),
        fileStorage: mockFileStorage,
        imageProcessor: mockImageProcessor,
      });

      const job = createMockJob({ sessionId: 'session-1', indices: [0] });
      const updateProgress = vi.fn();

      const result = await handler(job, updateProgress);

      expect(result.failedCount).toBe(1);
      expect(result.results[0]?.error).toBe('Invalid image');
      expect(mockFileStorage.deleteFile).toHaveBeenCalledWith('uploads/test.png');
    });

    it('should cleanup files on database creation error', async () => {
      const mockSessionManager = createMockArchiveSessionManager();
      const mockSession: ArchiveSession = {
        id: 'session-1',
        filename: 'test.zip',
        archiveType: 'zip',
        archivePath: '/tmp/test.zip',
        imageEntries: [
          { index: 0, filename: 'img1.png', path: '/img1.png', size: 1000, isDirectory: false },
        ],
        createdAt: new Date(),
      };
      vi.mocked(mockSessionManager.getSession).mockReturnValue(mockSession);
      vi.mocked(mockSessionManager.extractImage).mockResolvedValue(Buffer.from('image-data'));

      const mockFileStorage = createMockFileStorage();
      vi.mocked(mockFileStorage.saveOriginalFromStream).mockResolvedValue({
        path: 'uploads/test.png',
        filename: 'test.png',
      });
      vi.mocked(mockFileStorage.getAbsolutePath).mockReturnValue('/abs/uploads/test.png');
      vi.mocked(mockFileStorage.deleteFile).mockResolvedValue();

      const mockImageProcessor = createMockImageProcessor();
      vi.mocked(mockImageProcessor.getMetadata).mockResolvedValue({
        width: 800,
        height: 600,
      });
      vi.mocked(mockImageProcessor.generateThumbnail).mockResolvedValue({
        filename: 'test.png',
        path: 'thumbnails/test.png',
      });

      const mockImageRepository = createMockImageRepository();
      vi.mocked(mockImageRepository.create).mockRejectedValue(new Error('Database error'));

      const handler = createArchiveImportJobHandler({
        archiveSessionManager: mockSessionManager,
        imageRepository: mockImageRepository,
        fileStorage: mockFileStorage,
        imageProcessor: mockImageProcessor,
      });

      const job = createMockJob({ sessionId: 'session-1', indices: [0] });
      const updateProgress = vi.fn();

      const result = await handler(job, updateProgress);

      expect(result.failedCount).toBe(1);
      expect(result.results[0]?.error).toBe('Database error');
      // Both original file and thumbnail should be deleted
      expect(mockFileStorage.deleteFile).toHaveBeenCalledWith('uploads/test.png');
      expect(mockFileStorage.deleteFile).toHaveBeenCalledWith('thumbnails/test.png');
    });

    it('should handle non-Error thrown values', async () => {
      const mockSessionManager = createMockArchiveSessionManager();
      const mockSession: ArchiveSession = {
        id: 'session-1',
        filename: 'test.zip',
        archiveType: 'zip',
        archivePath: '/tmp/test.zip',
        imageEntries: [
          { index: 0, filename: 'img1.png', path: '/img1.png', size: 1000, isDirectory: false },
        ],
        createdAt: new Date(),
      };
      vi.mocked(mockSessionManager.getSession).mockReturnValue(mockSession);
      vi.mocked(mockSessionManager.extractImage).mockRejectedValue('string error');

      const handler = createArchiveImportJobHandler({
        archiveSessionManager: mockSessionManager,
        imageRepository: createMockImageRepository(),
        fileStorage: createMockFileStorage(),
        imageProcessor: createMockImageProcessor(),
      });

      const job = createMockJob({ sessionId: 'session-1', indices: [0] });
      const updateProgress = vi.fn();

      const result = await handler(job, updateProgress);

      expect(result.failedCount).toBe(1);
      expect(result.results[0]?.error).toBe('Unknown error');
    });
  });
});
