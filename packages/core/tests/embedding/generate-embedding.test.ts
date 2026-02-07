import 'reflect-metadata';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  generateEmbedding,
  generateMissingEmbeddings,
  removeEmbedding,
  syncEmbeddingsToVectorDb,
  type GenerateEmbeddingDeps,
} from '@/application/embedding/generate-embedding';
import { EMBEDDING_DIMENSION } from '@/application/ports/embedding-repository';
import type { EmbeddingRepository } from '@/application/ports/embedding-repository';
import type { EmbeddingService, EmbeddingResult } from '@/application/ports/embedding-service';
import type { FileStorage } from '@/application/ports/file-storage';
import type { ImageDetail, ImageRepository } from '@/application/ports/image-repository';

function createMockImage(overrides: Partial<ImageDetail> = {}): ImageDetail {
  return {
    id: 'test-image-id',
    path: 'originals/test-image.png',
    thumbnailPath: 'thumbnails/test-image.jpg',
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
    saveOriginalFromStream: vi.fn(),
    readFile: vi.fn(),
    readFileAsStream: vi.fn(),
    getFileSize: vi.fn(),
    fileExists: vi.fn(),
    deleteFile: vi.fn(),
    getAbsolutePath: vi.fn(),
  };

  const mockEmbeddingService: EmbeddingService = {
    generateFromFile: vi.fn(),
    generateFromBuffer: vi.fn(),
    generateFromText: vi.fn(),
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
    getAllImageIds: vi.fn().mockReturnValue([]),
    hasEmbedding: vi.fn(),
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
      vi.mocked(deps.fileStorage.readFile).mockResolvedValue(Buffer.from('fake image data'));
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

      // Verify readFile was called with the image path
      expect(deps.fileStorage.readFile).toHaveBeenCalledWith('originals/test-image.png');

      // Verify embedding was stored
      expect(deps.imageRepository.updateEmbedding).toHaveBeenCalledWith(
        'test-image-id',
        expect.objectContaining({

          embedding: expect.any(Buffer),

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
      vi.mocked(deps.fileStorage.readFile).mockRejectedValue(new Error('File not found'));

      const result = await generateEmbedding({ imageId: 'test-image-id' }, deps);

      expect(result).toBe('EMBEDDING_FAILED');
      expect(deps.embeddingRepository.upsert).not.toHaveBeenCalled();
    });

    it('should return EMBEDDING_FAILED when embedding service fails', async () => {
      const deps = createMockDeps();
      const mockImage = createMockImage();

      vi.mocked(deps.imageRepository.findById).mockResolvedValue(mockImage);
      vi.mocked(deps.fileStorage.readFile).mockResolvedValue(Buffer.from('fake image data'));
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
      getAllImageIds: vi.fn().mockReturnValue([]),
      hasEmbedding: vi.fn(),
      close: vi.fn(),
    };

    removeEmbedding('test-image-id', { embeddingRepository: mockEmbeddingRepository });

    expect(mockEmbeddingRepository.remove).toHaveBeenCalledWith('test-image-id');
  });
});

describe('generateMissingEmbeddings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate embeddings for images without embeddings', async () => {
    const deps = createMockDeps();
    const mockEmbeddingResult = createMockEmbeddingResult();

    vi.mocked(deps.imageRepository.findIdsWithoutEmbedding).mockResolvedValue([
      { id: 'img-1' },
      { id: 'img-2' },
    ]);
    vi.mocked(deps.imageRepository.findById)
      .mockResolvedValueOnce(createMockImage({ id: 'img-1' }))
      .mockResolvedValueOnce(createMockImage({ id: 'img-2' }));
    vi.mocked(deps.fileStorage.readFile).mockResolvedValue(Buffer.from('fake image data'));
    vi.mocked(deps.embeddingService.generateFromBuffer).mockResolvedValue(mockEmbeddingResult);

    const result = await generateMissingEmbeddings(deps);

    expect(result.total).toBe(2);
    expect(result.success).toBe(2);
    expect(result.failed).toBe(0);
    expect(result.errors).toEqual([]);
  });

  it('should report errors for failed embeddings', async () => {
    const deps = createMockDeps();

    vi.mocked(deps.imageRepository.findIdsWithoutEmbedding).mockResolvedValue([
      { id: 'img-1' },
    ]);
    vi.mocked(deps.imageRepository.findById).mockResolvedValue(null);

    const result = await generateMissingEmbeddings(deps);

    expect(result.total).toBe(1);
    expect(result.success).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.imageId).toBe('img-1');
    expect(result.errors[0]?.error).toBe('IMAGE_NOT_FOUND');
  });

  it('should call onProgress callback', async () => {
    const deps = createMockDeps();
    const mockEmbeddingResult = createMockEmbeddingResult();
    const onProgress = vi.fn();

    vi.mocked(deps.imageRepository.findIdsWithoutEmbedding).mockResolvedValue([
      { id: 'img-1' },
      { id: 'img-2' },
    ]);
    vi.mocked(deps.imageRepository.findById).mockResolvedValue(createMockImage());
    vi.mocked(deps.fileStorage.readFile).mockResolvedValue(Buffer.from('fake image data'));
    vi.mocked(deps.embeddingService.generateFromBuffer).mockResolvedValue(mockEmbeddingResult);

    await generateMissingEmbeddings(deps, { onProgress });

    expect(onProgress).toHaveBeenCalledTimes(2);
    expect(onProgress).toHaveBeenNthCalledWith(1, 1, 2);
    expect(onProgress).toHaveBeenNthCalledWith(2, 2, 2);
  });

  it('should return empty result when no images without embeddings', async () => {
    const deps = createMockDeps();
    vi.mocked(deps.imageRepository.findIdsWithoutEmbedding).mockResolvedValue([]);

    const result = await generateMissingEmbeddings(deps);

    expect(result.total).toBe(0);
    expect(result.success).toBe(0);
    expect(result.failed).toBe(0);
  });
});

describe('syncEmbeddingsToVectorDb', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should sync embeddings from Prisma to sqlite-vec', async () => {
    const deps = createMockDeps();
    const embedding = new Float32Array(EMBEDDING_DIMENSION).fill(0.1);
    const embeddingBuffer = Buffer.from(embedding.buffer);

    vi.mocked(deps.imageRepository.findWithEmbedding).mockResolvedValue([
      { id: 'img-1', path: 'originals/img-1.jpg', embedding: embeddingBuffer },
      { id: 'img-2', path: 'originals/img-2.jpg', embedding: embeddingBuffer },
    ]);

    const result = await syncEmbeddingsToVectorDb({
      imageRepository: deps.imageRepository,
      embeddingRepository: deps.embeddingRepository,
    });

    expect(result.synced).toBe(2);
    expect(result.skipped).toBe(0);
    expect(deps.embeddingRepository.upsert).toHaveBeenCalledTimes(2);
  });

  it('should skip images with null embeddings', async () => {
    const deps = createMockDeps();

    vi.mocked(deps.imageRepository.findWithEmbedding).mockResolvedValue([
      { id: 'img-1', path: 'originals/img-1.jpg', embedding: null },
    ]);

    const result = await syncEmbeddingsToVectorDb({
      imageRepository: deps.imageRepository,
      embeddingRepository: deps.embeddingRepository,
    });

    expect(result.synced).toBe(0);
    expect(result.skipped).toBe(1);
    expect(deps.embeddingRepository.upsert).not.toHaveBeenCalled();
  });

  it('should skip embeddings with wrong dimensions', async () => {
    const deps = createMockDeps();
    const wrongDimensionEmbedding = new Float32Array(256).fill(0.1);
    const embeddingBuffer = Buffer.from(wrongDimensionEmbedding.buffer);

    vi.mocked(deps.imageRepository.findWithEmbedding).mockResolvedValue([
      { id: 'img-1', path: 'originals/img-1.jpg', embedding: embeddingBuffer },
    ]);

    const result = await syncEmbeddingsToVectorDb({
      imageRepository: deps.imageRepository,
      embeddingRepository: deps.embeddingRepository,
    });

    expect(result.synced).toBe(0);
    expect(result.skipped).toBe(1);
    expect(deps.embeddingRepository.upsert).not.toHaveBeenCalled();
  });
});
