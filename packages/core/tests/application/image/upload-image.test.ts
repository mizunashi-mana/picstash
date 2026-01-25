import 'reflect-metadata';
import { stat } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { generateEmbedding } from '@/application/embedding/generate-embedding';
import {
  uploadImage,
  type UploadImageDeps,
  type UploadImageInput,
} from '@/application/image/upload-image';
import type { EmbeddingRepository } from '@/application/ports/embedding-repository';
import type { EmbeddingService } from '@/application/ports/embedding-service';
import type { FileStorage } from '@/application/ports/file-storage';
import type { ImageProcessor } from '@/application/ports/image-processor';
import type { Image, ImageRepository } from '@/application/ports/image-repository';

vi.mock('node:fs/promises', () => ({
  stat: vi.fn(),
}));

vi.mock('@/application/embedding/generate-embedding', () => ({
  generateEmbedding: vi.fn().mockResolvedValue({ imageId: 'test-id', success: true }),
}));

function createMockStats(size: number): Awaited<ReturnType<typeof stat>> {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- stat returns Stats or BigIntStats, we only use size property
  return { size } as Awaited<ReturnType<typeof stat>>;
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

function createMockEmbeddingService(): EmbeddingService {
  return {
    generateFromFile: vi.fn(),
    generateFromBuffer: vi.fn(),
    generateFromText: vi.fn(),
    getDimension: vi.fn().mockReturnValue(512),
    getModel: vi.fn().mockReturnValue('openai/clip-vit-base-patch16'),
    isReady: vi.fn().mockReturnValue(true),
    initialize: vi.fn(),
  };
}

function createMockEmbeddingRepository(): EmbeddingRepository {
  return {
    upsert: vi.fn(),
    remove: vi.fn(),
    findSimilar: vi.fn(),
    count: vi.fn(),
    getAllImageIds: vi.fn().mockReturnValue([]),
    close: vi.fn(),
  };
}

function createMockDeps(): UploadImageDeps {
  return {
    imageRepository: createMockImageRepository(),
    fileStorage: createMockFileStorage(),
    imageProcessor: createMockImageProcessor(),
    embeddingService: createMockEmbeddingService(),
    embeddingRepository: createMockEmbeddingRepository(),
  };
}

function createMockImage(overrides: Partial<Image> = {}): Image {
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

function createMockInput(overrides: Partial<UploadImageInput> = {}): UploadImageInput {
  return {
    filename: 'test-image.png',
    mimetype: 'image/png',
    stream: Readable.from(Buffer.from('fake image data')),
    ...overrides,
  };
}

describe('uploadImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('success cases', () => {
    it('should upload image successfully with filename extension', async () => {
      const deps = createMockDeps();
      const input = createMockInput();
      const mockImage = createMockImage();

      vi.mocked(deps.fileStorage.saveOriginalFromStream).mockResolvedValue({
        path: 'originals/test-image.png',
        filename: 'test-image.png',
      });
      vi.mocked(deps.fileStorage.getAbsolutePath).mockReturnValue('/absolute/path/test-image.png');
      vi.mocked(stat).mockResolvedValue(createMockStats(1000));
      vi.mocked(deps.imageProcessor.getMetadata).mockResolvedValue({ width: 100, height: 100 });
      vi.mocked(deps.imageProcessor.generateThumbnail).mockResolvedValue({
        path: 'thumbnails/test-image.jpg',
        filename: 'test-image.jpg',
      });
      vi.mocked(deps.imageRepository.create).mockResolvedValue(mockImage);
      vi.mocked(deps.imageRepository.findById).mockResolvedValue(mockImage);

      const result = await uploadImage(input, deps);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.image).toEqual(mockImage);
      }
      expect(deps.fileStorage.saveOriginalFromStream).toHaveBeenCalledWith(
        input.stream,
        '.png',
      );
      expect(deps.imageProcessor.getMetadata).toHaveBeenCalledWith('/absolute/path/test-image.png');
      expect(deps.imageProcessor.generateThumbnail).toHaveBeenCalledWith(
        '/absolute/path/test-image.png',
        'test-image.png',
      );
      expect(deps.imageRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          path: 'originals/test-image.png',
          thumbnailPath: 'thumbnails/test-image.jpg',
          mimeType: 'image/png',
          size: 1000,
          width: 100,
          height: 100,
        }),
      );
    });

    it('should use MIME type extension when filename has no extension (PNG)', async () => {
      const deps = createMockDeps();
      const input = createMockInput({ filename: 'test-image' });
      const mockImage = createMockImage();

      vi.mocked(deps.fileStorage.saveOriginalFromStream).mockResolvedValue({
        path: 'originals/test-image.png',
        filename: 'test-image.png',
      });
      vi.mocked(deps.fileStorage.getAbsolutePath).mockReturnValue('/absolute/path/test-image.png');
      vi.mocked(stat).mockResolvedValue(createMockStats(1000));
      vi.mocked(deps.imageProcessor.getMetadata).mockResolvedValue({ width: 100, height: 100 });
      vi.mocked(deps.imageProcessor.generateThumbnail).mockResolvedValue({
        path: 'thumbnails/test-image.jpg',
        filename: 'test-image.jpg',
      });
      vi.mocked(deps.imageRepository.create).mockResolvedValue(mockImage);
      vi.mocked(deps.imageRepository.findById).mockResolvedValue(mockImage);

      const result = await uploadImage(input, deps);

      expect(result.success).toBe(true);
      expect(deps.fileStorage.saveOriginalFromStream).toHaveBeenCalledWith(
        input.stream,
        '.png',
      );
    });

    it('should use .jpg extension for JPEG MIME type when filename has no extension', async () => {
      const deps = createMockDeps();
      const input = createMockInput({ filename: 'test-image', mimetype: 'image/jpeg' });
      const mockImage = createMockImage({ mimeType: 'image/jpeg' });

      vi.mocked(deps.fileStorage.saveOriginalFromStream).mockResolvedValue({
        path: 'originals/test-image.jpg',
        filename: 'test-image.jpg',
      });
      vi.mocked(deps.fileStorage.getAbsolutePath).mockReturnValue('/absolute/path/test-image.jpg');
      vi.mocked(stat).mockResolvedValue(createMockStats(1000));
      vi.mocked(deps.imageProcessor.getMetadata).mockResolvedValue({ width: 100, height: 100 });
      vi.mocked(deps.imageProcessor.generateThumbnail).mockResolvedValue({
        path: 'thumbnails/test-image.jpg',
        filename: 'test-image.jpg',
      });
      vi.mocked(deps.imageRepository.create).mockResolvedValue(mockImage);
      vi.mocked(deps.imageRepository.findById).mockResolvedValue(mockImage);

      const result = await uploadImage(input, deps);

      expect(result.success).toBe(true);
      expect(deps.fileStorage.saveOriginalFromStream).toHaveBeenCalledWith(
        input.stream,
        '.jpg',
      );
    });

    it('should upload JPEG image successfully', async () => {
      const deps = createMockDeps();
      const input = createMockInput({
        filename: 'photo.jpg',
        mimetype: 'image/jpeg',
      });
      const mockImage = createMockImage({ mimeType: 'image/jpeg' });

      vi.mocked(deps.fileStorage.saveOriginalFromStream).mockResolvedValue({
        path: 'originals/photo.jpg',
        filename: 'photo.jpg',
      });
      vi.mocked(deps.fileStorage.getAbsolutePath).mockReturnValue('/absolute/path/photo.jpg');
      vi.mocked(stat).mockResolvedValue(createMockStats(2000));
      vi.mocked(deps.imageProcessor.getMetadata).mockResolvedValue({ width: 200, height: 150 });
      vi.mocked(deps.imageProcessor.generateThumbnail).mockResolvedValue({
        path: 'thumbnails/photo.jpg',
        filename: 'photo.jpg',
      });
      vi.mocked(deps.imageRepository.create).mockResolvedValue(mockImage);
      vi.mocked(deps.imageRepository.findById).mockResolvedValue(mockImage);

      const result = await uploadImage(input, deps);

      expect(result.success).toBe(true);
      expect(deps.fileStorage.saveOriginalFromStream).toHaveBeenCalledWith(
        input.stream,
        '.jpg',
      );
    });

    it('should trigger background embedding generation after successful upload', async () => {
      const deps = createMockDeps();
      const input = createMockInput();
      const mockImage = createMockImage({ id: 'generated-image-id' });

      vi.mocked(deps.fileStorage.saveOriginalFromStream).mockResolvedValue({
        path: 'originals/test-image.png',
        filename: 'test-image.png',
      });
      vi.mocked(deps.fileStorage.getAbsolutePath).mockReturnValue('/absolute/path/test-image.png');
      vi.mocked(stat).mockResolvedValue(createMockStats(1000));
      vi.mocked(deps.imageProcessor.getMetadata).mockResolvedValue({ width: 100, height: 100 });
      vi.mocked(deps.imageProcessor.generateThumbnail).mockResolvedValue({
        path: 'thumbnails/test-image.jpg',
        filename: 'test-image.jpg',
      });
      vi.mocked(deps.imageRepository.create).mockResolvedValue(mockImage);
      vi.mocked(deps.imageRepository.findById).mockResolvedValue(mockImage);

      const result = await uploadImage(input, deps);

      expect(result.success).toBe(true);
      // Verify generateEmbedding was called with the created image ID
      expect(generateEmbedding).toHaveBeenCalledWith(
        { imageId: 'generated-image-id' },
        expect.objectContaining({
          imageRepository: deps.imageRepository,
          embeddingService: deps.embeddingService,
          embeddingRepository: deps.embeddingRepository,
        }),
      );
    });
  });

  describe('error cases', () => {
    it('should return INVALID_MIME_TYPE for unsupported file type', async () => {
      const deps = createMockDeps();
      const input = createMockInput({
        filename: 'document.pdf',
        mimetype: 'application/pdf',
      });

      const result = await uploadImage(input, deps);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('INVALID_MIME_TYPE');
        expect(result.message).toContain('Invalid file type');
        expect(result.message).toContain('application/pdf');
      }
      expect(deps.fileStorage.saveOriginalFromStream).not.toHaveBeenCalled();
    });

    it('should return INVALID_MIME_TYPE for text/plain', async () => {
      const deps = createMockDeps();
      const input = createMockInput({
        filename: 'readme.txt',
        mimetype: 'text/plain',
      });

      const result = await uploadImage(input, deps);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('INVALID_MIME_TYPE');
      }
    });

    it('should clean up file when metadata extraction fails', async () => {
      const deps = createMockDeps();
      const input = createMockInput();

      vi.mocked(deps.fileStorage.saveOriginalFromStream).mockResolvedValue({
        path: 'originals/test-image.png',
        filename: 'test-image.png',
      });
      vi.mocked(deps.fileStorage.getAbsolutePath).mockReturnValue('/absolute/path/test-image.png');
      vi.mocked(stat).mockResolvedValue(createMockStats(1000));
      vi.mocked(deps.imageProcessor.getMetadata).mockRejectedValue(new Error('Corrupt image'));
      vi.mocked(deps.fileStorage.deleteFile).mockResolvedValue();

      await expect(uploadImage(input, deps)).rejects.toThrow('Corrupt image');
      expect(deps.fileStorage.deleteFile).toHaveBeenCalledWith('originals/test-image.png');
    });

    it('should clean up file when thumbnail generation fails', async () => {
      const deps = createMockDeps();
      const input = createMockInput();

      vi.mocked(deps.fileStorage.saveOriginalFromStream).mockResolvedValue({
        path: 'originals/test-image.png',
        filename: 'test-image.png',
      });
      vi.mocked(deps.fileStorage.getAbsolutePath).mockReturnValue('/absolute/path/test-image.png');
      vi.mocked(stat).mockResolvedValue(createMockStats(1000));
      vi.mocked(deps.imageProcessor.getMetadata).mockResolvedValue({ width: 100, height: 100 });
      vi.mocked(deps.imageProcessor.generateThumbnail).mockRejectedValue(new Error('Thumbnail failed'));
      vi.mocked(deps.fileStorage.deleteFile).mockResolvedValue();

      await expect(uploadImage(input, deps)).rejects.toThrow('Thumbnail failed');
      expect(deps.fileStorage.deleteFile).toHaveBeenCalledWith('originals/test-image.png');
    });

    it('should continue even if cleanup fails', async () => {
      const deps = createMockDeps();
      const input = createMockInput();

      vi.mocked(deps.fileStorage.saveOriginalFromStream).mockResolvedValue({
        path: 'originals/test-image.png',
        filename: 'test-image.png',
      });
      vi.mocked(deps.fileStorage.getAbsolutePath).mockReturnValue('/absolute/path/test-image.png');
      vi.mocked(stat).mockResolvedValue(createMockStats(1000));
      vi.mocked(deps.imageProcessor.getMetadata).mockRejectedValue(new Error('Corrupt image'));
      vi.mocked(deps.fileStorage.deleteFile).mockRejectedValue(new Error('Cleanup failed'));

      await expect(uploadImage(input, deps)).rejects.toThrow('Corrupt image');
    });
  });

  describe('embedding generation', () => {
    it('should trigger background embedding generation after successful upload', async () => {
      const deps = createMockDeps();
      const input = createMockInput();
      const mockImage = createMockImage();

      vi.mocked(deps.fileStorage.saveOriginalFromStream).mockResolvedValue({
        path: 'originals/test-image.png',
        filename: 'test-image.png',
      });
      vi.mocked(deps.fileStorage.getAbsolutePath).mockReturnValue('/absolute/path/test-image.png');
      vi.mocked(stat).mockResolvedValue(createMockStats(1000));
      vi.mocked(deps.imageProcessor.getMetadata).mockResolvedValue({ width: 100, height: 100 });
      vi.mocked(deps.imageProcessor.generateThumbnail).mockResolvedValue({
        path: 'thumbnails/test-image.jpg',
        filename: 'test-image.jpg',
      });
      vi.mocked(deps.imageRepository.create).mockResolvedValue(mockImage);
      vi.mocked(deps.imageRepository.findById).mockResolvedValue(mockImage);

      const result = await uploadImage(input, deps);

      expect(result.success).toBe(true);
    });
  });
});
