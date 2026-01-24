import { describe, expect, it, vi } from 'vitest';
import { deleteImage } from '@/application/image/delete-image.js';
import type { EmbeddingRepository } from '@/application/ports/embedding-repository.js';
import type { FileStorage } from '@/application/ports/file-storage.js';
import type { ImageRepository } from '@/application/ports/image-repository.js';

const mockImage = {
  id: 'image-1',
  path: 'images/test.jpg',
  title: 'Test Image',
  description: null,
  sourceUrl: null,
  thumbnailPath: 'thumbnails/test.jpg',
  createdAt: new Date(),
  updatedAt: new Date(),
  embeddedAt: null,
};

function createMockImageRepository(
  overrides: Partial<ImageRepository> = {},
): ImageRepository {
  return {
    create: vi.fn(),
    findById: vi.fn().mockResolvedValue(mockImage),
    findByIds: vi.fn().mockResolvedValue([]),
    findAll: vi.fn().mockResolvedValue([]),
    findAllPaginated: vi.fn(),
    search: vi.fn().mockResolvedValue([]),
    searchPaginated: vi.fn(),
    updateById: vi.fn(),
    deleteById: vi.fn().mockResolvedValue(mockImage),
    findIdsWithoutEmbedding: vi.fn().mockResolvedValue([]),
    findByIdWithEmbedding: vi.fn().mockResolvedValue(null),
    findWithEmbedding: vi.fn().mockResolvedValue([]),
    updateEmbedding: vi.fn(),
    clearAllEmbeddings: vi.fn(),
    count: vi.fn().mockResolvedValue(0),
    countWithEmbedding: vi.fn().mockResolvedValue(0),
    ...overrides,
  };
}

function createMockFileStorage(
  overrides: Partial<FileStorage> = {},
): FileStorage {
  return {
    saveOriginalFromStream: vi.fn(),
    deleteFile: vi.fn().mockResolvedValue(undefined),
    getAbsolutePath: vi.fn(path => `/absolute/${path}`),
    ...overrides,
  };
}

function createMockEmbeddingRepository(
  overrides: Partial<EmbeddingRepository> = {},
): EmbeddingRepository {
  return {
    upsert: vi.fn(),
    remove: vi.fn(),
    findSimilar: vi.fn().mockReturnValue([]),
    count: vi.fn().mockReturnValue(0),
    getAllImageIds: vi.fn().mockReturnValue([]),
    close: vi.fn(),
    ...overrides,
  };
}

describe('deleteImage', () => {
  it('should delete image successfully', async () => {
    const imageRepository = createMockImageRepository();
    const fileStorage = createMockFileStorage();
    const embeddingRepository = createMockEmbeddingRepository();

    const result = await deleteImage('image-1', {
      imageRepository,
      fileStorage,
      embeddingRepository,
    });

    expect(result).toEqual({ success: true });
    expect(fileStorage.deleteFile).toHaveBeenCalledWith('images/test.jpg');
    expect(fileStorage.deleteFile).toHaveBeenCalledWith('thumbnails/test.jpg');
    expect(imageRepository.deleteById).toHaveBeenCalledWith('image-1');
  });

  it('should return NOT_FOUND error if image does not exist', async () => {
    const imageRepository = createMockImageRepository({
      findById: vi.fn().mockResolvedValue(null),
    });
    const fileStorage = createMockFileStorage();
    const embeddingRepository = createMockEmbeddingRepository();

    const result = await deleteImage('nonexistent', {
      imageRepository,
      fileStorage,
      embeddingRepository,
    });

    expect(result).toEqual({ success: false, error: 'NOT_FOUND' });
    expect(fileStorage.deleteFile).not.toHaveBeenCalled();
    expect(imageRepository.deleteById).not.toHaveBeenCalled();
  });

  it('should succeed even if file deletion fails', async () => {
    const imageRepository = createMockImageRepository();
    const fileStorage = createMockFileStorage({
      deleteFile: vi.fn().mockRejectedValue(new Error('File not found')),
    });
    const embeddingRepository = createMockEmbeddingRepository();

    const result = await deleteImage('image-1', {
      imageRepository,
      fileStorage,
      embeddingRepository,
    });

    expect(result).toEqual({ success: true });
    expect(imageRepository.deleteById).toHaveBeenCalledWith('image-1');
  });

  it('should not delete thumbnail if image has no thumbnail', async () => {
    const imageWithoutThumbnail = { ...mockImage, thumbnailPath: null };
    const imageRepository = createMockImageRepository({
      findById: vi.fn().mockResolvedValue(imageWithoutThumbnail),
    });
    const fileStorage = createMockFileStorage();
    const embeddingRepository = createMockEmbeddingRepository();

    await deleteImage('image-1', {
      imageRepository,
      fileStorage,
      embeddingRepository,
    });

    expect(fileStorage.deleteFile).toHaveBeenCalledTimes(1);
    expect(fileStorage.deleteFile).toHaveBeenCalledWith('images/test.jpg');
  });

  it('should succeed even if embedding removal fails', async () => {
    const imageRepository = createMockImageRepository();
    const fileStorage = createMockFileStorage();
    const embeddingRepository = createMockEmbeddingRepository({
      remove: vi.fn(() => {
        throw new Error('Embedding error');
      }),
    });

    const result = await deleteImage('image-1', {
      imageRepository,
      fileStorage,
      embeddingRepository,
    });

    expect(result).toEqual({ success: true });
  });
});
