import 'reflect-metadata';
import Fastify, { type FastifyInstance } from 'fastify';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { ViewHistoryController } from '@/infra/http/controllers/view-history-controller';
import { Prisma } from '@~generated/prisma/client.js';
import type {
  ViewHistoryRepository,
  ViewHistory,
  ViewHistoryWithImage,
  ImageViewStats,
} from '@picstash/core';

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

function createMockViewHistory(overrides: Partial<ViewHistory> = {}): ViewHistory {
  return {
    id: 'view-history-1',
    imageId: 'image-1',
    viewedAt: new Date('2024-01-15T10:00:00Z'),
    duration: null,
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
    ...overrides,
  };
}

function createMockViewHistoryWithImage(overrides: Partial<ViewHistoryWithImage> = {}): ViewHistoryWithImage {
  return {
    id: 'view-history-1',
    imageId: 'image-1',
    viewedAt: new Date('2024-01-15T10:00:00Z'),
    duration: 5000,
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
    image: {
      id: 'image-1',
      title: 'Test Image',
      thumbnailPath: 'thumbnails/image-1.jpg',
    },
    ...overrides,
  };
}

function createMockImageViewStats(overrides: Partial<ImageViewStats> = {}): ImageViewStats {
  return {
    viewCount: 10,
    totalDuration: 50000,
    lastViewedAt: new Date('2024-01-15T12:00:00Z'),
    ...overrides,
  };
}

describe('ViewHistoryController', () => {
  let app: FastifyInstance;
  let mockViewHistoryRepository: ViewHistoryRepository;
  let controller: ViewHistoryController;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockViewHistoryRepository = createMockViewHistoryRepository();

    // Create controller with mocked dependencies
    controller = new ViewHistoryController(mockViewHistoryRepository);

    // Create Fastify app and register routes
    app = Fastify({ logger: false });
    controller.registerRoutes(app);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /api/view-history', () => {
    it('should create view history successfully', async () => {
      const mockHistory = createMockViewHistory();
      vi.mocked(mockViewHistoryRepository.create).mockResolvedValue(mockHistory);

      const response = await app.inject({
        method: 'POST',
        url: '/api/view-history',
        payload: { imageId: 'image-1' },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body) as ViewHistory;
      expect(body.id).toBe('view-history-1');
      expect(body.imageId).toBe('image-1');
      expect(mockViewHistoryRepository.create).toHaveBeenCalledWith({
        imageId: 'image-1',
      });
    });

    it('should trim imageId before creating', async () => {
      const mockHistory = createMockViewHistory();
      vi.mocked(mockViewHistoryRepository.create).mockResolvedValue(mockHistory);

      const response = await app.inject({
        method: 'POST',
        url: '/api/view-history',
        payload: { imageId: '  image-1  ' },
      });

      expect(response.statusCode).toBe(201);
      expect(mockViewHistoryRepository.create).toHaveBeenCalledWith({
        imageId: 'image-1',
      });
    });

    it('should return 400 when imageId is empty', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/view-history',
        payload: { imageId: '' },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toBe('Image ID is required');
    });

    it('should return 400 when imageId is only whitespace', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/view-history',
        payload: { imageId: '   ' },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toBe('Image ID is required');
    });

    it('should return 404 when image not found (foreign key constraint)', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Foreign key constraint failed',
        { code: 'P2003', clientVersion: '5.0.0' },
      );
      vi.mocked(mockViewHistoryRepository.create).mockRejectedValue(prismaError);

      const response = await app.inject({
        method: 'POST',
        url: '/api/view-history',
        payload: { imageId: 'non-existent-image' },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Not Found');
      expect(body.message).toBe('Image not found');
    });

    it('should rethrow non-Prisma errors', async () => {
      const genericError = new Error('Database connection failed');
      vi.mocked(mockViewHistoryRepository.create).mockRejectedValue(genericError);

      const response = await app.inject({
        method: 'POST',
        url: '/api/view-history',
        payload: { imageId: 'image-1' },
      });

      expect(response.statusCode).toBe(500);
    });

    it('should rethrow Prisma errors with different code', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '5.0.0' },
      );
      vi.mocked(mockViewHistoryRepository.create).mockRejectedValue(prismaError);

      const response = await app.inject({
        method: 'POST',
        url: '/api/view-history',
        payload: { imageId: 'image-1' },
      });

      expect(response.statusCode).toBe(500);
    });
  });

  describe('PATCH /api/view-history/:id', () => {
    it('should update view history duration successfully', async () => {
      const existingHistory = createMockViewHistory();
      const updatedHistory = createMockViewHistory({ duration: 5000 });
      vi.mocked(mockViewHistoryRepository.findById).mockResolvedValue(existingHistory);
      vi.mocked(mockViewHistoryRepository.updateDuration).mockResolvedValue(updatedHistory);

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/view-history/view-history-1',
        payload: { duration: 5000 },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as ViewHistory;
      expect(body.duration).toBe(5000);
      expect(mockViewHistoryRepository.updateDuration).toHaveBeenCalledWith(
        'view-history-1',
        { duration: 5000 },
      );
    });

    it('should accept zero duration', async () => {
      const existingHistory = createMockViewHistory();
      const updatedHistory = createMockViewHistory({ duration: 0 });
      vi.mocked(mockViewHistoryRepository.findById).mockResolvedValue(existingHistory);
      vi.mocked(mockViewHistoryRepository.updateDuration).mockResolvedValue(updatedHistory);

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/view-history/view-history-1',
        payload: { duration: 0 },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as ViewHistory;
      expect(body.duration).toBe(0);
    });

    it('should return 400 when duration is negative', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/view-history/view-history-1',
        payload: { duration: -100 },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toBe('Duration must be a non-negative number');
    });

    it('should return 400 when duration is not a number', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/view-history/view-history-1',
        payload: { duration: 'invalid' },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toBe('Duration must be a non-negative number');
    });

    it('should return 400 when duration is null', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/view-history/view-history-1',
        payload: { duration: null },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toBe('Duration must be a non-negative number');
    });

    it('should return 404 when view history record not found', async () => {
      vi.mocked(mockViewHistoryRepository.findById).mockResolvedValue(null);

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/view-history/non-existent-id',
        payload: { duration: 5000 },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Not Found');
      expect(body.message).toBe('View history record not found');
    });
  });

  describe('GET /api/view-history', () => {
    it('should return recent view history', async () => {
      const mockHistories = [
        createMockViewHistoryWithImage({ id: 'view-1' }),
        createMockViewHistoryWithImage({ id: 'view-2', imageId: 'image-2' }),
      ];
      vi.mocked(mockViewHistoryRepository.findRecentWithImages).mockResolvedValue(mockHistories);

      const response = await app.inject({
        method: 'GET',
        url: '/api/view-history',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as ViewHistoryWithImage[];
      expect(body).toHaveLength(2);
      expect(body[0]?.id).toBe('view-1');
      expect(body[0]?.image).toBeDefined();
      expect(mockViewHistoryRepository.findRecentWithImages).toHaveBeenCalledWith({
        limit: undefined,
        offset: undefined,
      });
    });

    it('should return empty array when no history exists', async () => {
      vi.mocked(mockViewHistoryRepository.findRecentWithImages).mockResolvedValue([]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/view-history',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as ViewHistoryWithImage[];
      expect(body).toHaveLength(0);
    });

    it('should pass limit parameter correctly', async () => {
      vi.mocked(mockViewHistoryRepository.findRecentWithImages).mockResolvedValue([]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/view-history?limit=10',
      });

      expect(response.statusCode).toBe(200);
      expect(mockViewHistoryRepository.findRecentWithImages).toHaveBeenCalledWith({
        limit: 10,
        offset: undefined,
      });
    });

    it('should pass offset parameter correctly', async () => {
      vi.mocked(mockViewHistoryRepository.findRecentWithImages).mockResolvedValue([]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/view-history?offset=20',
      });

      expect(response.statusCode).toBe(200);
      expect(mockViewHistoryRepository.findRecentWithImages).toHaveBeenCalledWith({
        limit: undefined,
        offset: 20,
      });
    });

    it('should pass both limit and offset parameters', async () => {
      vi.mocked(mockViewHistoryRepository.findRecentWithImages).mockResolvedValue([]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/view-history?limit=10&offset=20',
      });

      expect(response.statusCode).toBe(200);
      expect(mockViewHistoryRepository.findRecentWithImages).toHaveBeenCalledWith({
        limit: 10,
        offset: 20,
      });
    });

    it('should return 400 when limit is invalid (zero)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/view-history?limit=0',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toBe('Limit must be a positive number');
    });

    it('should return 400 when limit is negative', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/view-history?limit=-5',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toBe('Limit must be a positive number');
    });

    it('should return 400 when limit is not a number', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/view-history?limit=abc',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toBe('Limit must be a positive number');
    });

    it('should return 400 when offset is negative', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/view-history?offset=-1',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toBe('Offset must be a non-negative number');
    });

    it('should return 400 when offset is not a number', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/view-history?offset=abc',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toBe('Offset must be a non-negative number');
    });

    it('should treat empty string parameters as undefined', async () => {
      vi.mocked(mockViewHistoryRepository.findRecentWithImages).mockResolvedValue([]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/view-history?limit=&offset=',
      });

      expect(response.statusCode).toBe(200);
      expect(mockViewHistoryRepository.findRecentWithImages).toHaveBeenCalledWith({
        limit: undefined,
        offset: undefined,
      });
    });

    it('should accept zero offset', async () => {
      vi.mocked(mockViewHistoryRepository.findRecentWithImages).mockResolvedValue([]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/view-history?offset=0',
      });

      expect(response.statusCode).toBe(200);
      expect(mockViewHistoryRepository.findRecentWithImages).toHaveBeenCalledWith({
        limit: undefined,
        offset: 0,
      });
    });
  });

  describe('GET /api/images/:id/view-stats', () => {
    it('should return view statistics for an image', async () => {
      const mockStats = createMockImageViewStats();
      vi.mocked(mockViewHistoryRepository.getImageStats).mockResolvedValue(mockStats);

      const response = await app.inject({
        method: 'GET',
        url: '/api/images/image-1/view-stats',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as ImageViewStats;
      expect(body.viewCount).toBe(10);
      expect(body.totalDuration).toBe(50000);
      expect(mockViewHistoryRepository.getImageStats).toHaveBeenCalledWith('image-1');
    });

    it('should return zero stats for image with no views', async () => {
      const mockStats = createMockImageViewStats({
        viewCount: 0,
        totalDuration: 0,
        lastViewedAt: null,
      });
      vi.mocked(mockViewHistoryRepository.getImageStats).mockResolvedValue(mockStats);

      const response = await app.inject({
        method: 'GET',
        url: '/api/images/new-image/view-stats',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as ImageViewStats;
      expect(body.viewCount).toBe(0);
      expect(body.totalDuration).toBe(0);
      expect(body.lastViewedAt).toBeNull();
    });

    it('should pass the image id correctly', async () => {
      const mockStats = createMockImageViewStats();
      vi.mocked(mockViewHistoryRepository.getImageStats).mockResolvedValue(mockStats);

      await app.inject({
        method: 'GET',
        url: '/api/images/special-image-id-123/view-stats',
      });

      expect(mockViewHistoryRepository.getImageStats).toHaveBeenCalledWith('special-image-id-123');
    });
  });
});
