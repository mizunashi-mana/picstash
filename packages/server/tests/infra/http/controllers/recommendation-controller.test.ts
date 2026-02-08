import 'reflect-metadata';
import { generateRecommendations } from '@picstash/core';
import Fastify, { type FastifyInstance } from 'fastify';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { RecommendationController } from '@/infra/http/controllers/recommendation-controller';
import type {
  EmbeddingRepository,
  ImageRepository,
  ViewHistoryRepository,
  RecommendationsResult,
} from '@picstash/core';

// Mock the generateRecommendations function
vi.mock('@picstash/core', async (importOriginal) => {
  const original = await importOriginal<object>();
  return {
    ...original,
    generateRecommendations: vi.fn(),
  };
});

interface ErrorResponse {
  error: string;
  message?: string;
}

function createMockViewHistoryRepository(): ViewHistoryRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    updateDuration: vi.fn(),
    findRecentWithImages: vi.fn(),
    getImageStats: vi.fn(),
    deleteById: vi.fn(),
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

function createMockEmbeddingRepository(): EmbeddingRepository {
  return {
    upsert: vi.fn(),
    remove: vi.fn(),
    findSimilar: vi.fn().mockReturnValue([]),
    count: vi.fn(),
    getAllImageIds: vi.fn().mockReturnValue([]),
    hasEmbedding: vi.fn().mockReturnValue(false),
    close: vi.fn(),
  };
}

describe('RecommendationController', () => {
  let app: FastifyInstance;
  let mockViewHistoryRepository: ViewHistoryRepository;
  let mockImageRepository: ImageRepository;
  let mockEmbeddingRepository: EmbeddingRepository;
  let controller: RecommendationController;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockViewHistoryRepository = createMockViewHistoryRepository();
    mockImageRepository = createMockImageRepository();
    mockEmbeddingRepository = createMockEmbeddingRepository();

    // Create controller with mocked dependencies
    controller = new RecommendationController(
      mockViewHistoryRepository,
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

  describe('GET /api/recommendations', () => {
    it('should return recommendations successfully with default parameters', async () => {
      const mockResult: RecommendationsResult = {
        recommendations: [
          { id: 'img-1', title: 'Image 1', thumbnailPath: 'thumbnails/img-1.jpg', score: 0.9 },
          { id: 'img-2', title: 'Image 2', thumbnailPath: 'thumbnails/img-2.jpg', score: 0.8 },
        ],
      };
      vi.mocked(generateRecommendations).mockResolvedValue(mockResult);

      const response = await app.inject({
        method: 'GET',
        url: '/api/recommendations',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as RecommendationsResult;
      expect(body.recommendations).toHaveLength(2);
      expect(body.recommendations[0]?.id).toBe('img-1');
      expect(body.recommendations[0]?.score).toBe(0.9);
      expect(generateRecommendations).toHaveBeenCalledWith(
        mockViewHistoryRepository,
        mockImageRepository,
        mockEmbeddingRepository,
        { limit: undefined, historyDays: undefined },
      );
    });

    it('should return recommendations with custom limit', async () => {
      const mockResult: RecommendationsResult = {
        recommendations: [
          { id: 'img-1', title: 'Image 1', thumbnailPath: 'thumbnails/img-1.jpg', score: 0.9 },
        ],
      };
      vi.mocked(generateRecommendations).mockResolvedValue(mockResult);

      const response = await app.inject({
        method: 'GET',
        url: '/api/recommendations?limit=5',
      });

      expect(response.statusCode).toBe(200);
      expect(generateRecommendations).toHaveBeenCalledWith(
        mockViewHistoryRepository,
        mockImageRepository,
        mockEmbeddingRepository,
        { limit: 5, historyDays: undefined },
      );
    });

    it('should return recommendations with custom historyDays', async () => {
      const mockResult: RecommendationsResult = {
        recommendations: [],
      };
      vi.mocked(generateRecommendations).mockResolvedValue(mockResult);

      const response = await app.inject({
        method: 'GET',
        url: '/api/recommendations?historyDays=7',
      });

      expect(response.statusCode).toBe(200);
      expect(generateRecommendations).toHaveBeenCalledWith(
        mockViewHistoryRepository,
        mockImageRepository,
        mockEmbeddingRepository,
        { limit: undefined, historyDays: 7 },
      );
    });

    it('should return recommendations with both limit and historyDays', async () => {
      const mockResult: RecommendationsResult = {
        recommendations: [],
      };
      vi.mocked(generateRecommendations).mockResolvedValue(mockResult);

      const response = await app.inject({
        method: 'GET',
        url: '/api/recommendations?limit=20&historyDays=14',
      });

      expect(response.statusCode).toBe(200);
      expect(generateRecommendations).toHaveBeenCalledWith(
        mockViewHistoryRepository,
        mockImageRepository,
        mockEmbeddingRepository,
        { limit: 20, historyDays: 14 },
      );
    });

    it('should return empty recommendations with reason when no history', async () => {
      const mockResult: RecommendationsResult = {
        recommendations: [],
        reason: 'no_history',
      };
      vi.mocked(generateRecommendations).mockResolvedValue(mockResult);

      const response = await app.inject({
        method: 'GET',
        url: '/api/recommendations',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as RecommendationsResult;
      expect(body.recommendations).toHaveLength(0);
      expect(body.reason).toBe('no_history');
    });

    it('should return empty recommendations with reason when no embeddings', async () => {
      const mockResult: RecommendationsResult = {
        recommendations: [],
        reason: 'no_embeddings',
      };
      vi.mocked(generateRecommendations).mockResolvedValue(mockResult);

      const response = await app.inject({
        method: 'GET',
        url: '/api/recommendations',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as RecommendationsResult;
      expect(body.recommendations).toHaveLength(0);
      expect(body.reason).toBe('no_embeddings');
    });

    it('should return empty recommendations with reason when no similar images', async () => {
      const mockResult: RecommendationsResult = {
        recommendations: [],
        reason: 'no_similar',
      };
      vi.mocked(generateRecommendations).mockResolvedValue(mockResult);

      const response = await app.inject({
        method: 'GET',
        url: '/api/recommendations',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as RecommendationsResult;
      expect(body.recommendations).toHaveLength(0);
      expect(body.reason).toBe('no_similar');
    });

    it('should return 400 for invalid limit (zero)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/recommendations?limit=0',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toContain('Limit must be a positive number');
    });

    it('should return 400 for invalid limit (negative)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/recommendations?limit=-5',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toContain('Limit must be a positive number');
    });

    it('should return 400 for invalid limit (greater than 100)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/recommendations?limit=101',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toContain('Limit must be a positive number not greater than 100');
    });

    it('should return 400 for invalid limit (non-numeric)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/recommendations?limit=abc',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toContain('Limit must be a positive number');
    });

    it('should return 400 for invalid historyDays (zero)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/recommendations?historyDays=0',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toContain('History days must be a positive number');
    });

    it('should return 400 for invalid historyDays (negative)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/recommendations?historyDays=-7',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toContain('History days must be a positive number');
    });

    it('should return 400 for invalid historyDays (non-numeric)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/recommendations?historyDays=abc',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toContain('History days must be a positive number');
    });

    it('should handle empty string query parameters as undefined', async () => {
      const mockResult: RecommendationsResult = {
        recommendations: [],
      };
      vi.mocked(generateRecommendations).mockResolvedValue(mockResult);

      const response = await app.inject({
        method: 'GET',
        url: '/api/recommendations?limit=&historyDays=',
      });

      expect(response.statusCode).toBe(200);
      expect(generateRecommendations).toHaveBeenCalledWith(
        mockViewHistoryRepository,
        mockImageRepository,
        mockEmbeddingRepository,
        { limit: undefined, historyDays: undefined },
      );
    });

    it('should handle maximum valid limit (100)', async () => {
      const mockResult: RecommendationsResult = {
        recommendations: [],
      };
      vi.mocked(generateRecommendations).mockResolvedValue(mockResult);

      const response = await app.inject({
        method: 'GET',
        url: '/api/recommendations?limit=100',
      });

      expect(response.statusCode).toBe(200);
      expect(generateRecommendations).toHaveBeenCalledWith(
        mockViewHistoryRepository,
        mockImageRepository,
        mockEmbeddingRepository,
        { limit: 100, historyDays: undefined },
      );
    });

    it('should handle minimum valid limit (1)', async () => {
      const mockResult: RecommendationsResult = {
        recommendations: [],
      };
      vi.mocked(generateRecommendations).mockResolvedValue(mockResult);

      const response = await app.inject({
        method: 'GET',
        url: '/api/recommendations?limit=1',
      });

      expect(response.statusCode).toBe(200);
      expect(generateRecommendations).toHaveBeenCalledWith(
        mockViewHistoryRepository,
        mockImageRepository,
        mockEmbeddingRepository,
        { limit: 1, historyDays: undefined },
      );
    });

    it('should handle minimum valid historyDays (1)', async () => {
      const mockResult: RecommendationsResult = {
        recommendations: [],
      };
      vi.mocked(generateRecommendations).mockResolvedValue(mockResult);

      const response = await app.inject({
        method: 'GET',
        url: '/api/recommendations?historyDays=1',
      });

      expect(response.statusCode).toBe(200);
      expect(generateRecommendations).toHaveBeenCalledWith(
        mockViewHistoryRepository,
        mockImageRepository,
        mockEmbeddingRepository,
        { limit: undefined, historyDays: 1 },
      );
    });

    it('should handle large historyDays value', async () => {
      const mockResult: RecommendationsResult = {
        recommendations: [],
      };
      vi.mocked(generateRecommendations).mockResolvedValue(mockResult);

      const response = await app.inject({
        method: 'GET',
        url: '/api/recommendations?historyDays=365',
      });

      expect(response.statusCode).toBe(200);
      expect(generateRecommendations).toHaveBeenCalledWith(
        mockViewHistoryRepository,
        mockImageRepository,
        mockEmbeddingRepository,
        { limit: undefined, historyDays: 365 },
      );
    });
  });
});
