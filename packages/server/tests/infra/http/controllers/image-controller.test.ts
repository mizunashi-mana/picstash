import 'reflect-metadata';
import Fastify, { type FastifyInstance } from 'fastify';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { ImageController } from '@/infra/http/controllers/image-controller';
import type {
  EmbeddingRepository,
  EmbeddingService,
  FileStorage,
  ImageProcessor,
  ImageRepository,
  ImageDetail,
} from '@picstash/core';

interface ErrorResponse {
  error: string;
  message?: string;
}

interface ImageResponse {
  id: string;
  path: string;
  thumbnailPath: string | null;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedResponse {
  items: ImageResponse[];
  total: number;
  limit: number;
  offset: number;
}

function createMockImageRepository(): ImageRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findByIds: vi.fn(),
    findAll: vi.fn().mockResolvedValue([]),
    findAllPaginated: vi.fn().mockResolvedValue({ items: [], total: 0, limit: 50, offset: 0 }),
    search: vi.fn().mockResolvedValue([]),
    searchPaginated: vi.fn().mockResolvedValue({ items: [], total: 0, limit: 50, offset: 0 }),
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
    saveOriginalFromStream: vi.fn(),
    readFile: vi.fn(),
    readFileAsStream: vi.fn(),
    getFileSize: vi.fn(),
    fileExists: vi.fn().mockResolvedValue(true),
    deleteFile: vi.fn(),
    getAbsolutePath: vi.fn().mockReturnValue('/tmp/test.png'),
  };
}

function createMockImageProcessor(): ImageProcessor {
  return {
    getMetadata: vi.fn(),
    generateThumbnail: vi.fn(),
  };
}

function createMockEmbeddingService(): EmbeddingService {
  return {
    generateFromFile: vi.fn(),
    generateFromBuffer: vi.fn(),
    generateFromText: vi.fn(),
    getDimension: vi.fn().mockReturnValue(512),
    getModel: vi.fn().mockReturnValue('test-model'),
    isReady: vi.fn().mockReturnValue(true),
    initialize: vi.fn(),
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

function createImage(id: string, overrides: Partial<ImageDetail> = {}): ImageDetail {
  return {
    id,
    path: `originals/${id}.png`,
    thumbnailPath: `thumbnails/${id}.jpg`,
    mimeType: 'image/png',
    size: 1024,
    width: 100,
    height: 100,
    title: `Test Image (${id})`,
    description: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  };
}

describe('ImageController', () => {
  let app: FastifyInstance;
  let mockImageRepository: ImageRepository;
  let mockFileStorage: FileStorage;
  let mockImageProcessor: ImageProcessor;
  let mockEmbeddingService: EmbeddingService;
  let mockEmbeddingRepository: EmbeddingRepository;
  let controller: ImageController;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockImageRepository = createMockImageRepository();
    mockFileStorage = createMockFileStorage();
    mockImageProcessor = createMockImageProcessor();
    mockEmbeddingService = createMockEmbeddingService();
    mockEmbeddingRepository = createMockEmbeddingRepository();

    controller = new ImageController(
      mockImageRepository,
      mockFileStorage,
      mockImageProcessor,
      mockEmbeddingService,
      mockEmbeddingRepository,
    );

    app = Fastify({ logger: false });
    controller.registerRoutes(app);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /api/images', () => {
    it('should return all images when no query params', async () => {
      const images = [createImage('img-1'), createImage('img-2')];
      vi.mocked(mockImageRepository.findAll).mockResolvedValue(images);

      const response = await app.inject({
        method: 'GET',
        url: '/api/images',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as ImageResponse[];
      expect(body).toHaveLength(2);
      expect(mockImageRepository.findAll).toHaveBeenCalled();
    });

    it('should return search results when query provided', async () => {
      const images = [createImage('img-1')];
      vi.mocked(mockImageRepository.search).mockResolvedValue(images);

      const response = await app.inject({
        method: 'GET',
        url: '/api/images?q=test',
      });

      expect(response.statusCode).toBe(200);
      expect(mockImageRepository.search).toHaveBeenCalledWith('test');
    });

    it('should return paginated results when limit provided', async () => {
      const paginatedResult = {
        items: [createImage('img-1')],
        total: 10,
        limit: 5,
        offset: 0,
      };
      vi.mocked(mockImageRepository.findAllPaginated).mockResolvedValue(paginatedResult);

      const response = await app.inject({
        method: 'GET',
        url: '/api/images?limit=5',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as PaginatedResponse;
      expect(body.total).toBe(10);
      expect(body.limit).toBe(5);
      expect(mockImageRepository.findAllPaginated).toHaveBeenCalledWith({ limit: 5, offset: 0 });
    });

    it('should return paginated search results when query and limit provided', async () => {
      const paginatedResult = {
        items: [createImage('img-1')],
        total: 5,
        limit: 10,
        offset: 0,
      };
      vi.mocked(mockImageRepository.searchPaginated).mockResolvedValue(paginatedResult);

      const response = await app.inject({
        method: 'GET',
        url: '/api/images?q=test&limit=10&offset=0',
      });

      expect(response.statusCode).toBe(200);
      expect(mockImageRepository.searchPaginated).toHaveBeenCalledWith('test', { limit: 10, offset: 0 });
    });

    it('should clamp limit to max 100', async () => {
      const paginatedResult = {
        items: [],
        total: 0,
        limit: 100,
        offset: 0,
      };
      vi.mocked(mockImageRepository.findAllPaginated).mockResolvedValue(paginatedResult);

      const response = await app.inject({
        method: 'GET',
        url: '/api/images?limit=200',
      });

      expect(response.statusCode).toBe(200);
      expect(mockImageRepository.findAllPaginated).toHaveBeenCalledWith({ limit: 100, offset: 0 });
    });
  });

  describe('GET /api/images/:id', () => {
    it('should return image metadata when found', async () => {
      const image = createImage('test-id');
      vi.mocked(mockImageRepository.findById).mockResolvedValue(image);

      const response = await app.inject({
        method: 'GET',
        url: '/api/images/test-id',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as ImageResponse;
      expect(body.id).toBe('test-id');
    });

    it('should return 404 when image not found', async () => {
      vi.mocked(mockImageRepository.findById).mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: '/api/images/non-existent',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Not Found');
    });
  });

  describe('GET /api/images/:id/file', () => {
    it('should return 404 when image not found', async () => {
      vi.mocked(mockImageRepository.findById).mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: '/api/images/non-existent/file',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Not Found');
    });

    it('should return 404 when file not found on disk', async () => {
      const image = createImage('test-id');
      vi.mocked(mockImageRepository.findById).mockResolvedValue(image);
      vi.mocked(mockFileStorage.fileExists).mockResolvedValue(false);

      const response = await app.inject({
        method: 'GET',
        url: '/api/images/test-id/file',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.message).toContain('file not found');
    });
  });

  describe('GET /api/images/:id/thumbnail', () => {
    it('should return 404 when image not found', async () => {
      vi.mocked(mockImageRepository.findById).mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: '/api/images/non-existent/thumbnail',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Not Found');
    });

    it('should return 404 when thumbnail file not found on disk', async () => {
      const image = createImage('test-id');
      vi.mocked(mockImageRepository.findById).mockResolvedValue(image);
      vi.mocked(mockFileStorage.fileExists).mockResolvedValue(false);

      const response = await app.inject({
        method: 'GET',
        url: '/api/images/test-id/thumbnail',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.message).toContain('Thumbnail file not found');
    });
  });

  describe('PATCH /api/images/:id', () => {
    it('should update image description', async () => {
      const image = createImage('test-id');
      const updatedImage = createImage('test-id', { description: 'New description' });
      vi.mocked(mockImageRepository.findById).mockResolvedValue(image);
      vi.mocked(mockImageRepository.updateById).mockResolvedValue(updatedImage);

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/images/test-id',
        headers: { 'Content-Type': 'application/json' },
        payload: { description: 'New description' },
      });

      expect(response.statusCode).toBe(200);
      expect(mockImageRepository.updateById).toHaveBeenCalledWith(
        'test-id',
        expect.objectContaining({ description: 'New description' }),
      );
    });

    it('should return 404 when image not found', async () => {
      vi.mocked(mockImageRepository.findById).mockResolvedValue(null);

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/images/non-existent',
        headers: { 'Content-Type': 'application/json' },
        payload: { description: 'New description' },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Not Found');
    });

    it('should allow setting description to null', async () => {
      const image = createImage('test-id', { description: 'Old description' });
      const updatedImage = createImage('test-id', { description: null });
      vi.mocked(mockImageRepository.findById).mockResolvedValue(image);
      vi.mocked(mockImageRepository.updateById).mockResolvedValue(updatedImage);

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/images/test-id',
        headers: { 'Content-Type': 'application/json' },
        payload: { description: null },
      });

      expect(response.statusCode).toBe(200);
      expect(mockImageRepository.updateById).toHaveBeenCalledWith(
        'test-id',
        expect.objectContaining({ description: null }),
      );
    });
  });

  describe('DELETE /api/images/:id', () => {
    it('should delete image and return 204', async () => {
      const image = createImage('test-id');
      vi.mocked(mockImageRepository.findById).mockResolvedValue(image);
      vi.mocked(mockImageRepository.deleteById).mockResolvedValue(image);
      vi.mocked(mockFileStorage.deleteFile).mockResolvedValue(undefined);
      vi.mocked(mockEmbeddingRepository.remove).mockResolvedValue(undefined);

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/images/test-id',
      });

      expect(response.statusCode).toBe(204);
    });

    it('should return 404 when image not found', async () => {
      vi.mocked(mockImageRepository.findById).mockResolvedValue(null);

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/images/non-existent',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Not Found');
    });
  });
});
