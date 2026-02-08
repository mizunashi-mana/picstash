import 'reflect-metadata';
import Fastify, { type FastifyInstance } from 'fastify';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { ImageAttributeController } from '@/infra/http/controllers/image-attribute-controller';
import type {
  ImageRepository,
  LabelRepository,
  ImageAttributeRepository,
  ImageAttribute,
  LabelEntity,
} from '@picstash/core';

interface ErrorResponse {
  error: string;
  message?: string;
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
    updateById: vi.fn(),
    deleteById: vi.fn(),
    findById: vi.fn(),
    findByName: vi.fn(),
    findAll: vi.fn(),
    findAllWithEmbedding: vi.fn(),
    findIdsWithoutEmbedding: vi.fn(),
    updateEmbedding: vi.fn(),
    clearAllEmbeddings: vi.fn(),
    countWithEmbedding: vi.fn(),
  };
}

function createMockImageAttributeRepository(): ImageAttributeRepository {
  return {
    findById: vi.fn(),
    findByImageId: vi.fn(),
    findByImageAndLabel: vi.fn(),
    create: vi.fn(),
    updateById: vi.fn(),
    deleteById: vi.fn(),
  };
}

function createMockLabel(id: string = 'label-1'): LabelEntity {
  return {
    id,
    name: 'Test Label',
    color: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function createMockImageAttribute(
  id: string = 'attr-1',
  imageId: string = 'image-1',
  labelId: string = 'label-1',
): ImageAttribute {
  return {
    id,
    imageId,
    labelId,
    keywords: 'test keywords',
    createdAt: new Date(),
    updatedAt: new Date(),
    label: createMockLabel(labelId),
  };
}

function createMockImage(id: string = 'image-1') {
  return {
    id,
    path: `originals/${id}.png`,
    thumbnailPath: `thumbnails/${id}.jpg`,
    mimeType: 'image/png',
    size: 1024,
    width: 100,
    height: 100,
    title: 'Test Image',
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    attributes: [],
  };
}

describe('ImageAttributeController', () => {
  let app: FastifyInstance;
  let mockImageRepository: ImageRepository;
  let mockLabelRepository: LabelRepository;
  let mockImageAttributeRepository: ImageAttributeRepository;
  let controller: ImageAttributeController;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockImageRepository = createMockImageRepository();
    mockLabelRepository = createMockLabelRepository();
    mockImageAttributeRepository = createMockImageAttributeRepository();

    // Create controller with mocked dependencies
    controller = new ImageAttributeController(
      mockImageRepository,
      mockLabelRepository,
      mockImageAttributeRepository,
    );

    // Create Fastify app and register routes
    app = Fastify({ logger: false });
    controller.registerRoutes(app);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /api/images/:imageId/attributes', () => {
    it('should return attributes for an existing image', async () => {
      const mockImage = createMockImage('image-1');
      const mockAttributes = [
        createMockImageAttribute('attr-1', 'image-1', 'label-1'),
        createMockImageAttribute('attr-2', 'image-1', 'label-2'),
      ];

      vi.mocked(mockImageRepository.findById).mockResolvedValue(mockImage);
      vi.mocked(mockImageAttributeRepository.findByImageId).mockResolvedValue(mockAttributes);

      const response = await app.inject({
        method: 'GET',
        url: '/api/images/image-1/attributes',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as ImageAttribute[];
      expect(body).toHaveLength(2);
      expect(body[0]?.id).toBe('attr-1');
      expect(body[1]?.id).toBe('attr-2');
      expect(mockImageRepository.findById).toHaveBeenCalledWith('image-1');
      expect(mockImageAttributeRepository.findByImageId).toHaveBeenCalledWith('image-1');
    });

    it('should return empty array when image has no attributes', async () => {
      const mockImage = createMockImage('image-1');

      vi.mocked(mockImageRepository.findById).mockResolvedValue(mockImage);
      vi.mocked(mockImageAttributeRepository.findByImageId).mockResolvedValue([]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/images/image-1/attributes',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as ImageAttribute[];
      expect(body).toHaveLength(0);
    });

    it('should return 404 when image is not found', async () => {
      vi.mocked(mockImageRepository.findById).mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: '/api/images/non-existent-id/attributes',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Not Found');
      expect(body.message).toBe('Image not found');
    });
  });

  describe('POST /api/images/:imageId/attributes', () => {
    it('should create attribute successfully', async () => {
      const mockImage = createMockImage('image-1');
      const mockLabel = createMockLabel('label-1');
      const mockAttribute = createMockImageAttribute('new-attr', 'image-1', 'label-1');

      vi.mocked(mockImageRepository.findById).mockResolvedValue(mockImage);
      vi.mocked(mockLabelRepository.findById).mockResolvedValue(mockLabel);
      vi.mocked(mockImageAttributeRepository.findByImageAndLabel).mockResolvedValue(null);
      vi.mocked(mockImageAttributeRepository.create).mockResolvedValue(mockAttribute);

      const response = await app.inject({
        method: 'POST',
        url: '/api/images/image-1/attributes',
        payload: {
          labelId: 'label-1',
          keywords: 'some keywords',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body) as ImageAttribute;
      expect(body.id).toBe('new-attr');
      expect(body.imageId).toBe('image-1');
      expect(body.labelId).toBe('label-1');
    });

    it('should create attribute without keywords', async () => {
      const mockImage = createMockImage('image-1');
      const mockLabel = createMockLabel('label-1');
      const mockAttribute = {
        ...createMockImageAttribute('new-attr', 'image-1', 'label-1'),
        keywords: null,
      };

      vi.mocked(mockImageRepository.findById).mockResolvedValue(mockImage);
      vi.mocked(mockLabelRepository.findById).mockResolvedValue(mockLabel);
      vi.mocked(mockImageAttributeRepository.findByImageAndLabel).mockResolvedValue(null);
      vi.mocked(mockImageAttributeRepository.create).mockResolvedValue(mockAttribute);

      const response = await app.inject({
        method: 'POST',
        url: '/api/images/image-1/attributes',
        payload: {
          labelId: 'label-1',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body) as ImageAttribute;
      expect(body.keywords).toBeNull();
    });

    it('should return 400 when labelId is empty string', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/images/image-1/attributes',
        payload: {
          labelId: '',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toContain('labelId');
    });

    it('should return 400 when labelId is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/images/image-1/attributes',
        payload: {},
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
    });

    it('should return 404 when image is not found', async () => {
      vi.mocked(mockImageRepository.findById).mockResolvedValue(null);

      const response = await app.inject({
        method: 'POST',
        url: '/api/images/non-existent-id/attributes',
        payload: {
          labelId: 'label-1',
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Not Found');
      expect(body.message).toBe('Image not found');
    });

    it('should return 404 when label is not found', async () => {
      const mockImage = createMockImage('image-1');

      vi.mocked(mockImageRepository.findById).mockResolvedValue(mockImage);
      vi.mocked(mockLabelRepository.findById).mockResolvedValue(null);

      const response = await app.inject({
        method: 'POST',
        url: '/api/images/image-1/attributes',
        payload: {
          labelId: 'non-existent-label',
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Not Found');
      expect(body.message).toBe('Label not found');
    });

    it('should return 409 when attribute already exists', async () => {
      const mockImage = createMockImage('image-1');
      const mockLabel = createMockLabel('label-1');
      const existingAttribute = createMockImageAttribute('existing-attr', 'image-1', 'label-1');

      vi.mocked(mockImageRepository.findById).mockResolvedValue(mockImage);
      vi.mocked(mockLabelRepository.findById).mockResolvedValue(mockLabel);
      vi.mocked(mockImageAttributeRepository.findByImageAndLabel).mockResolvedValue(existingAttribute);

      const response = await app.inject({
        method: 'POST',
        url: '/api/images/image-1/attributes',
        payload: {
          labelId: 'label-1',
        },
      });

      expect(response.statusCode).toBe(409);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Conflict');
      expect(body.message).toContain('already assigned');
    });
  });

  describe('PUT /api/images/:imageId/attributes/:attributeId', () => {
    it('should update attribute keywords successfully', async () => {
      const existingAttribute = createMockImageAttribute('attr-1', 'image-1', 'label-1');
      const updatedAttribute = {
        ...existingAttribute,
        keywords: 'updated keywords',
      };

      vi.mocked(mockImageAttributeRepository.findById).mockResolvedValue(existingAttribute);
      vi.mocked(mockImageAttributeRepository.updateById).mockResolvedValue(updatedAttribute);

      const response = await app.inject({
        method: 'PUT',
        url: '/api/images/image-1/attributes/attr-1',
        payload: {
          keywords: 'updated keywords',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as ImageAttribute;
      expect(body.keywords).toBe('updated keywords');
      expect(mockImageAttributeRepository.updateById).toHaveBeenCalledWith(
        'attr-1',
        expect.objectContaining({ keywords: 'updated keywords' }),
      );
    });

    it('should update attribute with empty keywords', async () => {
      const existingAttribute = createMockImageAttribute('attr-1', 'image-1', 'label-1');
      const updatedAttribute = {
        ...existingAttribute,
        keywords: null,
      };

      vi.mocked(mockImageAttributeRepository.findById).mockResolvedValue(existingAttribute);
      vi.mocked(mockImageAttributeRepository.updateById).mockResolvedValue(updatedAttribute);

      const response = await app.inject({
        method: 'PUT',
        url: '/api/images/image-1/attributes/attr-1',
        payload: {
          keywords: '',
        },
      });

      expect(response.statusCode).toBe(200);
    });

    it('should update attribute without keywords in payload', async () => {
      const existingAttribute = createMockImageAttribute('attr-1', 'image-1', 'label-1');
      const updatedAttribute = {
        ...existingAttribute,
        keywords: null,
      };

      vi.mocked(mockImageAttributeRepository.findById).mockResolvedValue(existingAttribute);
      vi.mocked(mockImageAttributeRepository.updateById).mockResolvedValue(updatedAttribute);

      const response = await app.inject({
        method: 'PUT',
        url: '/api/images/image-1/attributes/attr-1',
        payload: {},
      });

      expect(response.statusCode).toBe(200);
    });

    it('should return 404 when attribute is not found', async () => {
      vi.mocked(mockImageAttributeRepository.findById).mockResolvedValue(null);

      const response = await app.inject({
        method: 'PUT',
        url: '/api/images/image-1/attributes/non-existent-attr',
        payload: {
          keywords: 'new keywords',
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Not Found');
      expect(body.message).toBe('Attribute not found');
    });

    it('should return 404 when attribute does not belong to the image', async () => {
      const attributeFromDifferentImage = createMockImageAttribute('attr-1', 'other-image', 'label-1');

      vi.mocked(mockImageAttributeRepository.findById).mockResolvedValue(attributeFromDifferentImage);

      const response = await app.inject({
        method: 'PUT',
        url: '/api/images/image-1/attributes/attr-1',
        payload: {
          keywords: 'new keywords',
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Not Found');
      expect(body.message).toBe('Attribute does not belong to this image');
    });
  });

  describe('DELETE /api/images/:imageId/attributes/:attributeId', () => {
    it('should delete attribute successfully', async () => {
      const existingAttribute = createMockImageAttribute('attr-1', 'image-1', 'label-1');

      vi.mocked(mockImageAttributeRepository.findById).mockResolvedValue(existingAttribute);
      vi.mocked(mockImageAttributeRepository.deleteById).mockResolvedValue(undefined);

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/images/image-1/attributes/attr-1',
      });

      expect(response.statusCode).toBe(204);
      expect(response.body).toBe('');
      expect(mockImageAttributeRepository.deleteById).toHaveBeenCalledWith('attr-1');
    });

    it('should return 404 when attribute is not found', async () => {
      vi.mocked(mockImageAttributeRepository.findById).mockResolvedValue(null);

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/images/image-1/attributes/non-existent-attr',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Not Found');
      expect(body.message).toBe('Attribute not found');
    });

    it('should return 404 when attribute does not belong to the image', async () => {
      const attributeFromDifferentImage = createMockImageAttribute('attr-1', 'other-image', 'label-1');

      vi.mocked(mockImageAttributeRepository.findById).mockResolvedValue(attributeFromDifferentImage);

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/images/image-1/attributes/attr-1',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Not Found');
      expect(body.message).toBe('Attribute does not belong to this image');
    });
  });
});
