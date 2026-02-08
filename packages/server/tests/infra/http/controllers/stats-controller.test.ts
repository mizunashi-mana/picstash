import 'reflect-metadata';
import Fastify, { type FastifyInstance } from 'fastify';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { StatsController } from '@/infra/http/controllers/stats-controller';
import type {
  StatsRepository,
  OverviewStats,
  DailyViewStats,
  DailyRecommendationStats,
  PopularImage,
} from '@picstash/core';

interface ErrorResponse {
  error: string;
  message?: string;
}

function createMockStatsRepository(): StatsRepository {
  return {
    getOverview: vi.fn(),
    getViewTrends: vi.fn(),
    getRecommendationTrends: vi.fn(),
    getPopularImages: vi.fn(),
  };
}

function createMockOverviewStats(): OverviewStats {
  return {
    totalImages: 100,
    totalViews: 500,
    totalViewDuration: 360000,
    conversionRate: 0.25,
    avgViewDuration: 720,
  };
}

function createMockDailyViewStats(count: number = 3): DailyViewStats[] {
  return Array.from({ length: count }, (_, i) => ({
    date: `2024-01-${String(i + 1).padStart(2, '0')}`,
    viewCount: (i + 1) * 10,
    totalDuration: (i + 1) * 1000,
  }));
}

function createMockDailyRecommendationStats(count: number = 3): DailyRecommendationStats[] {
  return Array.from({ length: count }, (_, i) => ({
    date: `2024-01-${String(i + 1).padStart(2, '0')}`,
    impressions: (i + 1) * 100,
    clicks: (i + 1) * 10,
    conversionRate: 0.1,
  }));
}

function createMockPopularImages(count: number = 3): PopularImage[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `image-${i + 1}`,
    title: `Popular Image ${i + 1}`,
    thumbnailPath: `thumbnails/image-${i + 1}.jpg`,
    viewCount: (count - i) * 50,
    totalDuration: (count - i) * 5000,
    lastViewedAt: new Date().toISOString(),
  }));
}

describe('StatsController', () => {
  let app: FastifyInstance;
  let mockStatsRepository: StatsRepository;
  let controller: StatsController;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockStatsRepository = createMockStatsRepository();

    // Create controller with mocked dependencies
    controller = new StatsController(mockStatsRepository);

    // Create Fastify app and register routes
    app = Fastify({ logger: false });
    controller.registerRoutes(app);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /api/stats/overview', () => {
    it('should return overview statistics successfully', async () => {
      const mockStats = createMockOverviewStats();
      vi.mocked(mockStatsRepository.getOverview).mockResolvedValue(mockStats);

      const response = await app.inject({
        method: 'GET',
        url: '/api/stats/overview',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as OverviewStats;
      expect(body.totalImages).toBe(100);
      expect(body.totalViews).toBe(500);
      expect(body.totalViewDuration).toBe(360000);
      expect(body.conversionRate).toBe(0.25);
      expect(body.avgViewDuration).toBe(720);
      expect(mockStatsRepository.getOverview).toHaveBeenCalledWith({ days: undefined });
    });

    it('should accept custom days parameter', async () => {
      const mockStats = createMockOverviewStats();
      vi.mocked(mockStatsRepository.getOverview).mockResolvedValue(mockStats);

      const response = await app.inject({
        method: 'GET',
        url: '/api/stats/overview?days=7',
      });

      expect(response.statusCode).toBe(200);
      expect(mockStatsRepository.getOverview).toHaveBeenCalledWith({ days: 7 });
    });

    it('should accept days=365 (max value)', async () => {
      const mockStats = createMockOverviewStats();
      vi.mocked(mockStatsRepository.getOverview).mockResolvedValue(mockStats);

      const response = await app.inject({
        method: 'GET',
        url: '/api/stats/overview?days=365',
      });

      expect(response.statusCode).toBe(200);
      expect(mockStatsRepository.getOverview).toHaveBeenCalledWith({ days: 365 });
    });

    it('should return 400 for invalid days (zero)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/stats/overview?days=0',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toContain('Days must be a positive number');
    });

    it('should return 400 for invalid days (negative)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/stats/overview?days=-5',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toContain('Days must be a positive number');
    });

    it('should return 400 for invalid days (greater than 365)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/stats/overview?days=366',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toContain('not greater than 365');
    });

    it('should return 400 for invalid days (non-numeric)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/stats/overview?days=abc',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
    });

    it('should handle empty days parameter as undefined', async () => {
      const mockStats = createMockOverviewStats();
      vi.mocked(mockStatsRepository.getOverview).mockResolvedValue(mockStats);

      const response = await app.inject({
        method: 'GET',
        url: '/api/stats/overview?days=',
      });

      expect(response.statusCode).toBe(200);
      expect(mockStatsRepository.getOverview).toHaveBeenCalledWith({ days: undefined });
    });
  });

  describe('GET /api/stats/view-trends', () => {
    it('should return view trends successfully', async () => {
      const mockTrends = createMockDailyViewStats(5);
      vi.mocked(mockStatsRepository.getViewTrends).mockResolvedValue(mockTrends);

      const response = await app.inject({
        method: 'GET',
        url: '/api/stats/view-trends',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as DailyViewStats[];
      expect(body).toHaveLength(5);
      expect(body[0]).toHaveProperty('date');
      expect(body[0]).toHaveProperty('viewCount');
      expect(body[0]).toHaveProperty('totalDuration');
      expect(mockStatsRepository.getViewTrends).toHaveBeenCalledWith({ days: undefined });
    });

    it('should accept custom days parameter', async () => {
      const mockTrends = createMockDailyViewStats(14);
      vi.mocked(mockStatsRepository.getViewTrends).mockResolvedValue(mockTrends);

      const response = await app.inject({
        method: 'GET',
        url: '/api/stats/view-trends?days=14',
      });

      expect(response.statusCode).toBe(200);
      expect(mockStatsRepository.getViewTrends).toHaveBeenCalledWith({ days: 14 });
    });

    it('should return 400 for invalid days (zero)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/stats/view-trends?days=0',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toContain('Days must be a positive number');
    });

    it('should return 400 for invalid days (negative)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/stats/view-trends?days=-10',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
    });

    it('should return 400 for invalid days (greater than 365)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/stats/view-trends?days=400',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toContain('not greater than 365');
    });

    it('should return empty array when no data', async () => {
      vi.mocked(mockStatsRepository.getViewTrends).mockResolvedValue([]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/stats/view-trends',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as DailyViewStats[];
      expect(body).toHaveLength(0);
    });

    it('should handle empty days parameter as undefined', async () => {
      const mockTrends = createMockDailyViewStats();
      vi.mocked(mockStatsRepository.getViewTrends).mockResolvedValue(mockTrends);

      const response = await app.inject({
        method: 'GET',
        url: '/api/stats/view-trends?days=',
      });

      expect(response.statusCode).toBe(200);
      expect(mockStatsRepository.getViewTrends).toHaveBeenCalledWith({ days: undefined });
    });
  });

  describe('GET /api/stats/recommendation-trends', () => {
    it('should return recommendation trends successfully', async () => {
      const mockTrends = createMockDailyRecommendationStats(7);
      vi.mocked(mockStatsRepository.getRecommendationTrends).mockResolvedValue(mockTrends);

      const response = await app.inject({
        method: 'GET',
        url: '/api/stats/recommendation-trends',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as DailyRecommendationStats[];
      expect(body).toHaveLength(7);
      expect(body[0]).toHaveProperty('date');
      expect(body[0]).toHaveProperty('impressions');
      expect(body[0]).toHaveProperty('clicks');
      expect(body[0]).toHaveProperty('conversionRate');
      expect(mockStatsRepository.getRecommendationTrends).toHaveBeenCalledWith({ days: undefined });
    });

    it('should accept custom days parameter', async () => {
      const mockTrends = createMockDailyRecommendationStats(30);
      vi.mocked(mockStatsRepository.getRecommendationTrends).mockResolvedValue(mockTrends);

      const response = await app.inject({
        method: 'GET',
        url: '/api/stats/recommendation-trends?days=30',
      });

      expect(response.statusCode).toBe(200);
      expect(mockStatsRepository.getRecommendationTrends).toHaveBeenCalledWith({ days: 30 });
    });

    it('should return 400 for invalid days (zero)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/stats/recommendation-trends?days=0',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
    });

    it('should return 400 for invalid days (negative)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/stats/recommendation-trends?days=-1',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
    });

    it('should return 400 for invalid days (greater than 365)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/stats/recommendation-trends?days=500',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toContain('not greater than 365');
    });

    it('should return empty array when no data', async () => {
      vi.mocked(mockStatsRepository.getRecommendationTrends).mockResolvedValue([]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/stats/recommendation-trends',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as DailyRecommendationStats[];
      expect(body).toHaveLength(0);
    });

    it('should handle empty days parameter as undefined', async () => {
      const mockTrends = createMockDailyRecommendationStats();
      vi.mocked(mockStatsRepository.getRecommendationTrends).mockResolvedValue(mockTrends);

      const response = await app.inject({
        method: 'GET',
        url: '/api/stats/recommendation-trends?days=',
      });

      expect(response.statusCode).toBe(200);
      expect(mockStatsRepository.getRecommendationTrends).toHaveBeenCalledWith({ days: undefined });
    });
  });

  describe('GET /api/stats/popular-images', () => {
    it('should return popular images successfully', async () => {
      const mockImages = createMockPopularImages(5);
      vi.mocked(mockStatsRepository.getPopularImages).mockResolvedValue(mockImages);

      const response = await app.inject({
        method: 'GET',
        url: '/api/stats/popular-images',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as PopularImage[];
      expect(body).toHaveLength(5);
      expect(body[0]).toHaveProperty('id');
      expect(body[0]).toHaveProperty('title');
      expect(body[0]).toHaveProperty('thumbnailPath');
      expect(body[0]).toHaveProperty('viewCount');
      expect(body[0]).toHaveProperty('totalDuration');
      expect(body[0]).toHaveProperty('lastViewedAt');
      expect(mockStatsRepository.getPopularImages).toHaveBeenCalledWith({
        days: undefined,
        limit: undefined,
      });
    });

    it('should accept custom days parameter', async () => {
      const mockImages = createMockPopularImages();
      vi.mocked(mockStatsRepository.getPopularImages).mockResolvedValue(mockImages);

      const response = await app.inject({
        method: 'GET',
        url: '/api/stats/popular-images?days=7',
      });

      expect(response.statusCode).toBe(200);
      expect(mockStatsRepository.getPopularImages).toHaveBeenCalledWith({
        days: 7,
        limit: undefined,
      });
    });

    it('should accept custom limit parameter', async () => {
      const mockImages = createMockPopularImages(10);
      vi.mocked(mockStatsRepository.getPopularImages).mockResolvedValue(mockImages);

      const response = await app.inject({
        method: 'GET',
        url: '/api/stats/popular-images?limit=10',
      });

      expect(response.statusCode).toBe(200);
      expect(mockStatsRepository.getPopularImages).toHaveBeenCalledWith({
        days: undefined,
        limit: 10,
      });
    });

    it('should accept both days and limit parameters', async () => {
      const mockImages = createMockPopularImages(20);
      vi.mocked(mockStatsRepository.getPopularImages).mockResolvedValue(mockImages);

      const response = await app.inject({
        method: 'GET',
        url: '/api/stats/popular-images?days=14&limit=20',
      });

      expect(response.statusCode).toBe(200);
      expect(mockStatsRepository.getPopularImages).toHaveBeenCalledWith({
        days: 14,
        limit: 20,
      });
    });

    it('should accept limit=100 (max value)', async () => {
      const mockImages = createMockPopularImages();
      vi.mocked(mockStatsRepository.getPopularImages).mockResolvedValue(mockImages);

      const response = await app.inject({
        method: 'GET',
        url: '/api/stats/popular-images?limit=100',
      });

      expect(response.statusCode).toBe(200);
      expect(mockStatsRepository.getPopularImages).toHaveBeenCalledWith({
        days: undefined,
        limit: 100,
      });
    });

    it('should return 400 for invalid days (zero)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/stats/popular-images?days=0',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toContain('Days must be a positive number');
    });

    it('should return 400 for invalid days (negative)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/stats/popular-images?days=-5',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
    });

    it('should return 400 for invalid days (greater than 365)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/stats/popular-images?days=366',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toContain('not greater than 365');
    });

    it('should return 400 for invalid limit (zero)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/stats/popular-images?limit=0',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toContain('Limit must be a positive number');
    });

    it('should return 400 for invalid limit (negative)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/stats/popular-images?limit=-10',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
    });

    it('should return 400 for invalid limit (greater than 100)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/stats/popular-images?limit=101',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toContain('not greater than 100');
    });

    it('should return 400 for invalid limit (non-numeric)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/stats/popular-images?limit=abc',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
    });

    it('should return empty array when no data', async () => {
      vi.mocked(mockStatsRepository.getPopularImages).mockResolvedValue([]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/stats/popular-images',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as PopularImage[];
      expect(body).toHaveLength(0);
    });

    it('should handle empty days and limit parameters as undefined', async () => {
      const mockImages = createMockPopularImages();
      vi.mocked(mockStatsRepository.getPopularImages).mockResolvedValue(mockImages);

      const response = await app.inject({
        method: 'GET',
        url: '/api/stats/popular-images?days=&limit=',
      });

      expect(response.statusCode).toBe(200);
      expect(mockStatsRepository.getPopularImages).toHaveBeenCalledWith({
        days: undefined,
        limit: undefined,
      });
    });

    it('should handle image with null thumbnailPath', async () => {
      const mockImages: PopularImage[] = [
        {
          id: 'image-1',
          title: 'Image without thumbnail',
          thumbnailPath: null,
          viewCount: 100,
          totalDuration: 5000,
          lastViewedAt: null,
        },
      ];
      vi.mocked(mockStatsRepository.getPopularImages).mockResolvedValue(mockImages);

      const response = await app.inject({
        method: 'GET',
        url: '/api/stats/popular-images',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as PopularImage[];
      expect(body[0]?.thumbnailPath).toBeNull();
      expect(body[0]?.lastViewedAt).toBeNull();
    });
  });
});
