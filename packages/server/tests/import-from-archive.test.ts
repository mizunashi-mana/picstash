import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';
import { importFromArchive } from '@/application/archive/import-from-archive';
import type { ArchiveSessionManager, ArchiveSession } from '@/application/ports/archive-session-manager';
import type { FileStorage } from '@/application/ports/file-storage';
import type { ImageProcessor } from '@/application/ports/image-processor';
import type { Image, ImageRepository } from '@/application/ports/image-repository';

// Mock node:fs/promises
vi.mock('node:fs/promises', () => ({
  stat: vi.fn().mockResolvedValue({ size: 1000 }),
}));

function createMockSession(overrides: Partial<ArchiveSession> = {}): ArchiveSession {
  return {
    id: 'test-session-id',
    filename: 'test.zip',
    archiveType: 'zip',
    archivePath: '/tmp/test.zip',
    imageEntries: [
      { index: 0, filename: 'image1.png', path: 'image1.png', size: 1000, isDirectory: false },
      { index: 1, filename: 'image2.jpg', path: 'image2.jpg', size: 2000, isDirectory: false },
    ],
    createdAt: new Date(),
    ...overrides,
  };
}

function createMockImage(overrides: Partial<Image> = {}): Image {
  return {
    id: 'test-image-id',
    filename: 'saved-image.png',
    path: 'originals/saved-image.png',
    thumbnailPath: 'thumbnails/saved-image.jpg',
    mimeType: 'image/png',
    size: 1000,
    width: 100,
    height: 100,
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createMockDeps() {
  const mockArchiveSessionManager: ArchiveSessionManager = {
    createSession: vi.fn(),
    getSession: vi.fn(),
    extractImage: vi.fn(),
    deleteSession: vi.fn(),
  };

  const mockImageRepository: ImageRepository = {
    create: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    search: vi.fn(),
    updateById: vi.fn(),
    deleteById: vi.fn(),
    // Embedding-related methods
    findIdsWithoutEmbedding: vi.fn(),
    findByIdWithEmbedding: vi.fn(),
    findWithEmbedding: vi.fn(),
    updateEmbedding: vi.fn(),
    clearAllEmbeddings: vi.fn(),
    count: vi.fn(),
    countWithEmbedding: vi.fn(),
  };

  const mockFileStorage: FileStorage = {
    saveOriginalFromStream: vi.fn(),
    getAbsolutePath: vi.fn(),
    deleteFile: vi.fn(),
  };

  const mockImageProcessor: ImageProcessor = {
    getMetadata: vi.fn(),
    generateThumbnail: vi.fn(),
    generateThumbnailFromBuffer: vi.fn(),
  };

  return {
    archiveSessionManager: mockArchiveSessionManager,
    imageRepository: mockImageRepository,
    fileStorage: mockFileStorage,
    imageProcessor: mockImageProcessor,
  };
}

describe('importFromArchive', () => {
  describe('when session does not exist', () => {
    it('should return all failures', async () => {
      const deps = createMockDeps();
      vi.mocked(deps.archiveSessionManager.getSession).mockReturnValue(undefined);

      const result = await importFromArchive(
        { sessionId: 'non-existent', indices: [0, 1, 2] },
        deps,
      );

      expect(result.totalRequested).toBe(3);
      expect(result.successCount).toBe(0);
      expect(result.failedCount).toBe(3);
      expect(result.results).toHaveLength(3);
      expect(result.results.every(r => !r.success)).toBe(true);
      expect(result.results.every(r => r.error === 'Session not found')).toBe(true);
    });
  });

  describe('when entry does not exist in archive', () => {
    it('should return failure for that entry', async () => {
      const deps = createMockDeps();
      const session = createMockSession();
      vi.mocked(deps.archiveSessionManager.getSession).mockReturnValue(session);

      const result = await importFromArchive(
        { sessionId: 'test-session-id', indices: [999] },
        deps,
      );

      expect(result.totalRequested).toBe(1);
      expect(result.successCount).toBe(0);
      expect(result.failedCount).toBe(1);
      expect(result.results[0]?.success).toBe(false);
      expect(result.results[0]?.error).toBe('Entry 999 not found in archive');
    });
  });

  describe('when import succeeds', () => {
    it('should return success with created image', async () => {
      const deps = createMockDeps();
      const session = createMockSession();
      const mockImage = createMockImage();

      vi.mocked(deps.archiveSessionManager.getSession).mockReturnValue(session);
      vi.mocked(deps.archiveSessionManager.extractImage).mockResolvedValue(Buffer.from('image data'));
      vi.mocked(deps.fileStorage.saveOriginalFromStream).mockResolvedValue({
        filename: 'saved.png',
        path: 'originals/saved.png',
      });
      vi.mocked(deps.fileStorage.getAbsolutePath).mockReturnValue('/tmp/storage/originals/saved.png');
      vi.mocked(deps.imageProcessor.getMetadata).mockResolvedValue({ width: 100, height: 100 });
      vi.mocked(deps.imageProcessor.generateThumbnail).mockResolvedValue({
        filename: 'saved.jpg',
        path: 'thumbnails/saved.jpg',
      });
      vi.mocked(deps.imageRepository.create).mockResolvedValue(mockImage);

      const result = await importFromArchive(
        { sessionId: 'test-session-id', indices: [0] },
        deps,
      );

      expect(result.totalRequested).toBe(1);
      expect(result.successCount).toBe(1);
      expect(result.failedCount).toBe(0);
      expect(result.results[0]?.success).toBe(true);
      expect(result.results[0]?.image).toBe(mockImage);
    });

    it('should handle multiple indices', async () => {
      const deps = createMockDeps();
      const session = createMockSession();
      const mockImage = createMockImage();

      vi.mocked(deps.archiveSessionManager.getSession).mockReturnValue(session);
      vi.mocked(deps.archiveSessionManager.extractImage).mockResolvedValue(Buffer.from('image data'));
      vi.mocked(deps.fileStorage.saveOriginalFromStream).mockResolvedValue({
        filename: 'saved.png',
        path: 'originals/saved.png',
      });
      vi.mocked(deps.fileStorage.getAbsolutePath).mockReturnValue('/tmp/storage/originals/saved.png');
      vi.mocked(deps.imageProcessor.getMetadata).mockResolvedValue({ width: 100, height: 100 });
      vi.mocked(deps.imageProcessor.generateThumbnail).mockResolvedValue({
        filename: 'saved.jpg',
        path: 'thumbnails/saved.jpg',
      });
      vi.mocked(deps.imageRepository.create).mockResolvedValue(mockImage);

      const result = await importFromArchive(
        { sessionId: 'test-session-id', indices: [0, 1] },
        deps,
      );

      expect(result.totalRequested).toBe(2);
      expect(result.successCount).toBe(2);
      expect(result.failedCount).toBe(0);
    });
  });

  describe('when image processing fails', () => {
    it('should clean up saved file and return failure', async () => {
      const deps = createMockDeps();
      const session = createMockSession();

      vi.mocked(deps.archiveSessionManager.getSession).mockReturnValue(session);
      vi.mocked(deps.archiveSessionManager.extractImage).mockResolvedValue(Buffer.from('image data'));
      vi.mocked(deps.fileStorage.saveOriginalFromStream).mockResolvedValue({
        filename: 'saved.png',
        path: 'originals/saved.png',
      });
      vi.mocked(deps.fileStorage.getAbsolutePath).mockReturnValue('/tmp/storage/originals/saved.png');
      vi.mocked(deps.imageProcessor.getMetadata).mockRejectedValue(new Error('Invalid image'));
      vi.mocked(deps.fileStorage.deleteFile).mockResolvedValue();

      const result = await importFromArchive(
        { sessionId: 'test-session-id', indices: [0] },
        deps,
      );

      expect(result.successCount).toBe(0);
      expect(result.failedCount).toBe(1);
      expect(result.results[0]?.success).toBe(false);
      expect(result.results[0]?.error).toBe('Invalid image');
      expect(deps.fileStorage.deleteFile).toHaveBeenCalledWith('originals/saved.png');
    });
  });

  describe('when database creation fails', () => {
    it('should clean up saved file and thumbnail and return failure', async () => {
      const deps = createMockDeps();
      const session = createMockSession();

      vi.mocked(deps.archiveSessionManager.getSession).mockReturnValue(session);
      vi.mocked(deps.archiveSessionManager.extractImage).mockResolvedValue(Buffer.from('image data'));
      vi.mocked(deps.fileStorage.saveOriginalFromStream).mockResolvedValue({
        filename: 'saved.png',
        path: 'originals/saved.png',
      });
      vi.mocked(deps.fileStorage.getAbsolutePath).mockReturnValue('/tmp/storage/originals/saved.png');
      vi.mocked(deps.imageProcessor.getMetadata).mockResolvedValue({ width: 100, height: 100 });
      vi.mocked(deps.imageProcessor.generateThumbnail).mockResolvedValue({
        filename: 'saved.jpg',
        path: 'thumbnails/saved.jpg',
      });
      vi.mocked(deps.imageRepository.create).mockRejectedValue(new Error('Database error'));
      vi.mocked(deps.fileStorage.deleteFile).mockResolvedValue();

      const result = await importFromArchive(
        { sessionId: 'test-session-id', indices: [0] },
        deps,
      );

      expect(result.successCount).toBe(0);
      expect(result.failedCount).toBe(1);
      expect(result.results[0]?.success).toBe(false);
      expect(result.results[0]?.error).toBe('Database error');
      expect(deps.fileStorage.deleteFile).toHaveBeenCalledWith('originals/saved.png');
      expect(deps.fileStorage.deleteFile).toHaveBeenCalledWith('thumbnails/saved.jpg');
    });
  });

  describe('mixed success and failure', () => {
    it('should handle partial success', async () => {
      const deps = createMockDeps();
      const session = createMockSession();
      const mockImage = createMockImage();

      vi.mocked(deps.archiveSessionManager.getSession).mockReturnValue(session);
      vi.mocked(deps.archiveSessionManager.extractImage)
        .mockResolvedValueOnce(Buffer.from('image data'))
        .mockRejectedValueOnce(new Error('Extraction failed'));
      vi.mocked(deps.fileStorage.saveOriginalFromStream).mockResolvedValue({
        filename: 'saved.png',
        path: 'originals/saved.png',
      });
      vi.mocked(deps.fileStorage.getAbsolutePath).mockReturnValue('/tmp/storage/originals/saved.png');
      vi.mocked(deps.imageProcessor.getMetadata).mockResolvedValue({ width: 100, height: 100 });
      vi.mocked(deps.imageProcessor.generateThumbnail).mockResolvedValue({
        filename: 'saved.jpg',
        path: 'thumbnails/saved.jpg',
      });
      vi.mocked(deps.imageRepository.create).mockResolvedValue(mockImage);

      const result = await importFromArchive(
        { sessionId: 'test-session-id', indices: [0, 1] },
        deps,
      );

      expect(result.totalRequested).toBe(2);
      expect(result.successCount).toBe(1);
      expect(result.failedCount).toBe(1);
      expect(result.results[0]?.success).toBe(true);
      expect(result.results[1]?.success).toBe(false);
      expect(result.results[1]?.error).toBe('Extraction failed');
    });
  });
});
