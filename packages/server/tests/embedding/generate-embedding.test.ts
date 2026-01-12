import 'reflect-metadata';
import { readFile } from 'node:fs/promises';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  generateEmbedding,
  removeEmbedding,
  type GenerateEmbeddingDeps,
} from '@/application/embedding/generate-embedding';
import type { EmbeddingRepository } from '@/application/ports/embedding-repository';
import type { EmbeddingService, EmbeddingResult } from '@/application/ports/embedding-service';
import type { FileStorage } from '@/application/ports/file-storage';
import type { Image, ImageRepository } from '@/application/ports/image-repository';

// Mock node:fs/promises
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
}));

function createMockImage(overrides: Partial<Image> = {}): Image {
  return {
    id: 'test-image-id',
    filename: 'test-image.png',
    path: 'originals/test-image.png',
    thumbnailPath: 'thumbnails/test-image.jpg',
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

function createMockEmbeddingResult(): EmbeddingResult {
  return {
    embedding: new Float32Array(512).fill(0.1),
    dimension: 512,
    model: 'openai/clip-vit-base-patch16',
  };
}

function createMockDeps(): GenerateEmbeddingDeps {
  const mockImageRepository: ImageRepository = {
    create: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    search: vi.fn(),
    updateById: vi.fn(),
    deleteById: vi.fn(),
    findIdsWithoutEmbedding: vi.fn(),
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

  const mockEmbeddingService: EmbeddingService = {
    generateFromFile: vi.fn(),
    generateFromBuffer: vi.fn(),
    getDimension: vi.fn().mockReturnValue(512),
    getModel: vi.fn().mockReturnValue('openai/clip-vit-base-patch16'),
    isReady: vi.fn().mockReturnValue(true),
    initialize: vi.fn(),
  };

  const mockEmbeddingRepository: EmbeddingRepository = {
    upsert: vi.fn(),
    remove: vi.fn(),
    findSimilar: vi.fn(),
    count: vi.fn(),
    close: vi.fn(),
  };

  return {
    imageRepository: mockImageRepository,
    fileStorage: mockFileStorage,
    embeddingService: mockEmbeddingService,
    embeddingRepository: mockEmbeddingRepository,
  };
}

describe('generateEmbedding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('success case', () => {
    it('should generate embedding and store it', async () => {
      const deps = createMockDeps();
      const mockImage = createMockImage();
      const mockEmbeddingResult = createMockEmbeddingResult();

      vi.mocked(deps.imageRepository.findById).mockResolvedValue(mockImage);
      vi.mocked(deps.fileStorage.getAbsolutePath).mockReturnValue('/absolute/path/test-image.png');
      vi.mocked(readFile).mockResolvedValue(Buffer.from('fake image data'));
      vi.mocked(deps.embeddingService.generateFromBuffer).mockResolvedValue(mockEmbeddingResult);

      const result = await generateEmbedding({ imageId: 'test-image-id' }, deps);

      expect(result).not.toBe('IMAGE_NOT_FOUND');
      expect(result).not.toBe('EMBEDDING_FAILED');
      expect(typeof result).toBe('object');

      if (typeof result === 'object') {
        expect(result.imageId).toBe('test-image-id');
        expect(result.dimension).toBe(512);
        expect(result.model).toBe('openai/clip-vit-base-patch16');
        expect(result.generatedAt).toBeInstanceOf(Date);
      }

      // Verify embedding was stored
      expect(deps.imageRepository.updateEmbedding).toHaveBeenCalledWith(
        'test-image-id',
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- expect.any returns any
          embedding: expect.any(Buffer),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- expect.any returns any
          embeddedAt: expect.any(Date),
        }),
      );
      expect(deps.embeddingRepository.upsert).toHaveBeenCalledWith(
        'test-image-id',
        mockEmbeddingResult.embedding,
      );
    });
  });

  describe('error cases', () => {
    it('should return IMAGE_NOT_FOUND when image does not exist', async () => {
      const deps = createMockDeps();
      vi.mocked(deps.imageRepository.findById).mockResolvedValue(null);

      const result = await generateEmbedding({ imageId: 'non-existent-id' }, deps);

      expect(result).toBe('IMAGE_NOT_FOUND');
      expect(deps.embeddingService.generateFromBuffer).not.toHaveBeenCalled();
      expect(deps.embeddingRepository.upsert).not.toHaveBeenCalled();
    });

    it('should return EMBEDDING_FAILED when file read fails', async () => {
      const deps = createMockDeps();
      const mockImage = createMockImage();

      vi.mocked(deps.imageRepository.findById).mockResolvedValue(mockImage);
      vi.mocked(deps.fileStorage.getAbsolutePath).mockReturnValue('/absolute/path/test-image.png');
      vi.mocked(readFile).mockRejectedValue(new Error('File not found'));

      const result = await generateEmbedding({ imageId: 'test-image-id' }, deps);

      expect(result).toBe('EMBEDDING_FAILED');
      expect(deps.embeddingRepository.upsert).not.toHaveBeenCalled();
    });

    it('should return EMBEDDING_FAILED when embedding service fails', async () => {
      const deps = createMockDeps();
      const mockImage = createMockImage();

      vi.mocked(deps.imageRepository.findById).mockResolvedValue(mockImage);
      vi.mocked(deps.fileStorage.getAbsolutePath).mockReturnValue('/absolute/path/test-image.png');
      vi.mocked(readFile).mockResolvedValue(Buffer.from('fake image data'));
      vi.mocked(deps.embeddingService.generateFromBuffer).mockRejectedValue(
        new Error('Model failed'),
      );

      const result = await generateEmbedding({ imageId: 'test-image-id' }, deps);

      expect(result).toBe('EMBEDDING_FAILED');
      expect(deps.embeddingRepository.upsert).not.toHaveBeenCalled();
    });
  });
});

describe('removeEmbedding', () => {
  it('should call embeddingRepository.remove', () => {
    const mockEmbeddingRepository: EmbeddingRepository = {
      upsert: vi.fn(),
      remove: vi.fn(),
      findSimilar: vi.fn(),
      count: vi.fn(),
      close: vi.fn(),
    };

    removeEmbedding('test-image-id', { embeddingRepository: mockEmbeddingRepository });

    expect(mockEmbeddingRepository.remove).toHaveBeenCalledWith('test-image-id');
  });
});
