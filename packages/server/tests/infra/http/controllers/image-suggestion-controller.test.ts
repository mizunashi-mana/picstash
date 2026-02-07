import 'reflect-metadata';
import Fastify, { type FastifyInstance } from 'fastify';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { ImageSuggestionController } from '@/infra/http/controllers/image-suggestion-controller';
import type {
  EmbeddingRepository,
  FileStorage,
  ImageAttributeRepository,
  ImageRepository,
  ImageDetail,
  ImageWithEmbedding,
  JobQueue,
  Job,
  LabelRepository,
} from '@picstash/core';

interface ErrorResponse {
  error: string;
  message?: string;
}

interface SuggestedAttributesResponse {
  suggestions: unknown[];
}

interface JobQueuedResponse {
  jobId: string;
  status: string;
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

function createMockLabelRepository(): LabelRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findByName: vi.fn(),
    findAll: vi.fn(),
    findAllWithEmbedding: vi.fn(),
    findIdsWithoutEmbedding: vi.fn(),
    updateById: vi.fn(),
    deleteById: vi.fn(),
    updateEmbedding: vi.fn(),
    clearAllEmbeddings: vi.fn(),
    countWithEmbedding: vi.fn(),
  };
}

function createMockImageAttributeRepository(): ImageAttributeRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findByImageId: vi.fn(),
    findByImageAndLabel: vi.fn(),
    updateById: vi.fn(),
    deleteById: vi.fn(),
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

function createMockJobQueue(): JobQueue {
  const mockJob: Job = {
    id: 'job-123',
    type: 'caption-generation',
    status: 'waiting',
    payload: { imageId: 'test-id' },
    progress: 0,
    attempts: 0,
    maxAttempts: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  return {
    add: vi.fn().mockResolvedValue(mockJob),
    getJob: vi.fn(),
    listJobs: vi.fn(),
    acquireJob: vi.fn(),
    completeJob: vi.fn(),
    failJob: vi.fn(),
    updateProgress: vi.fn(),
  };
}

function createImage(id: string): ImageDetail {
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
    createdAt: new Date(),
    updatedAt: new Date(),
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

describe('ImageSuggestionController', () => {
  let app: FastifyInstance;
  let mockImageRepository: ImageRepository;
  let mockLabelRepository: LabelRepository;
  let mockImageAttributeRepository: ImageAttributeRepository;
  let mockEmbeddingRepository: EmbeddingRepository;
  let mockFileStorage: FileStorage;
  let mockJobQueue: JobQueue;
  let controller: ImageSuggestionController;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockImageRepository = createMockImageRepository();
    mockLabelRepository = createMockLabelRepository();
    mockImageAttributeRepository = createMockImageAttributeRepository();
    mockEmbeddingRepository = createMockEmbeddingRepository();
    mockFileStorage = createMockFileStorage();
    mockJobQueue = createMockJobQueue();

    // Create controller with mocked dependencies
    controller = new ImageSuggestionController(
      mockImageRepository,
      mockLabelRepository,
      mockImageAttributeRepository,
      mockEmbeddingRepository,
      mockFileStorage,
      mockJobQueue,
    );

    // Create Fastify app and register routes
    app = Fastify({ logger: false });
    controller.registerRoutes(app);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /api/images/:id/suggested-attributes', () => {
    it('should return 404 when image not found', async () => {
      vi.mocked(mockImageRepository.findByIdWithEmbedding).mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: '/api/images/non-existent-id/suggested-attributes',
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
        url: '/api/images/test-id/suggested-attributes',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toContain('embedding');
    });

    it('should return 400 when no labels have embeddings', async () => {
      const embedding = createNormalizedEmbedding();
      const imageWithEmbedding: ImageWithEmbedding = {
        id: 'test-id',
        path: 'originals/test.png',
        embedding,
      };
      vi.mocked(mockImageRepository.findByIdWithEmbedding).mockResolvedValue(imageWithEmbedding);
      vi.mocked(mockLabelRepository.findAllWithEmbedding).mockResolvedValue([]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/images/test-id/suggested-attributes',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toContain('labels');
    });

    it('should return suggested attributes successfully', async () => {
      const embedding = createNormalizedEmbedding();
      const imageWithEmbedding: ImageWithEmbedding = {
        id: 'test-id',
        path: 'originals/test.png',
        embedding,
      };
      vi.mocked(mockImageRepository.findByIdWithEmbedding).mockResolvedValue(imageWithEmbedding);
      vi.mocked(mockLabelRepository.findAllWithEmbedding).mockResolvedValue([
        { id: 'label-1', name: 'Test Label', embedding },
      ]);
      vi.mocked(mockImageAttributeRepository.findByImageId).mockResolvedValue([]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/images/test-id/suggested-attributes',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as SuggestedAttributesResponse;
      expect(body.suggestions).toBeDefined();
    });

    it('should accept custom threshold parameter', async () => {
      const embedding = createNormalizedEmbedding();
      const imageWithEmbedding: ImageWithEmbedding = {
        id: 'test-id',
        path: 'originals/test.png',
        embedding,
      };
      vi.mocked(mockImageRepository.findByIdWithEmbedding).mockResolvedValue(imageWithEmbedding);
      vi.mocked(mockLabelRepository.findAllWithEmbedding).mockResolvedValue([
        { id: 'label-1', name: 'Test Label', embedding },
      ]);
      vi.mocked(mockImageAttributeRepository.findByImageId).mockResolvedValue([]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/images/test-id/suggested-attributes?threshold=0.5',
      });

      expect(response.statusCode).toBe(200);
    });

    it('should accept custom limit parameter', async () => {
      const embedding = createNormalizedEmbedding();
      const imageWithEmbedding: ImageWithEmbedding = {
        id: 'test-id',
        path: 'originals/test.png',
        embedding,
      };
      vi.mocked(mockImageRepository.findByIdWithEmbedding).mockResolvedValue(imageWithEmbedding);
      vi.mocked(mockLabelRepository.findAllWithEmbedding).mockResolvedValue([
        { id: 'label-1', name: 'Test Label', embedding },
      ]);
      vi.mocked(mockImageAttributeRepository.findByImageId).mockResolvedValue([]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/images/test-id/suggested-attributes?limit=5',
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('POST /api/images/:id/generate-description', () => {
    it('should return 404 when image not found', async () => {
      vi.mocked(mockImageRepository.findById).mockResolvedValue(null);

      const response = await app.inject({
        method: 'POST',
        url: '/api/images/non-existent-id/generate-description',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Not Found');
    });

    it('should return 404 when image file not found on disk', async () => {
      const image = createImage('test-id');
      vi.mocked(mockImageRepository.findById).mockResolvedValue(image);
      vi.mocked(mockFileStorage.fileExists).mockResolvedValue(false);

      const response = await app.inject({
        method: 'POST',
        url: '/api/images/test-id/generate-description',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.message).toContain('file not found');
    });

    it('should queue caption generation job successfully', async () => {
      const image = createImage('test-id');
      vi.mocked(mockImageRepository.findById).mockResolvedValue(image);
      vi.mocked(mockFileStorage.fileExists).mockResolvedValue(true);

      const response = await app.inject({
        method: 'POST',
        url: '/api/images/test-id/generate-description',
      });

      expect(response.statusCode).toBe(202);
      const body = JSON.parse(response.body) as JobQueuedResponse;
      expect(body.jobId).toBe('job-123');
      expect(body.status).toBe('queued');
      expect(mockJobQueue.add).toHaveBeenCalledWith('caption-generation', { imageId: 'test-id' });
    });
  });
});
