import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';
import { importFromUrlCrawl } from '@/application/url-crawl/import-from-url-crawl';
import type { FileStorage } from '@/application/ports/file-storage';
import type { ImageProcessor } from '@/application/ports/image-processor';
import type { ImageEntity, ImageRepository } from '@/application/ports/image-repository';
import type { UrlCrawlSessionManager, UrlCrawlSession } from '@/application/ports/url-crawl-session-manager';

function createMockSession(overrides: Partial<UrlCrawlSession> = {}): UrlCrawlSession {
  return {
    id: 'test-session-id',
    sourceUrl: 'https://example.com/gallery',
    pageTitle: 'Test Gallery',
    imageEntries: [
      { index: 0, url: 'https://example.com/image1.png', filename: 'image1.png' },
      { index: 1, url: 'https://example.com/image2.jpg', filename: 'image2.jpg' },
    ],
    createdAt: new Date(),
    ...overrides,
  };
}

function createMockImage(overrides: Partial<ImageEntity> = {}): ImageEntity {
  return {
    id: 'test-image-id',
    path: 'originals/saved-image.png',
    thumbnailPath: 'thumbnails/saved-image.jpg',
    mimeType: 'image/png',
    size: 1000,
    width: 100,
    height: 100,
    title: '無題の画像 (test)',
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createMockDeps() {
  const mockUrlCrawlSessionManager: UrlCrawlSessionManager = {
    createSession: vi.fn(),
    getSession: vi.fn(),
    fetchImage: vi.fn(),
    deleteSession: vi.fn(),
  };

  const mockImageRepository: ImageRepository = {
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

  const mockFileStorage: FileStorage = {
    saveFile: vi.fn(),
    saveFileFromBuffer: vi.fn(),
    readFile: vi.fn(),
    readFileAsStream: vi.fn(),
    getFileSize: vi.fn(),
    fileExists: vi.fn(),
    deleteFile: vi.fn(),
  };

  const mockImageProcessor: ImageProcessor = {
    getMetadata: vi.fn(),
    generateThumbnail: vi.fn(),
  };

  return {
    urlCrawlSessionManager: mockUrlCrawlSessionManager,
    imageRepository: mockImageRepository,
    fileStorage: mockFileStorage,
    imageProcessor: mockImageProcessor,
  };
}

describe('importFromUrlCrawl', () => {
  describe('when session does not exist', () => {
    it('should return all failures', async () => {
      const deps = createMockDeps();
      vi.mocked(deps.urlCrawlSessionManager.getSession).mockReturnValue(undefined);

      const result = await importFromUrlCrawl(
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

  describe('when image entry does not exist in session', () => {
    it('should return failure for that entry', async () => {
      const deps = createMockDeps();
      const session = createMockSession();
      vi.mocked(deps.urlCrawlSessionManager.getSession).mockReturnValue(session);

      const result = await importFromUrlCrawl(
        { sessionId: 'test-session-id', indices: [999] },
        deps,
      );

      expect(result.totalRequested).toBe(1);
      expect(result.successCount).toBe(0);
      expect(result.failedCount).toBe(1);
      expect(result.results[0]?.success).toBe(false);
      expect(result.results[0]?.error).toBe('Image 999 not found in session');
    });
  });

  describe('when import succeeds', () => {
    function setupSuccessMocks(deps: ReturnType<typeof createMockDeps>): void {
      vi.mocked(deps.fileStorage.saveFile).mockResolvedValue({
        filename: 'saved.png',
        path: 'originals/saved.png',
      });
      vi.mocked(deps.fileStorage.getFileSize).mockResolvedValue(1000);
      vi.mocked(deps.fileStorage.readFile).mockResolvedValue(Buffer.from('image data'));
      vi.mocked(deps.imageProcessor.getMetadata).mockResolvedValue({ width: 100, height: 100 });
      vi.mocked(deps.imageProcessor.generateThumbnail).mockResolvedValue(Buffer.from('thumbnail'));
      vi.mocked(deps.fileStorage.saveFileFromBuffer).mockResolvedValue({
        filename: 'saved.jpg',
        path: 'thumbnails/saved.jpg',
      });
    }

    it('should return success with created image', async () => {
      const deps = createMockDeps();
      const session = createMockSession();
      const mockImage = createMockImage();

      vi.mocked(deps.urlCrawlSessionManager.getSession).mockReturnValue(session);
      vi.mocked(deps.urlCrawlSessionManager.fetchImage).mockResolvedValue({
        data: Buffer.from('image data'),
        contentType: 'image/png',
      });
      setupSuccessMocks(deps);
      vi.mocked(deps.imageRepository.create).mockResolvedValue(mockImage);

      const result = await importFromUrlCrawl(
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

      vi.mocked(deps.urlCrawlSessionManager.getSession).mockReturnValue(session);
      vi.mocked(deps.urlCrawlSessionManager.fetchImage).mockResolvedValue({
        data: Buffer.from('image data'),
        contentType: 'image/jpeg',
      });
      setupSuccessMocks(deps);
      vi.mocked(deps.imageRepository.create).mockResolvedValue(mockImage);

      const result = await importFromUrlCrawl(
        { sessionId: 'test-session-id', indices: [0, 1] },
        deps,
      );

      expect(result.totalRequested).toBe(2);
      expect(result.successCount).toBe(2);
      expect(result.failedCount).toBe(0);
    });

    it('should handle content type with charset', async () => {
      const deps = createMockDeps();
      const session = createMockSession();
      const mockImage = createMockImage();

      vi.mocked(deps.urlCrawlSessionManager.getSession).mockReturnValue(session);
      vi.mocked(deps.urlCrawlSessionManager.fetchImage).mockResolvedValue({
        data: Buffer.from('image data'),
        contentType: 'image/png; charset=utf-8',
      });
      setupSuccessMocks(deps);
      vi.mocked(deps.imageRepository.create).mockResolvedValue(mockImage);

      const result = await importFromUrlCrawl(
        { sessionId: 'test-session-id', indices: [0] },
        deps,
      );

      expect(result.successCount).toBe(1);
    });

    it('should use default extension for unknown content type', async () => {
      const deps = createMockDeps();
      const session = createMockSession();
      const mockImage = createMockImage();

      vi.mocked(deps.urlCrawlSessionManager.getSession).mockReturnValue(session);
      vi.mocked(deps.urlCrawlSessionManager.fetchImage).mockResolvedValue({
        data: Buffer.from('image data'),
        contentType: 'application/octet-stream',
      });
      setupSuccessMocks(deps);
      vi.mocked(deps.imageRepository.create).mockResolvedValue(mockImage);

      const result = await importFromUrlCrawl(
        { sessionId: 'test-session-id', indices: [0] },
        deps,
      );

      expect(result.successCount).toBe(1);
      expect(deps.fileStorage.saveFile).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ extension: '.jpg' }),
      );
    });

    it('should use .gif extension for image/gif content type', async () => {
      const deps = createMockDeps();
      const session = createMockSession();
      const mockImage = createMockImage();

      vi.mocked(deps.urlCrawlSessionManager.getSession).mockReturnValue(session);
      vi.mocked(deps.urlCrawlSessionManager.fetchImage).mockResolvedValue({
        data: Buffer.from('image data'),
        contentType: 'image/gif',
      });
      setupSuccessMocks(deps);
      vi.mocked(deps.imageRepository.create).mockResolvedValue(mockImage);

      const result = await importFromUrlCrawl(
        { sessionId: 'test-session-id', indices: [0] },
        deps,
      );

      expect(result.successCount).toBe(1);
      expect(deps.fileStorage.saveFile).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ extension: '.gif' }),
      );
    });

    it('should use .webp extension for image/webp content type', async () => {
      const deps = createMockDeps();
      const session = createMockSession();
      const mockImage = createMockImage();

      vi.mocked(deps.urlCrawlSessionManager.getSession).mockReturnValue(session);
      vi.mocked(deps.urlCrawlSessionManager.fetchImage).mockResolvedValue({
        data: Buffer.from('image data'),
        contentType: 'image/webp',
      });
      setupSuccessMocks(deps);
      vi.mocked(deps.imageRepository.create).mockResolvedValue(mockImage);

      const result = await importFromUrlCrawl(
        { sessionId: 'test-session-id', indices: [0] },
        deps,
      );

      expect(result.successCount).toBe(1);
      expect(deps.fileStorage.saveFile).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ extension: '.webp' }),
      );
    });

    it('should use .bmp extension for image/bmp content type', async () => {
      const deps = createMockDeps();
      const session = createMockSession();
      const mockImage = createMockImage();

      vi.mocked(deps.urlCrawlSessionManager.getSession).mockReturnValue(session);
      vi.mocked(deps.urlCrawlSessionManager.fetchImage).mockResolvedValue({
        data: Buffer.from('image data'),
        contentType: 'image/bmp',
      });
      setupSuccessMocks(deps);
      vi.mocked(deps.imageRepository.create).mockResolvedValue(mockImage);

      const result = await importFromUrlCrawl(
        { sessionId: 'test-session-id', indices: [0] },
        deps,
      );

      expect(result.successCount).toBe(1);
      expect(deps.fileStorage.saveFile).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ extension: '.bmp' }),
      );
    });
  });

  describe('when fetch fails', () => {
    it('should return failure', async () => {
      const deps = createMockDeps();
      const session = createMockSession();

      vi.mocked(deps.urlCrawlSessionManager.getSession).mockReturnValue(session);
      vi.mocked(deps.urlCrawlSessionManager.fetchImage).mockRejectedValue(new Error('Network error'));

      const result = await importFromUrlCrawl(
        { sessionId: 'test-session-id', indices: [0] },
        deps,
      );

      expect(result.successCount).toBe(0);
      expect(result.failedCount).toBe(1);
      expect(result.results[0]?.success).toBe(false);
      expect(result.results[0]?.error).toBe('Network error');
    });
  });

  describe('when file reading fails', () => {
    it('should clean up saved file when getFileSize fails', async () => {
      const deps = createMockDeps();
      const session = createMockSession();

      vi.mocked(deps.urlCrawlSessionManager.getSession).mockReturnValue(session);
      vi.mocked(deps.urlCrawlSessionManager.fetchImage).mockResolvedValue({
        data: Buffer.from('image data'),
        contentType: 'image/png',
      });
      vi.mocked(deps.fileStorage.saveFile).mockResolvedValue({
        filename: 'saved.png',
        path: 'originals/saved.png',
      });
      vi.mocked(deps.fileStorage.getFileSize).mockRejectedValue(new Error('File size error'));
      vi.mocked(deps.fileStorage.deleteFile).mockResolvedValue();

      const result = await importFromUrlCrawl(
        { sessionId: 'test-session-id', indices: [0] },
        deps,
      );

      expect(result.successCount).toBe(0);
      expect(result.failedCount).toBe(1);
      expect(result.results[0]?.error).toBe('File size error');
      expect(deps.fileStorage.deleteFile).toHaveBeenCalledWith('originals/saved.png');
    });

    it('should clean up saved file when readFile fails', async () => {
      const deps = createMockDeps();
      const session = createMockSession();

      vi.mocked(deps.urlCrawlSessionManager.getSession).mockReturnValue(session);
      vi.mocked(deps.urlCrawlSessionManager.fetchImage).mockResolvedValue({
        data: Buffer.from('image data'),
        contentType: 'image/png',
      });
      vi.mocked(deps.fileStorage.saveFile).mockResolvedValue({
        filename: 'saved.png',
        path: 'originals/saved.png',
      });
      vi.mocked(deps.fileStorage.getFileSize).mockResolvedValue(1000);
      vi.mocked(deps.fileStorage.readFile).mockRejectedValue(new Error('Read file error'));
      vi.mocked(deps.fileStorage.deleteFile).mockResolvedValue();

      const result = await importFromUrlCrawl(
        { sessionId: 'test-session-id', indices: [0] },
        deps,
      );

      expect(result.successCount).toBe(0);
      expect(result.failedCount).toBe(1);
      expect(result.results[0]?.error).toBe('Read file error');
      expect(deps.fileStorage.deleteFile).toHaveBeenCalledWith('originals/saved.png');
    });

    it('should continue even if cleanup fails after readFile error', async () => {
      const deps = createMockDeps();
      const session = createMockSession();

      vi.mocked(deps.urlCrawlSessionManager.getSession).mockReturnValue(session);
      vi.mocked(deps.urlCrawlSessionManager.fetchImage).mockResolvedValue({
        data: Buffer.from('image data'),
        contentType: 'image/png',
      });
      vi.mocked(deps.fileStorage.saveFile).mockResolvedValue({
        filename: 'saved.png',
        path: 'originals/saved.png',
      });
      vi.mocked(deps.fileStorage.getFileSize).mockResolvedValue(1000);
      vi.mocked(deps.fileStorage.readFile).mockRejectedValue(new Error('Read file error'));
      vi.mocked(deps.fileStorage.deleteFile).mockRejectedValue(new Error('Cleanup failed'));

      const result = await importFromUrlCrawl(
        { sessionId: 'test-session-id', indices: [0] },
        deps,
      );

      expect(result.successCount).toBe(0);
      expect(result.failedCount).toBe(1);
      expect(result.results[0]?.error).toBe('Read file error');
    });
  });

  describe('when image processing fails', () => {
    it('should clean up saved file and return failure', async () => {
      const deps = createMockDeps();
      const session = createMockSession();

      vi.mocked(deps.urlCrawlSessionManager.getSession).mockReturnValue(session);
      vi.mocked(deps.urlCrawlSessionManager.fetchImage).mockResolvedValue({
        data: Buffer.from('image data'),
        contentType: 'image/png',
      });
      vi.mocked(deps.fileStorage.saveFile).mockResolvedValue({
        filename: 'saved.png',
        path: 'originals/saved.png',
      });
      vi.mocked(deps.fileStorage.getFileSize).mockResolvedValue(1000);
      vi.mocked(deps.fileStorage.readFile).mockResolvedValue(Buffer.from('image data'));
      vi.mocked(deps.imageProcessor.getMetadata).mockRejectedValue(new Error('Invalid image'));
      vi.mocked(deps.fileStorage.deleteFile).mockResolvedValue();

      const result = await importFromUrlCrawl(
        { sessionId: 'test-session-id', indices: [0] },
        deps,
      );

      expect(result.successCount).toBe(0);
      expect(result.failedCount).toBe(1);
      expect(result.results[0]?.success).toBe(false);
      expect(result.results[0]?.error).toBe('Invalid image');
      expect(deps.fileStorage.deleteFile).toHaveBeenCalledWith('originals/saved.png');
    });

    it('should continue even when cleanup fails', async () => {
      const deps = createMockDeps();
      const session = createMockSession();

      vi.mocked(deps.urlCrawlSessionManager.getSession).mockReturnValue(session);
      vi.mocked(deps.urlCrawlSessionManager.fetchImage).mockResolvedValue({
        data: Buffer.from('image data'),
        contentType: 'image/png',
      });
      vi.mocked(deps.fileStorage.saveFile).mockResolvedValue({
        filename: 'saved.png',
        path: 'originals/saved.png',
      });
      vi.mocked(deps.fileStorage.getFileSize).mockResolvedValue(1000);
      vi.mocked(deps.fileStorage.readFile).mockResolvedValue(Buffer.from('image data'));
      vi.mocked(deps.imageProcessor.getMetadata).mockRejectedValue(new Error('Invalid image'));
      vi.mocked(deps.fileStorage.deleteFile).mockRejectedValue(new Error('Cleanup failed'));

      const result = await importFromUrlCrawl(
        { sessionId: 'test-session-id', indices: [0] },
        deps,
      );

      expect(result.successCount).toBe(0);
      expect(result.failedCount).toBe(1);
      expect(result.results[0]?.error).toBe('Invalid image');
    });
  });

  describe('when database creation fails', () => {
    it('should clean up saved file and thumbnail and return failure', async () => {
      const deps = createMockDeps();
      const session = createMockSession();

      vi.mocked(deps.urlCrawlSessionManager.getSession).mockReturnValue(session);
      vi.mocked(deps.urlCrawlSessionManager.fetchImage).mockResolvedValue({
        data: Buffer.from('image data'),
        contentType: 'image/png',
      });
      vi.mocked(deps.fileStorage.saveFile).mockResolvedValue({
        filename: 'saved.png',
        path: 'originals/saved.png',
      });
      vi.mocked(deps.fileStorage.getFileSize).mockResolvedValue(1000);
      vi.mocked(deps.fileStorage.readFile).mockResolvedValue(Buffer.from('image data'));
      vi.mocked(deps.imageProcessor.getMetadata).mockResolvedValue({ width: 100, height: 100 });
      vi.mocked(deps.imageProcessor.generateThumbnail).mockResolvedValue(Buffer.from('thumbnail'));
      vi.mocked(deps.fileStorage.saveFileFromBuffer).mockResolvedValue({
        filename: 'saved.jpg',
        path: 'thumbnails/saved.jpg',
      });
      vi.mocked(deps.imageRepository.create).mockRejectedValue(new Error('Database error'));
      vi.mocked(deps.fileStorage.deleteFile).mockResolvedValue();

      const result = await importFromUrlCrawl(
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

    it('should continue even if cleanup fails after database error', async () => {
      const deps = createMockDeps();
      const session = createMockSession();

      vi.mocked(deps.urlCrawlSessionManager.getSession).mockReturnValue(session);
      vi.mocked(deps.urlCrawlSessionManager.fetchImage).mockResolvedValue({
        data: Buffer.from('image data'),
        contentType: 'image/png',
      });
      vi.mocked(deps.fileStorage.saveFile).mockResolvedValue({
        filename: 'saved.png',
        path: 'originals/saved.png',
      });
      vi.mocked(deps.fileStorage.getFileSize).mockResolvedValue(1000);
      vi.mocked(deps.fileStorage.readFile).mockResolvedValue(Buffer.from('image data'));
      vi.mocked(deps.imageProcessor.getMetadata).mockResolvedValue({ width: 100, height: 100 });
      vi.mocked(deps.imageProcessor.generateThumbnail).mockResolvedValue(Buffer.from('thumbnail'));
      vi.mocked(deps.fileStorage.saveFileFromBuffer).mockResolvedValue({
        filename: 'saved.jpg',
        path: 'thumbnails/saved.jpg',
      });
      vi.mocked(deps.imageRepository.create).mockRejectedValue(new Error('Database error'));
      vi.mocked(deps.fileStorage.deleteFile).mockRejectedValue(new Error('Cleanup failed'));

      const result = await importFromUrlCrawl(
        { sessionId: 'test-session-id', indices: [0] },
        deps,
      );

      expect(result.successCount).toBe(0);
      expect(result.failedCount).toBe(1);
      expect(result.results[0]?.error).toBe('Database error');
    });
  });

  describe('mixed success and failure', () => {
    it('should handle partial success', async () => {
      const deps = createMockDeps();
      const session = createMockSession();
      const mockImage = createMockImage();

      vi.mocked(deps.urlCrawlSessionManager.getSession).mockReturnValue(session);
      vi.mocked(deps.urlCrawlSessionManager.fetchImage)
        .mockResolvedValueOnce({ data: Buffer.from('image data'), contentType: 'image/png' })
        .mockRejectedValueOnce(new Error('Network error'));
      vi.mocked(deps.fileStorage.saveFile).mockResolvedValue({
        filename: 'saved.png',
        path: 'originals/saved.png',
      });
      vi.mocked(deps.fileStorage.getFileSize).mockResolvedValue(1000);
      vi.mocked(deps.fileStorage.readFile).mockResolvedValue(Buffer.from('image data'));
      vi.mocked(deps.imageProcessor.getMetadata).mockResolvedValue({ width: 100, height: 100 });
      vi.mocked(deps.imageProcessor.generateThumbnail).mockResolvedValue(Buffer.from('thumbnail'));
      vi.mocked(deps.fileStorage.saveFileFromBuffer).mockResolvedValue({
        filename: 'saved.jpg',
        path: 'thumbnails/saved.jpg',
      });
      vi.mocked(deps.imageRepository.create).mockResolvedValue(mockImage);

      const result = await importFromUrlCrawl(
        { sessionId: 'test-session-id', indices: [0, 1] },
        deps,
      );

      expect(result.totalRequested).toBe(2);
      expect(result.successCount).toBe(1);
      expect(result.failedCount).toBe(1);
      expect(result.results[0]?.success).toBe(true);
      expect(result.results[1]?.success).toBe(false);
      expect(result.results[1]?.error).toBe('Network error');
    });
  });
});
