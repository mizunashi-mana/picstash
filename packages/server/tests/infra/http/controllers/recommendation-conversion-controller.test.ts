import 'reflect-metadata';
import Fastify, { type FastifyInstance } from 'fastify';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { RecommendationConversionController } from '@/infra/http/controllers/recommendation-conversion-controller';
import { Prisma } from '@~generated/prisma/client.js';
import type {
  RecommendationConversion,
  RecommendationConversionRepository,
  ConversionStats,
} from '@picstash/core';

interface ErrorResponse {
  error: string;
  message?: string;
}

interface CreateImpressionsResponse {
  ids: string[];
}

function createMockRecommendationConversionRepository(): RecommendationConversionRepository {
  return {
    createImpressions: vi.fn(),
    findById: vi.fn(),
    recordClick: vi.fn(),
    getStats: vi.fn(),
  };
}

function createMockConversion(overrides: Partial<RecommendationConversion> = {}): RecommendationConversion {
  return {
    id: 'conv-1',
    imageId: 'img-1',
    recommendationScore: 0.85,
    impressionAt: new Date('2024-01-01T12:00:00Z'),
    clickedAt: null,
    viewHistoryId: null,
    createdAt: new Date('2024-01-01T12:00:00Z'),
    ...overrides,
  };
}

function createMockStats(overrides: Partial<ConversionStats> = {}): ConversionStats {
  return {
    totalImpressions: 100,
    totalClicks: 25,
    conversionRate: 0.25,
    avgClickedDuration: 5000,
    periodStart: new Date('2024-01-01T00:00:00Z'),
    periodEnd: new Date('2024-01-31T23:59:59Z'),
    ...overrides,
  };
}

describe('RecommendationConversionController', () => {
  let app: FastifyInstance;
  let mockConversionRepository: RecommendationConversionRepository;
  let controller: RecommendationConversionController;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockConversionRepository = createMockRecommendationConversionRepository();

    controller = new RecommendationConversionController(
      mockConversionRepository,
    );

    app = Fastify({ logger: false });
    controller.registerRoutes(app);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /api/recommendation-conversions/impressions', () => {
    it('should create impressions successfully', async () => {
      const mockConversions = [
        createMockConversion({ id: 'conv-1', imageId: 'img-1' }),
        createMockConversion({ id: 'conv-2', imageId: 'img-2' }),
      ];
      vi.mocked(mockConversionRepository.createImpressions).mockResolvedValue(mockConversions);

      const response = await app.inject({
        method: 'POST',
        url: '/api/recommendation-conversions/impressions',
        payload: {
          recommendations: [
            { imageId: 'img-1', score: 0.85 },
            { imageId: 'img-2', score: 0.70 },
          ],
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body) as CreateImpressionsResponse;
      expect(body.ids).toEqual(['conv-1', 'conv-2']);
      expect(mockConversionRepository.createImpressions).toHaveBeenCalledWith([
        { imageId: 'img-1', score: 0.85 },
        { imageId: 'img-2', score: 0.70 },
      ]);
    });

    it('should return 400 when recommendations is not an array', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/recommendation-conversions/impressions',
        payload: {
          recommendations: 'not-an-array',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toBe('At least one recommendation is required');
    });

    it('should return 400 when recommendations is empty', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/recommendation-conversions/impressions',
        payload: {
          recommendations: [],
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toBe('At least one recommendation is required');
    });

    it('should return 400 when too many recommendations are provided', async () => {
      const recommendations = Array.from({ length: 101 }, (_, i) => ({
        imageId: `img-${i}`,
        score: 0.5,
      }));

      const response = await app.inject({
        method: 'POST',
        url: '/api/recommendation-conversions/impressions',
        payload: {
          recommendations,
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toBe('Too many recommendations (max 100)');
    });

    it('should return 400 when imageId is not a string', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/recommendation-conversions/impressions',
        payload: {
          recommendations: [
            { imageId: 123, score: 0.85 },
          ],
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toBe('Each recommendation must have a valid imageId (string) and score (0-1)');
    });

    it('should return 400 when imageId is empty string', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/recommendation-conversions/impressions',
        payload: {
          recommendations: [
            { imageId: '   ', score: 0.85 },
          ],
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toBe('Each recommendation must have a valid imageId (string) and score (0-1)');
    });

    it('should return 400 when score is not a number', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/recommendation-conversions/impressions',
        payload: {
          recommendations: [
            { imageId: 'img-1', score: 'high' },
          ],
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toBe('Each recommendation must have a valid imageId (string) and score (0-1)');
    });

    it('should return 400 when score is negative', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/recommendation-conversions/impressions',
        payload: {
          recommendations: [
            { imageId: 'img-1', score: -0.1 },
          ],
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toBe('Each recommendation must have a valid imageId (string) and score (0-1)');
    });

    it('should return 400 when score is greater than 1', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/recommendation-conversions/impressions',
        payload: {
          recommendations: [
            { imageId: 'img-1', score: 1.5 },
          ],
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toBe('Each recommendation must have a valid imageId (string) and score (0-1)');
    });

    it('should return 400 when score is NaN', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/recommendation-conversions/impressions',
        payload: {
          recommendations: [
            { imageId: 'img-1', score: NaN },
          ],
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toBe('Each recommendation must have a valid imageId (string) and score (0-1)');
    });

    it('should return 400 when score is Infinity', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/recommendation-conversions/impressions',
        payload: {
          recommendations: [
            { imageId: 'img-1', score: Infinity },
          ],
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toBe('Each recommendation must have a valid imageId (string) and score (0-1)');
    });

    it('should accept score of 0', async () => {
      const mockConversions = [createMockConversion({ id: 'conv-1', recommendationScore: 0 })];
      vi.mocked(mockConversionRepository.createImpressions).mockResolvedValue(mockConversions);

      const response = await app.inject({
        method: 'POST',
        url: '/api/recommendation-conversions/impressions',
        payload: {
          recommendations: [
            { imageId: 'img-1', score: 0 },
          ],
        },
      });

      expect(response.statusCode).toBe(201);
    });

    it('should accept score of 1', async () => {
      const mockConversions = [createMockConversion({ id: 'conv-1', recommendationScore: 1 })];
      vi.mocked(mockConversionRepository.createImpressions).mockResolvedValue(mockConversions);

      const response = await app.inject({
        method: 'POST',
        url: '/api/recommendation-conversions/impressions',
        payload: {
          recommendations: [
            { imageId: 'img-1', score: 1 },
          ],
        },
      });

      expect(response.statusCode).toBe(201);
    });

    it('should trim imageId whitespace', async () => {
      const mockConversions = [createMockConversion({ id: 'conv-1', imageId: 'img-1' })];
      vi.mocked(mockConversionRepository.createImpressions).mockResolvedValue(mockConversions);

      const response = await app.inject({
        method: 'POST',
        url: '/api/recommendation-conversions/impressions',
        payload: {
          recommendations: [
            { imageId: '  img-1  ', score: 0.85 },
          ],
        },
      });

      expect(response.statusCode).toBe(201);
      expect(mockConversionRepository.createImpressions).toHaveBeenCalledWith([
        { imageId: 'img-1', score: 0.85 },
      ]);
    });

    it('should accept exactly 100 recommendations', async () => {
      const recommendations = Array.from({ length: 100 }, (_, i) => ({
        imageId: `img-${i}`,
        score: 0.5,
      }));
      const mockConversions = recommendations.map((rec, i) =>
        createMockConversion({ id: `conv-${i}`, imageId: rec.imageId }),
      );
      vi.mocked(mockConversionRepository.createImpressions).mockResolvedValue(mockConversions);

      const response = await app.inject({
        method: 'POST',
        url: '/api/recommendation-conversions/impressions',
        payload: {
          recommendations,
        },
      });

      expect(response.statusCode).toBe(201);
    });
  });

  describe('PATCH /api/recommendation-conversions/:id/click', () => {
    it('should record a click successfully', async () => {
      const existingConversion = createMockConversion({ clickedAt: null });
      const updatedConversion = createMockConversion({
        clickedAt: new Date('2024-01-01T12:30:00Z'),
        viewHistoryId: 'view-1',
      });

      vi.mocked(mockConversionRepository.findById).mockResolvedValue(existingConversion);
      vi.mocked(mockConversionRepository.recordClick).mockResolvedValue(updatedConversion);

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/recommendation-conversions/conv-1/click',
        payload: {
          viewHistoryId: 'view-1',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as RecommendationConversion;
      expect(body.viewHistoryId).toBe('view-1');
      expect(mockConversionRepository.recordClick).toHaveBeenCalledWith('conv-1', {
        viewHistoryId: 'view-1',
      });
    });

    it('should return 400 when viewHistoryId is missing', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/recommendation-conversions/conv-1/click',
        payload: {},
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toBe('viewHistoryId is required');
    });

    it('should return 400 when viewHistoryId is not a string', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/recommendation-conversions/conv-1/click',
        payload: {
          viewHistoryId: 123,
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toBe('viewHistoryId is required');
    });

    it('should return 400 when viewHistoryId is empty string', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/recommendation-conversions/conv-1/click',
        payload: {
          viewHistoryId: '   ',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toBe('viewHistoryId is required');
    });

    it('should return 404 when conversion record not found', async () => {
      vi.mocked(mockConversionRepository.findById).mockResolvedValue(null);

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/recommendation-conversions/non-existent/click',
        payload: {
          viewHistoryId: 'view-1',
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Not Found');
      expect(body.message).toBe('Recommendation conversion record not found');
    });

    it('should return 409 when recommendation has already been clicked', async () => {
      const existingConversion = createMockConversion({
        clickedAt: new Date('2024-01-01T12:30:00Z'),
        viewHistoryId: 'view-1',
      });
      vi.mocked(mockConversionRepository.findById).mockResolvedValue(existingConversion);

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/recommendation-conversions/conv-1/click',
        payload: {
          viewHistoryId: 'view-2',
        },
      });

      expect(response.statusCode).toBe(409);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Conflict');
      expect(body.message).toBe('This recommendation has already been clicked');
    });

    it('should return 404 when view history record not found (foreign key violation)', async () => {
      const existingConversion = createMockConversion({ clickedAt: null });
      vi.mocked(mockConversionRepository.findById).mockResolvedValue(existingConversion);

      const prismaError = new Prisma.PrismaClientKnownRequestError('Foreign key constraint failed', {
        code: 'P2003',
        clientVersion: '5.0.0',
      });
      vi.mocked(mockConversionRepository.recordClick).mockRejectedValue(prismaError);

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/recommendation-conversions/conv-1/click',
        payload: {
          viewHistoryId: 'non-existent-view',
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Not Found');
      expect(body.message).toBe('View history record not found');
    });

    it('should rethrow non-Prisma errors', async () => {
      const existingConversion = createMockConversion({ clickedAt: null });
      vi.mocked(mockConversionRepository.findById).mockResolvedValue(existingConversion);

      const genericError = new Error('Database connection lost');
      vi.mocked(mockConversionRepository.recordClick).mockRejectedValue(genericError);

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/recommendation-conversions/conv-1/click',
        payload: {
          viewHistoryId: 'view-1',
        },
      });

      expect(response.statusCode).toBe(500);
    });

    it('should rethrow Prisma errors with different error codes', async () => {
      const existingConversion = createMockConversion({ clickedAt: null });
      vi.mocked(mockConversionRepository.findById).mockResolvedValue(existingConversion);

      const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '5.0.0',
      });
      vi.mocked(mockConversionRepository.recordClick).mockRejectedValue(prismaError);

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/recommendation-conversions/conv-1/click',
        payload: {
          viewHistoryId: 'view-1',
        },
      });

      expect(response.statusCode).toBe(500);
    });

    it('should trim viewHistoryId whitespace', async () => {
      const existingConversion = createMockConversion({ clickedAt: null });
      const updatedConversion = createMockConversion({
        clickedAt: new Date('2024-01-01T12:30:00Z'),
        viewHistoryId: 'view-1',
      });

      vi.mocked(mockConversionRepository.findById).mockResolvedValue(existingConversion);
      vi.mocked(mockConversionRepository.recordClick).mockResolvedValue(updatedConversion);

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/recommendation-conversions/conv-1/click',
        payload: {
          viewHistoryId: '  view-1  ',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(mockConversionRepository.recordClick).toHaveBeenCalledWith('conv-1', {
        viewHistoryId: 'view-1',
      });
    });
  });

  describe('GET /api/recommendation-conversions/stats', () => {
    it('should return stats with default days', async () => {
      const mockStats = createMockStats();
      vi.mocked(mockConversionRepository.getStats).mockResolvedValue(mockStats);

      const response = await app.inject({
        method: 'GET',
        url: '/api/recommendation-conversions/stats',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as ConversionStats;
      expect(body.totalImpressions).toBe(100);
      expect(body.totalClicks).toBe(25);
      expect(body.conversionRate).toBe(0.25);
      expect(mockConversionRepository.getStats).toHaveBeenCalledWith({ days: undefined });
    });

    it('should return stats with custom days parameter', async () => {
      const mockStats = createMockStats();
      vi.mocked(mockConversionRepository.getStats).mockResolvedValue(mockStats);

      const response = await app.inject({
        method: 'GET',
        url: '/api/recommendation-conversions/stats?days=7',
      });

      expect(response.statusCode).toBe(200);
      expect(mockConversionRepository.getStats).toHaveBeenCalledWith({ days: 7 });
    });

    it('should return 400 when days is not a valid number', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/recommendation-conversions/stats?days=abc',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toBe('Days must be a positive number');
    });

    it('should return 400 when days is zero', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/recommendation-conversions/stats?days=0',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toBe('Days must be a positive number');
    });

    it('should return 400 when days is negative', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/recommendation-conversions/stats?days=-5',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toBe('Days must be a positive number');
    });

    it('should handle empty days parameter as default', async () => {
      const mockStats = createMockStats();
      vi.mocked(mockConversionRepository.getStats).mockResolvedValue(mockStats);

      const response = await app.inject({
        method: 'GET',
        url: '/api/recommendation-conversions/stats?days=',
      });

      expect(response.statusCode).toBe(200);
      expect(mockConversionRepository.getStats).toHaveBeenCalledWith({ days: undefined });
    });

    it('should return stats with null avgClickedDuration', async () => {
      const mockStats = createMockStats({ avgClickedDuration: null });
      vi.mocked(mockConversionRepository.getStats).mockResolvedValue(mockStats);

      const response = await app.inject({
        method: 'GET',
        url: '/api/recommendation-conversions/stats',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as ConversionStats;
      expect(body.avgClickedDuration).toBeNull();
    });

    it('should return stats with zero conversion rate', async () => {
      const mockStats = createMockStats({
        totalImpressions: 100,
        totalClicks: 0,
        conversionRate: 0,
      });
      vi.mocked(mockConversionRepository.getStats).mockResolvedValue(mockStats);

      const response = await app.inject({
        method: 'GET',
        url: '/api/recommendation-conversions/stats',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as ConversionStats;
      expect(body.conversionRate).toBe(0);
    });
  });
});
