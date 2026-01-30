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
  Image,
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

function createImage(id: string, overrides: Partial<Image> = {}): Image {
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

const VALID_PAYLOAD = {
  path: 'originals/test.jpg',
  thumbnailPath: 'thumbnails/test.jpg',
  mimeType: 'image/jpeg',
  size: 2048,
  width: 800,
  height: 600,
};

describe('ImageController - POST /api/images/from-local', () => {
  let app: FastifyInstance;
  let mockImageRepository: ImageRepository;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockImageRepository = createMockImageRepository();

    const controller = new ImageController(
      mockImageRepository,
      createMockFileStorage(),
      createMockImageProcessor(),
      createMockEmbeddingService(),
      createMockEmbeddingRepository(),
    );

    app = Fastify({ logger: false });
    controller.registerRoutes(app);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should create image record from local file metadata', async () => {
    const createdImage = createImage('new-id');
    vi.mocked(mockImageRepository.create).mockResolvedValue(createdImage);

    const response = await app.inject({
      method: 'POST',
      url: '/api/images/from-local',
      headers: { 'Content-Type': 'application/json' },
      payload: VALID_PAYLOAD,
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body) as ImageResponse;
    expect(body.id).toBe('new-id');
    expect(mockImageRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'originals/test.jpg',
        thumbnailPath: 'thumbnails/test.jpg',
        mimeType: 'image/jpeg',
        size: 2048,
        width: 800,
        height: 600,
      }),
    );
  });

  it('should return 400 when path is empty', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/images/from-local',
      headers: { 'Content-Type': 'application/json' },
      payload: { ...VALID_PAYLOAD, path: '' },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body) as ErrorResponse;
    expect(body.error).toBe('Bad Request');
  });

  it('should return 400 when thumbnailPath is empty', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/images/from-local',
      headers: { 'Content-Type': 'application/json' },
      payload: { ...VALID_PAYLOAD, thumbnailPath: '' },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body) as ErrorResponse;
    expect(body.error).toBe('Bad Request');
  });

  it('should return 400 when mimeType is empty', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/images/from-local',
      headers: { 'Content-Type': 'application/json' },
      payload: { ...VALID_PAYLOAD, mimeType: '' },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body) as ErrorResponse;
    expect(body.error).toBe('Bad Request');
  });

  it('should return 400 when size is zero', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/images/from-local',
      headers: { 'Content-Type': 'application/json' },
      payload: { ...VALID_PAYLOAD, size: 0 },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body) as ErrorResponse;
    expect(body.error).toBe('Bad Request');
    expect(body.message).toContain('positive numbers');
  });

  it('should return 400 when width is negative', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/images/from-local',
      headers: { 'Content-Type': 'application/json' },
      payload: { ...VALID_PAYLOAD, width: -1 },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body) as ErrorResponse;
    expect(body.error).toBe('Bad Request');
  });

  it('should generate title and set createdAt', async () => {
    const createdImage = createImage('new-id');
    vi.mocked(mockImageRepository.create).mockResolvedValue(createdImage);

    await app.inject({
      method: 'POST',
      url: '/api/images/from-local',
      headers: { 'Content-Type': 'application/json' },
      payload: VALID_PAYLOAD,
    });

    expect(mockImageRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.any(String) as string,
        createdAt: expect.any(Date) as Date,
      }),
    );
  });
});
