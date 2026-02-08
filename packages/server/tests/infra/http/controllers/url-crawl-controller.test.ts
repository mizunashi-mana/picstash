import 'reflect-metadata';
import * as picstashCore from '@picstash/core';
import Fastify, { type FastifyInstance } from 'fastify';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { UrlCrawlController } from '@/infra/http/controllers/url-crawl-controller';
import type {
  FileStorage,
  ImageEntity,
  ImageProcessor,
  ImageRepository,
  UrlCrawlSessionManager,
  UrlCrawlSession,
} from '@picstash/core';

// Mock importFromUrlCrawl
vi.mock('@picstash/core', async (importOriginal) => {
  const actual = await importOriginal<object>();
  return {
    ...actual,
    importFromUrlCrawl: vi.fn(),
  };
});

const { importFromUrlCrawl } = picstashCore;

interface ErrorResponse {
  error: string;
  message: string;
}

interface CreateSessionResponse {
  sessionId: string;
  sourceUrl: string;
  pageTitle?: string;
  imageCount: number;
}

interface GetSessionResponse {
  sessionId: string;
  sourceUrl: string;
  pageTitle?: string;
  imageCount: number;
  images: Array<{
    index: number;
    url: string;
    filename: string;
    alt?: string;
  }>;
}

interface ImportResponse {
  totalRequested: number;
  successCount: number;
  failedCount: number;
  results: Array<{
    index: number;
    success: boolean;
    imageId?: string;
    error?: string;
  }>;
}

function createMockImageEntity(id: string): ImageEntity {
  // Cast through unknown to create a minimal mock for testing

  return { id } as unknown as ImageEntity;
}

function createMockSession(overrides?: Partial<UrlCrawlSession>): UrlCrawlSession {
  return {
    id: 'test-session-id',
    sourceUrl: 'https://example.com/gallery',
    pageTitle: 'Test Gallery',
    imageEntries: [
      { index: 0, url: 'https://example.com/image1.jpg', filename: 'image1.jpg', alt: 'Image 1' },
      { index: 1, url: 'https://example.com/image2.png', filename: 'image2.png' },
      { index: 2, url: 'https://example.com/image3.gif', filename: 'image3.gif', alt: 'Image 3' },
    ],
    createdAt: new Date(),
    ...overrides,
  };
}

function createMockUrlCrawlSessionManager(): UrlCrawlSessionManager {
  return {
    createSession: vi.fn(),
    getSession: vi.fn(),
    fetchImage: vi.fn(),
    deleteSession: vi.fn(),
  };
}

function createMockImageProcessor(): ImageProcessor {
  return {
    getMetadata: vi.fn(),
    generateThumbnail: vi.fn(),
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

describe('UrlCrawlController', () => {
  let app: FastifyInstance;
  let mockSessionManager: UrlCrawlSessionManager;
  let mockImageProcessor: ImageProcessor;
  let mockImageRepository: ImageRepository;
  let mockFileStorage: FileStorage;
  let controller: UrlCrawlController;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockSessionManager = createMockUrlCrawlSessionManager();
    mockImageProcessor = createMockImageProcessor();
    mockImageRepository = createMockImageRepository();
    mockFileStorage = createMockFileStorage();

    controller = new UrlCrawlController(
      mockSessionManager,
      mockImageProcessor,
      mockImageRepository,
      mockFileStorage,
    );

    app = Fastify({ logger: false });
    controller.registerRoutes(app);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /api/url-crawl', () => {
    it('should create a crawl session successfully', async () => {
      const mockSession = createMockSession();
      vi.mocked(mockSessionManager.createSession).mockResolvedValue({
        success: true,
        session: mockSession,
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/url-crawl',
        payload: { url: 'https://example.com/gallery' },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body) as CreateSessionResponse;
      expect(body.sessionId).toBe('test-session-id');
      expect(body.sourceUrl).toBe('https://example.com/gallery');
      expect(body.pageTitle).toBe('Test Gallery');
      expect(body.imageCount).toBe(3);
    });

    it('should return 400 when URL is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/url-crawl',
        payload: {},
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toBe('URL is required');
    });

    it('should return 400 when URL is empty string', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/url-crawl',
        payload: { url: '   ' },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toBe('URL is required');
    });

    it('should return 400 for invalid URL', async () => {
      vi.mocked(mockSessionManager.createSession).mockResolvedValue({
        success: false,
        error: 'INVALID_URL',
        message: 'Invalid URL format',
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/url-crawl',
        payload: { url: 'not-a-valid-url' },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
    });

    it('should return 502 when fetch fails', async () => {
      vi.mocked(mockSessionManager.createSession).mockResolvedValue({
        success: false,
        error: 'FETCH_FAILED',
        message: 'Failed to fetch URL',
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/url-crawl',
        payload: { url: 'https://unreachable.example.com' },
      });

      expect(response.statusCode).toBe(502);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Gateway');
    });

    it('should return 404 when no images found', async () => {
      vi.mocked(mockSessionManager.createSession).mockResolvedValue({
        success: false,
        error: 'NO_IMAGES_FOUND',
        message: 'No images found on the page',
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/url-crawl',
        payload: { url: 'https://example.com/no-images' },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Not Found');
    });

    it('should return 504 on timeout', async () => {
      vi.mocked(mockSessionManager.createSession).mockResolvedValue({
        success: false,
        error: 'TIMEOUT',
        message: 'Request timed out',
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/url-crawl',
        payload: { url: 'https://slow.example.com' },
      });

      expect(response.statusCode).toBe(504);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Gateway Timeout');
    });

    it('should trim URL before processing', async () => {
      const mockSession = createMockSession();
      vi.mocked(mockSessionManager.createSession).mockResolvedValue({
        success: true,
        session: mockSession,
      });

      await app.inject({
        method: 'POST',
        url: '/api/url-crawl',
        payload: { url: '  https://example.com/gallery  ' },
      });

      expect(mockSessionManager.createSession).toHaveBeenCalledWith({
        url: 'https://example.com/gallery',
      });
    });

    it('should return 429 when rate limit exceeded', async () => {
      const mockSession = createMockSession();
      vi.mocked(mockSessionManager.createSession).mockResolvedValue({
        success: true,
        session: mockSession,
      });

      // Make 10 requests (the limit)
      for (let i = 0; i < 10; i++) {
        await app.inject({
          method: 'POST',
          url: '/api/url-crawl',
          payload: { url: 'https://example.com/gallery' },
        });
      }

      // 11th request should be rate limited
      const response = await app.inject({
        method: 'POST',
        url: '/api/url-crawl',
        payload: { url: 'https://example.com/gallery' },
      });

      expect(response.statusCode).toBe(429);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Too Many Requests');
      expect(response.headers['x-ratelimit-limit']).toBe('10');
      expect(response.headers['x-ratelimit-remaining']).toBe('0');
    });
  });

  describe('GET /api/url-crawl/:sessionId', () => {
    it('should return session info and images', async () => {
      const mockSession = createMockSession();
      vi.mocked(mockSessionManager.getSession).mockReturnValue(mockSession);

      const response = await app.inject({
        method: 'GET',
        url: '/api/url-crawl/test-session-id',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as GetSessionResponse;
      expect(body.sessionId).toBe('test-session-id');
      expect(body.sourceUrl).toBe('https://example.com/gallery');
      expect(body.pageTitle).toBe('Test Gallery');
      expect(body.imageCount).toBe(3);
      expect(body.images).toHaveLength(3);
      expect(body.images[0]).toEqual({
        index: 0,
        url: 'https://example.com/image1.jpg',
        filename: 'image1.jpg',
        alt: 'Image 1',
      });
    });

    it('should return 404 when session not found', async () => {
      vi.mocked(mockSessionManager.getSession).mockReturnValue(undefined);

      const response = await app.inject({
        method: 'GET',
        url: '/api/url-crawl/non-existent-session',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Not Found');
      expect(body.message).toBe('Crawl session not found');
    });
  });

  describe('GET /api/url-crawl/:sessionId/images/:imageIndex/thumbnail', () => {
    it('should return thumbnail successfully', async () => {
      const mockSession = createMockSession();
      const mockImageBuffer = Buffer.from('fake image data');
      const mockThumbnailBuffer = Buffer.from('fake thumbnail data');

      vi.mocked(mockSessionManager.getSession).mockReturnValue(mockSession);
      vi.mocked(mockSessionManager.fetchImage).mockResolvedValue({
        data: mockImageBuffer,
        contentType: 'image/jpeg',
      });
      vi.mocked(mockImageProcessor.generateThumbnail).mockResolvedValue(mockThumbnailBuffer);

      const response = await app.inject({
        method: 'GET',
        url: '/api/url-crawl/test-session-id/images/0/thumbnail',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('image/jpeg');
      expect(response.headers['cache-control']).toBe('private, max-age=3600');
      expect(response.rawPayload).toEqual(mockThumbnailBuffer);
    });

    it('should return 400 for invalid image index', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/url-crawl/test-session-id/images/abc/thumbnail',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toBe('Invalid image index');
    });

    it('should return 404 when session not found', async () => {
      vi.mocked(mockSessionManager.getSession).mockReturnValue(undefined);

      const response = await app.inject({
        method: 'GET',
        url: '/api/url-crawl/non-existent-session/images/0/thumbnail',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Not Found');
      expect(body.message).toBe('Crawl session not found');
    });

    it('should return 404 when image not found in session', async () => {
      const mockSession = createMockSession();
      vi.mocked(mockSessionManager.getSession).mockReturnValue(mockSession);

      const response = await app.inject({
        method: 'GET',
        url: '/api/url-crawl/test-session-id/images/99/thumbnail',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Not Found');
      expect(body.message).toBe('Image not found in session');
    });

    it('should return 502 when fetch fails', async () => {
      const mockSession = createMockSession();
      vi.mocked(mockSessionManager.getSession).mockReturnValue(mockSession);
      vi.mocked(mockSessionManager.fetchImage).mockRejectedValue(new Error('Network error'));

      const response = await app.inject({
        method: 'GET',
        url: '/api/url-crawl/test-session-id/images/0/thumbnail',
      });

      expect(response.statusCode).toBe(502);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Gateway');
      expect(body.message).toBe('Failed to fetch image from source');
    });
  });

  describe('GET /api/url-crawl/:sessionId/images/:imageIndex/file', () => {
    it('should return full-size image successfully', async () => {
      const mockSession = createMockSession();
      const mockImageBuffer = Buffer.from('fake image data');

      vi.mocked(mockSessionManager.getSession).mockReturnValue(mockSession);
      vi.mocked(mockSessionManager.fetchImage).mockResolvedValue({
        data: mockImageBuffer,
        contentType: 'image/png',
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/url-crawl/test-session-id/images/1/file',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('image/png');
      expect(response.headers['cache-control']).toBe('private, max-age=3600');
      expect(response.rawPayload).toEqual(mockImageBuffer);
    });

    it('should return 400 for invalid image index', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/url-crawl/test-session-id/images/xyz/file',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toBe('Invalid image index');
    });

    it('should return 404 when session not found', async () => {
      vi.mocked(mockSessionManager.getSession).mockReturnValue(undefined);

      const response = await app.inject({
        method: 'GET',
        url: '/api/url-crawl/non-existent-session/images/0/file',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Not Found');
      expect(body.message).toBe('Crawl session not found');
    });

    it('should return 404 when image not found in session', async () => {
      const mockSession = createMockSession();
      vi.mocked(mockSessionManager.getSession).mockReturnValue(mockSession);

      const response = await app.inject({
        method: 'GET',
        url: '/api/url-crawl/test-session-id/images/100/file',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Not Found');
      expect(body.message).toBe('Image not found in session');
    });

    it('should return 502 when fetch fails', async () => {
      const mockSession = createMockSession();
      vi.mocked(mockSessionManager.getSession).mockReturnValue(mockSession);
      vi.mocked(mockSessionManager.fetchImage).mockRejectedValue(new Error('Connection refused'));

      const response = await app.inject({
        method: 'GET',
        url: '/api/url-crawl/test-session-id/images/0/file',
      });

      expect(response.statusCode).toBe(502);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Gateway');
      expect(body.message).toBe('Failed to fetch image from source');
    });
  });

  describe('POST /api/url-crawl/:sessionId/import', () => {
    it('should import selected images successfully', async () => {
      const mockSession = createMockSession();
      vi.mocked(mockSessionManager.getSession).mockReturnValue(mockSession);
      vi.mocked(importFromUrlCrawl).mockResolvedValue({
        totalRequested: 2,
        successCount: 2,
        failedCount: 0,
        results: [
          { index: 0, success: true, image: createMockImageEntity('image-1') },
          { index: 1, success: true, image: createMockImageEntity('image-2') },
        ],
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/url-crawl/test-session-id/import',
        payload: { indices: [0, 1] },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as ImportResponse;
      expect(body.totalRequested).toBe(2);
      expect(body.successCount).toBe(2);
      expect(body.failedCount).toBe(0);
      expect(body.results).toHaveLength(2);
      expect(body.results[0]?.imageId).toBe('image-1');
    });

    it('should return 400 when indices is not an array', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/url-crawl/test-session-id/import',
        payload: { indices: 'not-an-array' },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toBe('indices must be a non-empty array of numbers');
    });

    it('should return 400 when indices is empty', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/url-crawl/test-session-id/import',
        payload: { indices: [] },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toBe('indices must be a non-empty array of numbers');
    });

    it('should return 400 when indices contains non-integer', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/url-crawl/test-session-id/import',
        payload: { indices: [0, 1.5, 2] },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toBe('All indices must be non-negative integers');
    });

    it('should return 400 when indices contains negative number', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/url-crawl/test-session-id/import',
        payload: { indices: [0, -1, 2] },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toBe('All indices must be non-negative integers');
    });

    it('should return 400 when indices contains non-number', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/url-crawl/test-session-id/import',
        payload: { indices: [0, 'a', 2] },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toBe('All indices must be non-negative integers');
    });

    it('should return 404 when session not found', async () => {
      vi.mocked(mockSessionManager.getSession).mockReturnValue(undefined);

      const response = await app.inject({
        method: 'POST',
        url: '/api/url-crawl/non-existent-session/import',
        payload: { indices: [0] },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Not Found');
      expect(body.message).toBe('Crawl session not found');
    });

    it('should return 500 when import fails', async () => {
      const mockSession = createMockSession();
      vi.mocked(mockSessionManager.getSession).mockReturnValue(mockSession);
      vi.mocked(importFromUrlCrawl).mockRejectedValue(new Error('Import failed'));

      const response = await app.inject({
        method: 'POST',
        url: '/api/url-crawl/test-session-id/import',
        payload: { indices: [0] },
      });

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Internal Server Error');
      expect(body.message).toBe('Failed to import images');
    });

    it('should pass correct dependencies to importFromUrlCrawl', async () => {
      const mockSession = createMockSession();
      vi.mocked(mockSessionManager.getSession).mockReturnValue(mockSession);
      vi.mocked(importFromUrlCrawl).mockResolvedValue({
        totalRequested: 1,
        successCount: 1,
        failedCount: 0,
        results: [{ index: 0, success: true, image: createMockImageEntity('image-1') }],
      });

      await app.inject({
        method: 'POST',
        url: '/api/url-crawl/test-session-id/import',
        payload: { indices: [0] },
      });

      expect(importFromUrlCrawl).toHaveBeenCalledWith(
        { sessionId: 'test-session-id', indices: [0] },
        {
          urlCrawlSessionManager: mockSessionManager,
          imageRepository: mockImageRepository,
          fileStorage: mockFileStorage,
          imageProcessor: mockImageProcessor,
        },
      );
    });

    it('should handle partial import success', async () => {
      const mockSession = createMockSession();
      vi.mocked(mockSessionManager.getSession).mockReturnValue(mockSession);
      vi.mocked(importFromUrlCrawl).mockResolvedValue({
        totalRequested: 3,
        successCount: 2,
        failedCount: 1,
        results: [
          { index: 0, success: true, image: createMockImageEntity('image-1') },
          { index: 1, success: false, error: 'Failed to fetch' },
          { index: 2, success: true, image: createMockImageEntity('image-2') },
        ],
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/url-crawl/test-session-id/import',
        payload: { indices: [0, 1, 2] },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as ImportResponse;
      expect(body.totalRequested).toBe(3);
      expect(body.successCount).toBe(2);
      expect(body.failedCount).toBe(1);
      expect(body.results[1]?.success).toBe(false);
      expect(body.results[1]?.error).toBe('Failed to fetch');
    });

    it('should return 429 when rate limit exceeded', async () => {
      const mockSession = createMockSession();
      vi.mocked(mockSessionManager.getSession).mockReturnValue(mockSession);
      vi.mocked(importFromUrlCrawl).mockResolvedValue({
        totalRequested: 1,
        successCount: 1,
        failedCount: 0,
        results: [{ index: 0, success: true, image: createMockImageEntity('image-1') }],
      });

      // Make 20 requests (the import rate limit)
      for (let i = 0; i < 20; i++) {
        await app.inject({
          method: 'POST',
          url: '/api/url-crawl/test-session-id/import',
          payload: { indices: [0] },
        });
      }

      // 21st request should be rate limited
      const response = await app.inject({
        method: 'POST',
        url: '/api/url-crawl/test-session-id/import',
        payload: { indices: [0] },
      });

      expect(response.statusCode).toBe(429);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Too Many Requests');
      expect(response.headers['x-ratelimit-limit']).toBe('20');
    });
  });

  describe('DELETE /api/url-crawl/:sessionId', () => {
    it('should delete session successfully', async () => {
      vi.mocked(mockSessionManager.deleteSession).mockResolvedValue();

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/url-crawl/test-session-id',
      });

      expect(response.statusCode).toBe(204);
      expect(response.body).toBe('');
      expect(mockSessionManager.deleteSession).toHaveBeenCalledWith('test-session-id');
    });

    it('should return 204 even when session does not exist', async () => {
      vi.mocked(mockSessionManager.deleteSession).mockResolvedValue();

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/url-crawl/non-existent-session',
      });

      expect(response.statusCode).toBe(204);
      expect(mockSessionManager.deleteSession).toHaveBeenCalledWith('non-existent-session');
    });
  });

  describe('RateLimiter behavior', () => {
    it('crawl and import have separate rate limits', async () => {
      const mockSession = createMockSession();
      vi.mocked(mockSessionManager.createSession).mockResolvedValue({
        success: true,
        session: mockSession,
      });
      vi.mocked(mockSessionManager.getSession).mockReturnValue(mockSession);
      vi.mocked(importFromUrlCrawl).mockResolvedValue({
        totalRequested: 1,
        successCount: 1,
        failedCount: 0,
        results: [{ index: 0, success: true, image: createMockImageEntity('image-1') }],
      });

      // Exhaust crawl rate limit (10 requests)
      for (let i = 0; i < 10; i++) {
        await app.inject({
          method: 'POST',
          url: '/api/url-crawl',
          payload: { url: 'https://example.com/gallery' },
        });
      }

      // Crawl should be rate limited
      const crawlResponse = await app.inject({
        method: 'POST',
        url: '/api/url-crawl',
        payload: { url: 'https://example.com/gallery' },
      });
      expect(crawlResponse.statusCode).toBe(429);

      // But import should still work (separate limit)
      const importResponse = await app.inject({
        method: 'POST',
        url: '/api/url-crawl/test-session-id/import',
        payload: { indices: [0] },
      });
      expect(importResponse.statusCode).toBe(200);
    });
  });
});
