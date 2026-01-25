import 'reflect-metadata';
import Fastify, { type FastifyInstance } from 'fastify';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { ImageSimilarityController } from '@/infra/http/controllers/image-similarity-controller';
import type { EmbeddingRepository } from '@/application/ports/embedding-repository';
import type { ImageRepository, ImageWithEmbedding } from '@/application/ports/image-repository';

interface ErrorResponse {
  error: string;
  message?: string;
}

interface DuplicatesResponse {
  groups: unknown[];
  totalGroups: number;
  totalDuplicates: number;
}

interface SimilarImage {
  id: string;
  distance: number;
}

interface SimilarImagesResponse {
  imageId: string;
  similarImages: SimilarImage[];
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

function createMockEmbeddingRepository(): EmbeddingRepository {
  return {
    upsert: vi.fn(),
    remove: vi.fn(),
    findSimilar: vi.fn().mockReturnValue([]),
    count: vi.fn(),
    getAllImageIds: vi.fn().mockReturnValue([]),
    close: vi.fn(),
  };
}

function createNormalizedEmbedding(): Uint8Array {
  const values: number[] = new Array<number>(512).fill(0);
  values[0] = 1;
  let norm = 0;
  for (const v of values) {
    norm += v * v;
  }
  norm = Math.sqrt(norm);
  const normalized = values.map(v => v / norm);
  const float32 = new Float32Array(normalized);
  return new Uint8Array(float32.buffer);
}

describe('ImageSimilarityController', () => {
  let app: FastifyInstance;
  let mockImageRepository: ImageRepository;
  let mockEmbeddingRepository: EmbeddingRepository;
  let controller: ImageSimilarityController;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockImageRepository = createMockImageRepository();
    mockEmbeddingRepository = createMockEmbeddingRepository();

    // Create controller with mocked dependencies
    controller = new ImageSimilarityController(
      mockImageRepository,
      mockEmbeddingRepository,
    );

    // Create Fastify app and register routes
    app = Fastify({ logger: false });
    controller.registerRoutes(app);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /api/images/duplicates', () => {
    it('should return empty groups when no images exist', async () => {
      vi.mocked(mockEmbeddingRepository.getAllImageIds).mockReturnValue([]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/images/duplicates',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as DuplicatesResponse;
      expect(body.groups).toHaveLength(0);
      expect(body.totalGroups).toBe(0);
      expect(body.totalDuplicates).toBe(0);
    });

    it('should use custom threshold when provided', async () => {
      vi.mocked(mockEmbeddingRepository.getAllImageIds).mockReturnValue([]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/images/duplicates?threshold=0.2',
      });

      expect(response.statusCode).toBe(200);
    });

    it('should return 400 for invalid threshold (greater than 1)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/images/duplicates?threshold=1.5',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
    });

    it('should return 400 for invalid threshold (zero)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/images/duplicates?threshold=0',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
    });

    it('should return 400 for invalid threshold (negative)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/images/duplicates?threshold=-0.5',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
    });
  });

  describe('GET /api/images/:id/similar', () => {
    it('should return 404 when image not found', async () => {
      vi.mocked(mockImageRepository.findByIdWithEmbedding).mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: '/api/images/non-existent-id/similar',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Not Found');
    });

    it('should return 400 when image has no embedding', async () => {
      const imageWithoutEmbedding: ImageWithEmbedding = {
        id: 'test-id',
        path: 'originals/test.png',
        embedding: null,
      };
      vi.mocked(mockImageRepository.findByIdWithEmbedding).mockResolvedValue(imageWithoutEmbedding);

      const response = await app.inject({
        method: 'GET',
        url: '/api/images/test-id/similar',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toContain('embedding');
    });

    it('should return similar images successfully', async () => {
      const embedding = createNormalizedEmbedding();
      const imageWithEmbedding: ImageWithEmbedding = {
        id: 'test-id',
        path: 'originals/test.png',
        embedding,
      };
      vi.mocked(mockImageRepository.findByIdWithEmbedding).mockResolvedValue(imageWithEmbedding);
      vi.mocked(mockEmbeddingRepository.findSimilar).mockReturnValue([
        { imageId: 'similar-1', distance: 0.1 },
        { imageId: 'similar-2', distance: 0.2 },
      ]);
      vi.mocked(mockImageRepository.findById)
        .mockResolvedValueOnce({
          id: 'similar-1',
          path: 'originals/similar-1.png',
          thumbnailPath: 'thumbnails/similar-1.jpg',
          mimeType: 'image/png',
          size: 1024,
          width: 100,
          height: 100,
          title: 'Similar 1',
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .mockResolvedValueOnce({
          id: 'similar-2',
          path: 'originals/similar-2.png',
          thumbnailPath: 'thumbnails/similar-2.jpg',
          mimeType: 'image/png',
          size: 1024,
          width: 100,
          height: 100,
          title: 'Similar 2',
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      const response = await app.inject({
        method: 'GET',
        url: '/api/images/test-id/similar',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as SimilarImagesResponse;
      expect(body.imageId).toBe('test-id');
      expect(body.similarImages).toHaveLength(2);
      expect(body.similarImages[0]?.id).toBe('similar-1');
      expect(body.similarImages[0]?.distance).toBe(0.1);
    });

    it('should use custom limit when provided', async () => {
      const embedding = createNormalizedEmbedding();
      const imageWithEmbedding: ImageWithEmbedding = {
        id: 'test-id',
        path: 'originals/test.png',
        embedding,
      };
      vi.mocked(mockImageRepository.findByIdWithEmbedding).mockResolvedValue(imageWithEmbedding);
      vi.mocked(mockEmbeddingRepository.findSimilar).mockReturnValue([]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/images/test-id/similar?limit=5',
      });

      expect(response.statusCode).toBe(200);
      expect(mockEmbeddingRepository.findSimilar).toHaveBeenCalledWith(
        expect.any(Float32Array),
        5,
        ['test-id'],
      );
    });

    it('should return 400 for invalid limit (zero)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/images/test-id/similar?limit=0',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
    });

    it('should return 400 for invalid limit (greater than max)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/images/test-id/similar?limit=101',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
    });

    it('should filter out deleted images from results', async () => {
      const embedding = createNormalizedEmbedding();
      const imageWithEmbedding: ImageWithEmbedding = {
        id: 'test-id',
        path: 'originals/test.png',
        embedding,
      };
      vi.mocked(mockImageRepository.findByIdWithEmbedding).mockResolvedValue(imageWithEmbedding);
      vi.mocked(mockEmbeddingRepository.findSimilar).mockReturnValue([
        { imageId: 'existing', distance: 0.1 },
        { imageId: 'deleted', distance: 0.2 },
      ]);
      vi.mocked(mockImageRepository.findById)
        .mockResolvedValueOnce({
          id: 'existing',
          path: 'originals/existing.png',
          thumbnailPath: 'thumbnails/existing.jpg',
          mimeType: 'image/png',
          size: 1024,
          width: 100,
          height: 100,
          title: 'Existing',
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .mockResolvedValueOnce(null); // deleted image

      const response = await app.inject({
        method: 'GET',
        url: '/api/images/test-id/similar',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as SimilarImagesResponse;
      expect(body.similarImages).toHaveLength(1);
      expect(body.similarImages[0]?.id).toBe('existing');
    });
  });
});
