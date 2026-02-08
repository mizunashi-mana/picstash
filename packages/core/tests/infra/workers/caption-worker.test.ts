import 'reflect-metadata';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { EMBEDDING_DIMENSION } from '@/application/ports/embedding-repository';
import { createCaptionJobHandler, CAPTION_JOB_TYPE } from '@/infra/workers/caption-worker';
import type { CaptionService } from '@/application/ports/caption-service';
import type { EmbeddingRepository } from '@/application/ports/embedding-repository';
import type { FileStorage } from '@/application/ports/file-storage';
import type { ImageEntity, ImageRepository } from '@/application/ports/image-repository';
import type { Job } from '@/application/ports/job-queue';
import type { OcrService } from '@/application/ports/ocr-service';

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
    saveFile: vi.fn(),
    saveFileFromBuffer: vi.fn(),
    readFile: vi.fn(),
    readFileAsStream: vi.fn(),
    getFileSize: vi.fn(),
    fileExists: vi.fn(),
    deleteFile: vi.fn(),
  };
}

function createMockCaptionService(): CaptionService {
  return {
    generateFromFile: vi.fn(),
    generateFromBuffer: vi.fn(),
    generateWithContext: vi.fn(),
    generateWithContextFromBuffer: vi.fn(),
    getModel: vi.fn().mockReturnValue('test-model'),
    isReady: vi.fn().mockReturnValue(true),
    initialize: vi.fn().mockResolvedValue(undefined),
  };
}

function createMockEmbeddingRepository(): EmbeddingRepository {
  return {
    upsert: vi.fn(),
    remove: vi.fn(),
    findSimilar: vi.fn(),
    count: vi.fn(),
    getAllImageIds: vi.fn().mockReturnValue([]),
    hasEmbedding: vi.fn(),
    close: vi.fn(),
  };
}

function createMockOcrService(): OcrService {
  return {
    extractText: vi.fn(),
    extractTextFromBuffer: vi.fn(),
    isReady: vi.fn().mockReturnValue(true),
    initialize: vi.fn().mockResolvedValue(undefined),
    terminate: vi.fn().mockResolvedValue(undefined),
  };
}

function createMockImage(overrides: Partial<ImageEntity> = {}): ImageEntity {
  return {
    id: 'test-image-id',
    path: 'originals/test-image.png',
    thumbnailPath: 'thumbnails/test-image.jpg',
    mimeType: 'image/png',
    size: 1000,
    width: 100,
    height: 100,
    title: 'Test Image',
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createMockJob(payload: { imageId: string }): Job<{ imageId: string }> {
  return {
    id: 'test-job-id',
    type: CAPTION_JOB_TYPE,
    payload,
    status: 'waiting',
    progress: 0,
    attempts: 0,
    maxAttempts: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe('createCaptionJobHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export CAPTION_JOB_TYPE constant', () => {
    expect(CAPTION_JOB_TYPE).toBe('caption-generation');
  });

  describe('success cases', () => {
    it('should generate caption successfully without OCR', async () => {
      const imageRepository = createMockImageRepository();
      const fileStorage = createMockFileStorage();
      const captionService = createMockCaptionService();
      const embeddingRepository = createMockEmbeddingRepository();
      const mockImage = createMockImage();
      const updateProgress = vi.fn().mockResolvedValue(undefined);

      vi.mocked(imageRepository.findById).mockResolvedValue(mockImage);
      vi.mocked(imageRepository.findByIdWithEmbedding).mockResolvedValue({
        ...mockImage,
        embedding: null,
      });
      vi.mocked(fileStorage.fileExists).mockResolvedValue(true);
      vi.mocked(fileStorage.readFile).mockResolvedValue(Buffer.from('image data'));
      vi.mocked(captionService.generateWithContextFromBuffer).mockResolvedValue({
        caption: 'A beautiful landscape',
        model: 'test-model',
      });

      const handler = createCaptionJobHandler({
        imageRepository,
        fileStorage,
        captionService,
        embeddingRepository,
      });

      const job = createMockJob({ imageId: 'test-image-id' });
      const result = await handler(job, updateProgress);

      expect(result).toEqual({
        description: 'A beautiful landscape',
        model: 'test-model',
        usedContext: false,
      });
      expect(updateProgress).toHaveBeenCalledWith(10);
      expect(updateProgress).toHaveBeenCalledWith(100);
    });

    it('should generate caption with OCR text', async () => {
      const imageRepository = createMockImageRepository();
      const fileStorage = createMockFileStorage();
      const captionService = createMockCaptionService();
      const embeddingRepository = createMockEmbeddingRepository();
      const ocrService = createMockOcrService();
      const mockImage = createMockImage();
      const updateProgress = vi.fn().mockResolvedValue(undefined);

      vi.mocked(imageRepository.findById).mockResolvedValue(mockImage);
      vi.mocked(imageRepository.findByIdWithEmbedding).mockResolvedValue({
        ...mockImage,
        embedding: null,
      });
      vi.mocked(fileStorage.fileExists).mockResolvedValue(true);
      vi.mocked(fileStorage.readFile).mockResolvedValue(Buffer.from('image data'));
      vi.mocked(ocrService.extractTextFromBuffer).mockResolvedValue({
        text: 'Hello World',
        confidence: 0.9,
      });
      vi.mocked(captionService.generateWithContextFromBuffer).mockResolvedValue({
        caption: 'An image with text "Hello World"',
        model: 'test-model',
      });

      const handler = createCaptionJobHandler({
        imageRepository,
        fileStorage,
        captionService,
        embeddingRepository,
        ocrService,
      });

      const job = createMockJob({ imageId: 'test-image-id' });
      const result = await handler(job, updateProgress);

      expect(result.usedContext).toBe(true);
      expect(ocrService.extractTextFromBuffer).toHaveBeenCalledWith(Buffer.from('image data'));
    });

    it('should use similar image descriptions when available', async () => {
      const imageRepository = createMockImageRepository();
      const fileStorage = createMockFileStorage();
      const captionService = createMockCaptionService();
      const embeddingRepository = createMockEmbeddingRepository();
      const mockImage = createMockImage();
      const updateProgress = vi.fn().mockResolvedValue(undefined);

      // Create a valid embedding buffer
      const embeddingArray = new Float32Array(EMBEDDING_DIMENSION);
      embeddingArray.fill(0.1);
      const embeddingBuffer = new Uint8Array(embeddingArray.buffer);

      vi.mocked(imageRepository.findById).mockResolvedValue(mockImage);
      vi.mocked(imageRepository.findByIdWithEmbedding).mockResolvedValue({
        ...mockImage,
        embedding: embeddingBuffer,
      });
      vi.mocked(embeddingRepository.findSimilar).mockReturnValue([
        { imageId: 'similar-1', distance: 0.1 },
      ]);
      vi.mocked(imageRepository.findByIds).mockResolvedValue([
        createMockImage({ id: 'similar-1', description: 'A similar image' }),
      ]);
      vi.mocked(fileStorage.fileExists).mockResolvedValue(true);
      vi.mocked(fileStorage.readFile).mockResolvedValue(Buffer.from('image data'));
      vi.mocked(captionService.generateWithContextFromBuffer).mockResolvedValue({
        caption: 'Generated caption',
        model: 'test-model',
      });

      const handler = createCaptionJobHandler({
        imageRepository,
        fileStorage,
        captionService,
        embeddingRepository,
      });

      const job = createMockJob({ imageId: 'test-image-id' });
      const result = await handler(job, updateProgress);

      expect(result.usedContext).toBe(true);
      expect(captionService.generateWithContextFromBuffer).toHaveBeenCalledWith(
        expect.any(Buffer),
        expect.objectContaining({
          similarDescriptions: expect.arrayContaining([
            expect.objectContaining({ description: 'A similar image' }),
          ]),
        }),
      );
    });
  });

  describe('error cases', () => {
    it('should throw error when image not found', async () => {
      const imageRepository = createMockImageRepository();
      const fileStorage = createMockFileStorage();
      const captionService = createMockCaptionService();
      const embeddingRepository = createMockEmbeddingRepository();
      const updateProgress = vi.fn().mockResolvedValue(undefined);

      vi.mocked(imageRepository.findById).mockResolvedValue(null);

      const handler = createCaptionJobHandler({
        imageRepository,
        fileStorage,
        captionService,
        embeddingRepository,
      });

      const job = createMockJob({ imageId: 'non-existent' });

      await expect(handler(job, updateProgress)).rejects.toThrow('Image not found: non-existent');
    });

    it('should throw error when image file not found on disk', async () => {
      const imageRepository = createMockImageRepository();
      const fileStorage = createMockFileStorage();
      const captionService = createMockCaptionService();
      const embeddingRepository = createMockEmbeddingRepository();
      const mockImage = createMockImage();
      const updateProgress = vi.fn().mockResolvedValue(undefined);

      vi.mocked(imageRepository.findById).mockResolvedValue(mockImage);
      vi.mocked(fileStorage.fileExists).mockResolvedValue(false);

      const handler = createCaptionJobHandler({
        imageRepository,
        fileStorage,
        captionService,
        embeddingRepository,
      });

      const job = createMockJob({ imageId: 'test-image-id' });

      await expect(handler(job, updateProgress)).rejects.toThrow('Image file not found on disk');
    });

    it('should continue when OCR fails', async () => {
      const imageRepository = createMockImageRepository();
      const fileStorage = createMockFileStorage();
      const captionService = createMockCaptionService();
      const embeddingRepository = createMockEmbeddingRepository();
      const ocrService = createMockOcrService();
      const mockImage = createMockImage();
      const updateProgress = vi.fn().mockResolvedValue(undefined);
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      vi.mocked(imageRepository.findById).mockResolvedValue(mockImage);
      vi.mocked(imageRepository.findByIdWithEmbedding).mockResolvedValue({
        ...mockImage,
        embedding: null,
      });
      vi.mocked(fileStorage.fileExists).mockResolvedValue(true);
      vi.mocked(fileStorage.readFile).mockResolvedValue(Buffer.from('image data'));
      vi.mocked(ocrService.extractTextFromBuffer).mockRejectedValue(new Error('OCR failed'));
      vi.mocked(captionService.generateWithContextFromBuffer).mockResolvedValue({
        caption: 'Generated caption',
        model: 'test-model',
      });

      const handler = createCaptionJobHandler({
        imageRepository,
        fileStorage,
        captionService,
        embeddingRepository,
        ocrService,
      });

      const job = createMockJob({ imageId: 'test-image-id' });
      const result = await handler(job, updateProgress);

      expect(result.description).toBe('Generated caption');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should skip OCR when text is empty', async () => {
      const imageRepository = createMockImageRepository();
      const fileStorage = createMockFileStorage();
      const captionService = createMockCaptionService();
      const embeddingRepository = createMockEmbeddingRepository();
      const ocrService = createMockOcrService();
      const mockImage = createMockImage();
      const updateProgress = vi.fn().mockResolvedValue(undefined);

      vi.mocked(imageRepository.findById).mockResolvedValue(mockImage);
      vi.mocked(imageRepository.findByIdWithEmbedding).mockResolvedValue({
        ...mockImage,
        embedding: null,
      });
      vi.mocked(fileStorage.fileExists).mockResolvedValue(true);
      vi.mocked(fileStorage.readFile).mockResolvedValue(Buffer.from('image data'));
      vi.mocked(ocrService.extractTextFromBuffer).mockResolvedValue({
        text: '   ',
        confidence: 0.5,
      });
      vi.mocked(captionService.generateWithContextFromBuffer).mockResolvedValue({
        caption: 'Generated caption',
        model: 'test-model',
      });

      const handler = createCaptionJobHandler({
        imageRepository,
        fileStorage,
        captionService,
        embeddingRepository,
        ocrService,
      });

      const job = createMockJob({ imageId: 'test-image-id' });
      const result = await handler(job, updateProgress);

      expect(result.usedContext).toBe(false);
    });
  });

  describe('getSimilarImageDescriptions edge cases', () => {
    it('should return empty when embedding has wrong dimensions', async () => {
      const imageRepository = createMockImageRepository();
      const fileStorage = createMockFileStorage();
      const captionService = createMockCaptionService();
      const embeddingRepository = createMockEmbeddingRepository();
      const mockImage = createMockImage();
      const updateProgress = vi.fn().mockResolvedValue(undefined);

      // Wrong dimension embedding
      const wrongEmbedding = new Uint8Array(100);
      vi.mocked(imageRepository.findById).mockResolvedValue(mockImage);
      vi.mocked(imageRepository.findByIdWithEmbedding).mockResolvedValue({
        ...mockImage,
        embedding: wrongEmbedding,
      });
      vi.mocked(fileStorage.fileExists).mockResolvedValue(true);
      vi.mocked(fileStorage.readFile).mockResolvedValue(Buffer.from('image data'));
      vi.mocked(captionService.generateWithContextFromBuffer).mockResolvedValue({
        caption: 'Generated caption',
        model: 'test-model',
      });

      const handler = createCaptionJobHandler({
        imageRepository,
        fileStorage,
        captionService,
        embeddingRepository,
      });

      const job = createMockJob({ imageId: 'test-image-id' });
      const result = await handler(job, updateProgress);

      expect(result.usedContext).toBe(false);
      expect(embeddingRepository.findSimilar).not.toHaveBeenCalled();
    });

    it('should filter out similar images without descriptions', async () => {
      const imageRepository = createMockImageRepository();
      const fileStorage = createMockFileStorage();
      const captionService = createMockCaptionService();
      const embeddingRepository = createMockEmbeddingRepository();
      const mockImage = createMockImage();
      const updateProgress = vi.fn().mockResolvedValue(undefined);

      const embeddingArray = new Float32Array(EMBEDDING_DIMENSION);
      embeddingArray.fill(0.1);
      const embeddingBuffer = new Uint8Array(embeddingArray.buffer);

      vi.mocked(imageRepository.findById).mockResolvedValue(mockImage);
      vi.mocked(imageRepository.findByIdWithEmbedding).mockResolvedValue({
        ...mockImage,
        embedding: embeddingBuffer,
      });
      vi.mocked(embeddingRepository.findSimilar).mockReturnValue([
        { imageId: 'similar-1', distance: 0.1 },
        { imageId: 'similar-2', distance: 0.2 },
      ]);
      vi.mocked(imageRepository.findByIds).mockResolvedValue([
        createMockImage({ id: 'similar-1', description: null }),
        createMockImage({ id: 'similar-2', description: '  ' }),
      ]);
      vi.mocked(fileStorage.fileExists).mockResolvedValue(true);
      vi.mocked(fileStorage.readFile).mockResolvedValue(Buffer.from('image data'));
      vi.mocked(captionService.generateWithContextFromBuffer).mockResolvedValue({
        caption: 'Generated caption',
        model: 'test-model',
      });

      const handler = createCaptionJobHandler({
        imageRepository,
        fileStorage,
        captionService,
        embeddingRepository,
      });

      const job = createMockJob({ imageId: 'test-image-id' });
      const result = await handler(job, updateProgress);

      expect(result.usedContext).toBe(false);
    });

    it('should return empty when no similar images found', async () => {
      const imageRepository = createMockImageRepository();
      const fileStorage = createMockFileStorage();
      const captionService = createMockCaptionService();
      const embeddingRepository = createMockEmbeddingRepository();
      const mockImage = createMockImage();
      const updateProgress = vi.fn().mockResolvedValue(undefined);

      const embeddingArray = new Float32Array(EMBEDDING_DIMENSION);
      embeddingArray.fill(0.1);
      const embeddingBuffer = new Uint8Array(embeddingArray.buffer);

      vi.mocked(imageRepository.findById).mockResolvedValue(mockImage);
      vi.mocked(imageRepository.findByIdWithEmbedding).mockResolvedValue({
        ...mockImage,
        embedding: embeddingBuffer,
      });
      vi.mocked(embeddingRepository.findSimilar).mockReturnValue([]);
      vi.mocked(fileStorage.fileExists).mockResolvedValue(true);
      vi.mocked(fileStorage.readFile).mockResolvedValue(Buffer.from('image data'));
      vi.mocked(captionService.generateWithContextFromBuffer).mockResolvedValue({
        caption: 'Generated caption',
        model: 'test-model',
      });

      const handler = createCaptionJobHandler({
        imageRepository,
        fileStorage,
        captionService,
        embeddingRepository,
      });

      const job = createMockJob({ imageId: 'test-image-id' });
      const result = await handler(job, updateProgress);

      expect(result.usedContext).toBe(false);
    });
  });
});
