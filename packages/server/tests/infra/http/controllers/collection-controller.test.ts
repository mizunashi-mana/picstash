import 'reflect-metadata';
import Fastify, { type FastifyInstance } from 'fastify';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { CollectionController } from '@/infra/http/controllers/collection-controller';
import { Prisma } from '@~generated/prisma/client.js';
import type {
  CollectionRepository,
  CollectionEntity,
  CollectionListItem,
  CollectionDetail,
  CollectionImage,
} from '@picstash/core';

interface ErrorResponse {
  error: string;
  message?: string;
}

function createMockCollectionRepository(): CollectionRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findByIdWithImages: vi.fn(),
    findAll: vi.fn().mockResolvedValue([]),
    updateById: vi.fn(),
    deleteById: vi.fn(),
    addImage: vi.fn(),
    removeImage: vi.fn(),
    updateImageOrder: vi.fn(),
    findCollectionsByImageId: vi.fn().mockResolvedValue([]),
  };
}

function createCollectionEntity(id: string, overrides: Partial<CollectionEntity> = {}): CollectionEntity {
  return {
    id,
    name: `Test Collection (${id})`,
    description: null,
    coverImageId: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  };
}

function createCollectionListItem(id: string, overrides: Partial<CollectionListItem> = {}): CollectionListItem {
  return {
    id,
    name: `Test Collection (${id})`,
    description: null,
    coverImageId: null,
    imageCount: 0,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  };
}

function createCollectionDetail(id: string, overrides: Partial<CollectionDetail> = {}): CollectionDetail {
  return {
    id,
    name: `Test Collection (${id})`,
    description: null,
    coverImageId: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    images: [],
    ...overrides,
  };
}

function createCollectionImage(id: string, collectionId: string, imageId: string, overrides: Partial<CollectionImage> = {}): CollectionImage {
  return {
    id,
    collectionId,
    imageId,
    order: 0,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  };
}

describe('CollectionController', () => {
  let app: FastifyInstance;
  let mockCollectionRepository: CollectionRepository;
  let controller: CollectionController;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockCollectionRepository = createMockCollectionRepository();

    controller = new CollectionController(mockCollectionRepository);

    app = Fastify({ logger: false });
    controller.registerRoutes(app);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /api/collections', () => {
    it('should return empty array when no collections exist', async () => {
      vi.mocked(mockCollectionRepository.findAll).mockResolvedValue([]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/collections',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as CollectionListItem[];
      expect(body).toHaveLength(0);
      expect(mockCollectionRepository.findAll).toHaveBeenCalled();
    });

    it('should return all collections', async () => {
      const collections = [
        createCollectionListItem('col-1', { imageCount: 5 }),
        createCollectionListItem('col-2', { imageCount: 10 }),
      ];
      vi.mocked(mockCollectionRepository.findAll).mockResolvedValue(collections);

      const response = await app.inject({
        method: 'GET',
        url: '/api/collections',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as CollectionListItem[];
      expect(body).toHaveLength(2);
      expect(body[0]?.id).toBe('col-1');
      expect(body[1]?.id).toBe('col-2');
    });
  });

  describe('POST /api/collections', () => {
    it('should create a new collection successfully', async () => {
      const createdCollection = createCollectionEntity('new-col', { name: 'New Collection' });
      vi.mocked(mockCollectionRepository.create).mockResolvedValue(createdCollection);

      const response = await app.inject({
        method: 'POST',
        url: '/api/collections',
        headers: { 'Content-Type': 'application/json' },
        payload: { name: 'New Collection' },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body) as CollectionEntity;
      expect(body.id).toBe('new-col');
      expect(body.name).toBe('New Collection');
      expect(mockCollectionRepository.create).toHaveBeenCalledWith({
        name: 'New Collection',
        description: undefined,
        coverImageId: undefined,
      });
    });

    it('should create a collection with description and coverImageId', async () => {
      const createdCollection = createCollectionEntity('new-col', {
        name: 'New Collection',
        description: 'Test description',
        coverImageId: 'cover-img-1',
      });
      vi.mocked(mockCollectionRepository.create).mockResolvedValue(createdCollection);

      const response = await app.inject({
        method: 'POST',
        url: '/api/collections',
        headers: { 'Content-Type': 'application/json' },
        payload: {
          name: 'New Collection',
          description: 'Test description',
          coverImageId: 'cover-img-1',
        },
      });

      expect(response.statusCode).toBe(201);
      expect(mockCollectionRepository.create).toHaveBeenCalledWith({
        name: 'New Collection',
        description: 'Test description',
        coverImageId: 'cover-img-1',
      });
    });

    it('should return 400 when name is empty', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/collections',
        headers: { 'Content-Type': 'application/json' },
        payload: { name: '' },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toContain('name is required');
    });

    it('should return 400 when name is whitespace only', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/collections',
        headers: { 'Content-Type': 'application/json' },
        payload: { name: '   ' },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
    });

    it('should trim whitespace from name', async () => {
      const createdCollection = createCollectionEntity('new-col', { name: 'Trimmed Name' });
      vi.mocked(mockCollectionRepository.create).mockResolvedValue(createdCollection);

      const response = await app.inject({
        method: 'POST',
        url: '/api/collections',
        headers: { 'Content-Type': 'application/json' },
        payload: { name: '  Trimmed Name  ' },
      });

      expect(response.statusCode).toBe(201);
      expect(mockCollectionRepository.create).toHaveBeenCalledWith({
        name: 'Trimmed Name',
        description: undefined,
        coverImageId: undefined,
      });
    });
  });

  describe('GET /api/collections/:id', () => {
    it('should return collection with images when found', async () => {
      const collectionDetail = createCollectionDetail('col-1', {
        name: 'Test Collection',
        images: [
          { id: 'ci-1', imageId: 'img-1', order: 0, title: 'Image 1', path: 'img-1.jpg', thumbnailPath: 'thumb-1.jpg' },
          { id: 'ci-2', imageId: 'img-2', order: 1, title: 'Image 2', path: 'img-2.jpg', thumbnailPath: 'thumb-2.jpg' },
        ],
      });
      vi.mocked(mockCollectionRepository.findByIdWithImages).mockResolvedValue(collectionDetail);

      const response = await app.inject({
        method: 'GET',
        url: '/api/collections/col-1',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as CollectionDetail;
      expect(body.id).toBe('col-1');
      expect(body.images).toHaveLength(2);
      expect(mockCollectionRepository.findByIdWithImages).toHaveBeenCalledWith('col-1');
    });

    it('should return 404 when collection not found', async () => {
      vi.mocked(mockCollectionRepository.findByIdWithImages).mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: '/api/collections/non-existent',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Not Found');
      expect(body.message).toContain('Collection not found');
    });
  });

  describe('PUT /api/collections/:id', () => {
    it('should update collection name', async () => {
      const existingCollection = createCollectionEntity('col-1');
      const updatedCollection = createCollectionEntity('col-1', { name: 'Updated Name' });
      vi.mocked(mockCollectionRepository.findById).mockResolvedValue(existingCollection);
      vi.mocked(mockCollectionRepository.updateById).mockResolvedValue(updatedCollection);

      const response = await app.inject({
        method: 'PUT',
        url: '/api/collections/col-1',
        headers: { 'Content-Type': 'application/json' },
        payload: { name: 'Updated Name' },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as CollectionEntity;
      expect(body.name).toBe('Updated Name');
      expect(mockCollectionRepository.updateById).toHaveBeenCalledWith('col-1', {
        name: 'Updated Name',
        description: undefined,
        coverImageId: undefined,
      });
    });

    it('should update collection description', async () => {
      const existingCollection = createCollectionEntity('col-1');
      const updatedCollection = createCollectionEntity('col-1', { description: 'New Description' });
      vi.mocked(mockCollectionRepository.findById).mockResolvedValue(existingCollection);
      vi.mocked(mockCollectionRepository.updateById).mockResolvedValue(updatedCollection);

      const response = await app.inject({
        method: 'PUT',
        url: '/api/collections/col-1',
        headers: { 'Content-Type': 'application/json' },
        payload: { description: 'New Description' },
      });

      expect(response.statusCode).toBe(200);
      expect(mockCollectionRepository.updateById).toHaveBeenCalledWith('col-1', {
        name: undefined,
        description: 'New Description',
        coverImageId: undefined,
      });
    });

    it('should update coverImageId', async () => {
      const existingCollection = createCollectionEntity('col-1');
      const updatedCollection = createCollectionEntity('col-1', { coverImageId: 'new-cover' });
      vi.mocked(mockCollectionRepository.findById).mockResolvedValue(existingCollection);
      vi.mocked(mockCollectionRepository.updateById).mockResolvedValue(updatedCollection);

      const response = await app.inject({
        method: 'PUT',
        url: '/api/collections/col-1',
        headers: { 'Content-Type': 'application/json' },
        payload: { coverImageId: 'new-cover' },
      });

      expect(response.statusCode).toBe(200);
      expect(mockCollectionRepository.updateById).toHaveBeenCalledWith('col-1', {
        name: undefined,
        description: undefined,
        coverImageId: 'new-cover',
      });
    });

    it('should allow setting description to null', async () => {
      const existingCollection = createCollectionEntity('col-1', { description: 'Old description' });
      const updatedCollection = createCollectionEntity('col-1', { description: null });
      vi.mocked(mockCollectionRepository.findById).mockResolvedValue(existingCollection);
      vi.mocked(mockCollectionRepository.updateById).mockResolvedValue(updatedCollection);

      const response = await app.inject({
        method: 'PUT',
        url: '/api/collections/col-1',
        headers: { 'Content-Type': 'application/json' },
        payload: { description: null },
      });

      expect(response.statusCode).toBe(200);
      expect(mockCollectionRepository.updateById).toHaveBeenCalledWith('col-1', {
        name: undefined,
        description: null,
        coverImageId: undefined,
      });
    });

    it('should allow setting coverImageId to null', async () => {
      const existingCollection = createCollectionEntity('col-1', { coverImageId: 'old-cover' });
      const updatedCollection = createCollectionEntity('col-1', { coverImageId: null });
      vi.mocked(mockCollectionRepository.findById).mockResolvedValue(existingCollection);
      vi.mocked(mockCollectionRepository.updateById).mockResolvedValue(updatedCollection);

      const response = await app.inject({
        method: 'PUT',
        url: '/api/collections/col-1',
        headers: { 'Content-Type': 'application/json' },
        payload: { coverImageId: null },
      });

      expect(response.statusCode).toBe(200);
      expect(mockCollectionRepository.updateById).toHaveBeenCalledWith('col-1', {
        name: undefined,
        description: undefined,
        coverImageId: null,
      });
    });

    it('should return 404 when collection not found', async () => {
      vi.mocked(mockCollectionRepository.findById).mockResolvedValue(null);

      const response = await app.inject({
        method: 'PUT',
        url: '/api/collections/non-existent',
        headers: { 'Content-Type': 'application/json' },
        payload: { name: 'Updated Name' },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Not Found');
      expect(body.message).toContain('Collection not found');
    });

    it('should return 400 when name is empty string', async () => {
      const existingCollection = createCollectionEntity('col-1');
      vi.mocked(mockCollectionRepository.findById).mockResolvedValue(existingCollection);

      const response = await app.inject({
        method: 'PUT',
        url: '/api/collections/col-1',
        headers: { 'Content-Type': 'application/json' },
        payload: { name: '' },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toContain('cannot be empty');
    });

    it('should return 400 when name is whitespace only', async () => {
      const existingCollection = createCollectionEntity('col-1');
      vi.mocked(mockCollectionRepository.findById).mockResolvedValue(existingCollection);

      const response = await app.inject({
        method: 'PUT',
        url: '/api/collections/col-1',
        headers: { 'Content-Type': 'application/json' },
        payload: { name: '   ' },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
    });

    it('should trim whitespace from name', async () => {
      const existingCollection = createCollectionEntity('col-1');
      const updatedCollection = createCollectionEntity('col-1', { name: 'Trimmed' });
      vi.mocked(mockCollectionRepository.findById).mockResolvedValue(existingCollection);
      vi.mocked(mockCollectionRepository.updateById).mockResolvedValue(updatedCollection);

      const response = await app.inject({
        method: 'PUT',
        url: '/api/collections/col-1',
        headers: { 'Content-Type': 'application/json' },
        payload: { name: '  Trimmed  ' },
      });

      expect(response.statusCode).toBe(200);
      expect(mockCollectionRepository.updateById).toHaveBeenCalledWith('col-1', {
        name: 'Trimmed',
        description: undefined,
        coverImageId: undefined,
      });
    });
  });

  describe('DELETE /api/collections/:id', () => {
    it('should delete collection and return 204', async () => {
      const existingCollection = createCollectionEntity('col-1');
      vi.mocked(mockCollectionRepository.findById).mockResolvedValue(existingCollection);
      vi.mocked(mockCollectionRepository.deleteById).mockResolvedValue(existingCollection);

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/collections/col-1',
      });

      expect(response.statusCode).toBe(204);
      expect(mockCollectionRepository.deleteById).toHaveBeenCalledWith('col-1');
    });

    it('should return 404 when collection not found', async () => {
      vi.mocked(mockCollectionRepository.findById).mockResolvedValue(null);

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/collections/non-existent',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Not Found');
      expect(body.message).toContain('Collection not found');
    });
  });

  describe('POST /api/collections/:id/images', () => {
    it('should add image to collection successfully', async () => {
      const existingCollection = createCollectionEntity('col-1');
      const collectionImage = createCollectionImage('ci-1', 'col-1', 'img-1');
      vi.mocked(mockCollectionRepository.findById).mockResolvedValue(existingCollection);
      vi.mocked(mockCollectionRepository.addImage).mockResolvedValue(collectionImage);

      const response = await app.inject({
        method: 'POST',
        url: '/api/collections/col-1/images',
        headers: { 'Content-Type': 'application/json' },
        payload: { imageId: 'img-1' },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body) as CollectionImage;
      expect(body.collectionId).toBe('col-1');
      expect(body.imageId).toBe('img-1');
      expect(mockCollectionRepository.addImage).toHaveBeenCalledWith('col-1', {
        imageId: 'img-1',
        order: undefined,
      });
    });

    it('should add image with custom order', async () => {
      const existingCollection = createCollectionEntity('col-1');
      const collectionImage = createCollectionImage('ci-1', 'col-1', 'img-1', { order: 5 });
      vi.mocked(mockCollectionRepository.findById).mockResolvedValue(existingCollection);
      vi.mocked(mockCollectionRepository.addImage).mockResolvedValue(collectionImage);

      const response = await app.inject({
        method: 'POST',
        url: '/api/collections/col-1/images',
        headers: { 'Content-Type': 'application/json' },
        payload: { imageId: 'img-1', order: 5 },
      });

      expect(response.statusCode).toBe(201);
      expect(mockCollectionRepository.addImage).toHaveBeenCalledWith('col-1', {
        imageId: 'img-1',
        order: 5,
      });
    });

    it('should return 404 when collection not found', async () => {
      vi.mocked(mockCollectionRepository.findById).mockResolvedValue(null);

      const response = await app.inject({
        method: 'POST',
        url: '/api/collections/non-existent/images',
        headers: { 'Content-Type': 'application/json' },
        payload: { imageId: 'img-1' },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Not Found');
      expect(body.message).toContain('Collection not found');
    });

    it('should return 400 when imageId is empty', async () => {
      const existingCollection = createCollectionEntity('col-1');
      vi.mocked(mockCollectionRepository.findById).mockResolvedValue(existingCollection);

      const response = await app.inject({
        method: 'POST',
        url: '/api/collections/col-1/images',
        headers: { 'Content-Type': 'application/json' },
        payload: { imageId: '' },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toContain('Image ID is required');
    });

    it('should return 400 when imageId is whitespace only', async () => {
      const existingCollection = createCollectionEntity('col-1');
      vi.mocked(mockCollectionRepository.findById).mockResolvedValue(existingCollection);

      const response = await app.inject({
        method: 'POST',
        url: '/api/collections/col-1/images',
        headers: { 'Content-Type': 'application/json' },
        payload: { imageId: '   ' },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
    });

    it('should return 409 when image is already in collection', async () => {
      const existingCollection = createCollectionEntity('col-1');
      vi.mocked(mockCollectionRepository.findById).mockResolvedValue(existingCollection);

      const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '5.0.0',
      });
      vi.mocked(mockCollectionRepository.addImage).mockRejectedValue(prismaError);

      const response = await app.inject({
        method: 'POST',
        url: '/api/collections/col-1/images',
        headers: { 'Content-Type': 'application/json' },
        payload: { imageId: 'img-1' },
      });

      expect(response.statusCode).toBe(409);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Conflict');
      expect(body.message).toContain('already in this collection');
    });

    it('should rethrow non-P2002 Prisma errors', async () => {
      const existingCollection = createCollectionEntity('col-1');
      vi.mocked(mockCollectionRepository.findById).mockResolvedValue(existingCollection);

      const prismaError = new Prisma.PrismaClientKnownRequestError('Foreign key constraint failed', {
        code: 'P2003',
        clientVersion: '5.0.0',
      });
      vi.mocked(mockCollectionRepository.addImage).mockRejectedValue(prismaError);

      const response = await app.inject({
        method: 'POST',
        url: '/api/collections/col-1/images',
        headers: { 'Content-Type': 'application/json' },
        payload: { imageId: 'img-1' },
      });

      expect(response.statusCode).toBe(500);
    });

    it('should trim whitespace from imageId', async () => {
      const existingCollection = createCollectionEntity('col-1');
      const collectionImage = createCollectionImage('ci-1', 'col-1', 'img-1');
      vi.mocked(mockCollectionRepository.findById).mockResolvedValue(existingCollection);
      vi.mocked(mockCollectionRepository.addImage).mockResolvedValue(collectionImage);

      const response = await app.inject({
        method: 'POST',
        url: '/api/collections/col-1/images',
        headers: { 'Content-Type': 'application/json' },
        payload: { imageId: '  img-1  ' },
      });

      expect(response.statusCode).toBe(201);
      expect(mockCollectionRepository.addImage).toHaveBeenCalledWith('col-1', {
        imageId: 'img-1',
        order: undefined,
      });
    });
  });

  describe('DELETE /api/collections/:id/images/:imageId', () => {
    it('should remove image from collection and return 204', async () => {
      const existingCollection = createCollectionEntity('col-1');
      vi.mocked(mockCollectionRepository.findById).mockResolvedValue(existingCollection);
      vi.mocked(mockCollectionRepository.removeImage).mockResolvedValue(undefined);

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/collections/col-1/images/img-1',
      });

      expect(response.statusCode).toBe(204);
      expect(mockCollectionRepository.removeImage).toHaveBeenCalledWith('col-1', 'img-1');
    });

    it('should return 404 when collection not found', async () => {
      vi.mocked(mockCollectionRepository.findById).mockResolvedValue(null);

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/collections/non-existent/images/img-1',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Not Found');
      expect(body.message).toContain('Collection not found');
    });

    it('should return 404 when image not found in collection', async () => {
      const existingCollection = createCollectionEntity('col-1');
      vi.mocked(mockCollectionRepository.findById).mockResolvedValue(existingCollection);

      const prismaError = new Prisma.PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: '5.0.0',
      });
      vi.mocked(mockCollectionRepository.removeImage).mockRejectedValue(prismaError);

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/collections/col-1/images/non-existent-img',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Not Found');
      expect(body.message).toContain('Image not found in collection');
    });

    it('should rethrow non-P2025 Prisma errors', async () => {
      const existingCollection = createCollectionEntity('col-1');
      vi.mocked(mockCollectionRepository.findById).mockResolvedValue(existingCollection);

      const prismaError = new Prisma.PrismaClientKnownRequestError('Some other error', {
        code: 'P2003',
        clientVersion: '5.0.0',
      });
      vi.mocked(mockCollectionRepository.removeImage).mockRejectedValue(prismaError);

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/collections/col-1/images/img-1',
      });

      expect(response.statusCode).toBe(500);
    });
  });

  describe('PUT /api/collections/:id/images/order', () => {
    it('should update image order successfully', async () => {
      const existingCollection = createCollectionEntity('col-1');
      vi.mocked(mockCollectionRepository.findById).mockResolvedValue(existingCollection);
      vi.mocked(mockCollectionRepository.updateImageOrder).mockResolvedValue(undefined);

      const orders = [
        { imageId: 'img-1', order: 0 },
        { imageId: 'img-2', order: 1 },
        { imageId: 'img-3', order: 2 },
      ];

      const response = await app.inject({
        method: 'PUT',
        url: '/api/collections/col-1/images/order',
        headers: { 'Content-Type': 'application/json' },
        payload: { orders },
      });

      expect(response.statusCode).toBe(204);
      expect(mockCollectionRepository.updateImageOrder).toHaveBeenCalledWith('col-1', orders);
    });

    it('should return 404 when collection not found', async () => {
      vi.mocked(mockCollectionRepository.findById).mockResolvedValue(null);

      const response = await app.inject({
        method: 'PUT',
        url: '/api/collections/non-existent/images/order',
        headers: { 'Content-Type': 'application/json' },
        payload: { orders: [{ imageId: 'img-1', order: 0 }] },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Not Found');
      expect(body.message).toContain('Collection not found');
    });

    it('should return 400 when orders array is empty', async () => {
      const existingCollection = createCollectionEntity('col-1');
      vi.mocked(mockCollectionRepository.findById).mockResolvedValue(existingCollection);

      const response = await app.inject({
        method: 'PUT',
        url: '/api/collections/col-1/images/order',
        headers: { 'Content-Type': 'application/json' },
        payload: { orders: [] },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toContain('Orders array is required');
    });

    it('should return 400 when orders is not an array', async () => {
      const existingCollection = createCollectionEntity('col-1');
      vi.mocked(mockCollectionRepository.findById).mockResolvedValue(existingCollection);

      const response = await app.inject({
        method: 'PUT',
        url: '/api/collections/col-1/images/order',
        headers: { 'Content-Type': 'application/json' },
        payload: { orders: 'not-an-array' },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
    });

    it('should return 400 when orders is missing', async () => {
      const existingCollection = createCollectionEntity('col-1');
      vi.mocked(mockCollectionRepository.findById).mockResolvedValue(existingCollection);

      const response = await app.inject({
        method: 'PUT',
        url: '/api/collections/col-1/images/order',
        headers: { 'Content-Type': 'application/json' },
        payload: {},
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
    });
  });

  describe('GET /api/images/:imageId/collections', () => {
    it('should return collections for an image', async () => {
      const collections = [
        createCollectionEntity('col-1', { name: 'Collection 1' }),
        createCollectionEntity('col-2', { name: 'Collection 2' }),
      ];
      vi.mocked(mockCollectionRepository.findCollectionsByImageId).mockResolvedValue(collections);

      const response = await app.inject({
        method: 'GET',
        url: '/api/images/img-1/collections',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as CollectionEntity[];
      expect(body).toHaveLength(2);
      expect(body[0]?.id).toBe('col-1');
      expect(body[1]?.id).toBe('col-2');
      expect(mockCollectionRepository.findCollectionsByImageId).toHaveBeenCalledWith('img-1');
    });

    it('should return empty array when image has no collections', async () => {
      vi.mocked(mockCollectionRepository.findCollectionsByImageId).mockResolvedValue([]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/images/img-1/collections',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as CollectionEntity[];
      expect(body).toHaveLength(0);
    });
  });
});
