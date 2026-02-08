import 'reflect-metadata';
import Fastify, { type FastifyInstance } from 'fastify';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { LabelController } from '@/infra/http/controllers/label-controller';
import type { LabelRepository, LabelEntity } from '@picstash/core';

interface ErrorResponse {
  error: string;
  message: string;
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

function createMockLabel(overrides: Partial<LabelEntity> = {}): LabelEntity {
  return {
    id: 'label-1',
    name: 'Test Label',
    color: '#ff0000',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  };
}

describe('LabelController', () => {
  let app: FastifyInstance;
  let mockLabelRepository: LabelRepository;
  let controller: LabelController;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockLabelRepository = createMockLabelRepository();

    // Create controller with mocked dependencies
    controller = new LabelController(mockLabelRepository);

    // Create Fastify app and register routes
    app = Fastify({ logger: false });
    controller.registerRoutes(app);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /api/labels', () => {
    it('should return empty array when no labels exist', async () => {
      vi.mocked(mockLabelRepository.findAll).mockResolvedValue([]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/labels',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as LabelEntity[];
      expect(body).toEqual([]);
      expect(mockLabelRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return all labels', async () => {
      const labels = [
        createMockLabel({ id: 'label-1', name: 'Label 1' }),
        createMockLabel({ id: 'label-2', name: 'Label 2', color: '#00ff00' }),
      ];
      vi.mocked(mockLabelRepository.findAll).mockResolvedValue(labels);

      const response = await app.inject({
        method: 'GET',
        url: '/api/labels',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as LabelEntity[];
      expect(body).toHaveLength(2);
      expect(body[0]?.name).toBe('Label 1');
      expect(body[1]?.name).toBe('Label 2');
    });
  });

  describe('POST /api/labels', () => {
    it('should create a label successfully', async () => {
      const newLabel = createMockLabel({ id: 'new-label', name: 'New Label' });
      vi.mocked(mockLabelRepository.findByName).mockResolvedValue(null);
      vi.mocked(mockLabelRepository.create).mockResolvedValue(newLabel);

      const response = await app.inject({
        method: 'POST',
        url: '/api/labels',
        payload: { name: 'New Label', color: '#ff0000' },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body) as LabelEntity;
      expect(body.name).toBe('New Label');
    });

    it('should create a label without color', async () => {
      const newLabel = createMockLabel({ id: 'new-label', name: 'New Label', color: null });
      vi.mocked(mockLabelRepository.findByName).mockResolvedValue(null);
      vi.mocked(mockLabelRepository.create).mockResolvedValue(newLabel);

      const response = await app.inject({
        method: 'POST',
        url: '/api/labels',
        payload: { name: 'New Label' },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body) as LabelEntity;
      expect(body.name).toBe('New Label');
      expect(body.color).toBeNull();
    });

    it('should return 400 when name is empty', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/labels',
        payload: { name: '' },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toBe('Label name is required');
    });

    it('should return 400 when name is whitespace only', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/labels',
        payload: { name: '   ' },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toBe('Label name is required');
    });

    it('should return 400 when name is too long', async () => {
      const longName = 'a'.repeat(101);

      const response = await app.inject({
        method: 'POST',
        url: '/api/labels',
        payload: { name: longName },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toBe('Label name must be 100 characters or less');
    });

    it('should return 409 when label name already exists', async () => {
      const existingLabel = createMockLabel({ name: 'Existing Label' });
      vi.mocked(mockLabelRepository.findByName).mockResolvedValue(existingLabel);

      const response = await app.inject({
        method: 'POST',
        url: '/api/labels',
        payload: { name: 'Existing Label' },
      });

      expect(response.statusCode).toBe(409);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Conflict');
      expect(body.message).toBe('Label with name "Existing Label" already exists');
    });
  });

  describe('GET /api/labels/:id', () => {
    it('should return a label by id', async () => {
      const label = createMockLabel({ id: 'label-1', name: 'Test Label' });
      vi.mocked(mockLabelRepository.findById).mockResolvedValue(label);

      const response = await app.inject({
        method: 'GET',
        url: '/api/labels/label-1',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as LabelEntity;
      expect(body.id).toBe('label-1');
      expect(body.name).toBe('Test Label');
      expect(mockLabelRepository.findById).toHaveBeenCalledWith('label-1');
    });

    it('should return 404 when label not found', async () => {
      vi.mocked(mockLabelRepository.findById).mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: '/api/labels/non-existent',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Not Found');
      expect(body.message).toBe('Label not found');
    });
  });

  describe('PUT /api/labels/:id', () => {
    it('should update a label successfully', async () => {
      const existingLabel = createMockLabel({ id: 'label-1', name: 'Old Name' });
      const updatedLabel = createMockLabel({ id: 'label-1', name: 'New Name', color: '#00ff00' });
      vi.mocked(mockLabelRepository.findById).mockResolvedValue(existingLabel);
      vi.mocked(mockLabelRepository.findByName).mockResolvedValue(null);
      vi.mocked(mockLabelRepository.updateById).mockResolvedValue(updatedLabel);

      const response = await app.inject({
        method: 'PUT',
        url: '/api/labels/label-1',
        payload: { name: 'New Name', color: '#00ff00' },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as LabelEntity;
      expect(body.name).toBe('New Name');
      expect(body.color).toBe('#00ff00');
    });

    it('should update only the name', async () => {
      const existingLabel = createMockLabel({ id: 'label-1', name: 'Old Name' });
      const updatedLabel = createMockLabel({ id: 'label-1', name: 'New Name' });
      vi.mocked(mockLabelRepository.findById).mockResolvedValue(existingLabel);
      vi.mocked(mockLabelRepository.findByName).mockResolvedValue(null);
      vi.mocked(mockLabelRepository.updateById).mockResolvedValue(updatedLabel);

      const response = await app.inject({
        method: 'PUT',
        url: '/api/labels/label-1',
        payload: { name: 'New Name' },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as LabelEntity;
      expect(body.name).toBe('New Name');
    });

    it('should update only the color', async () => {
      const existingLabel = createMockLabel({ id: 'label-1', name: 'Test Label', color: '#ff0000' });
      const updatedLabel = createMockLabel({ id: 'label-1', name: 'Test Label', color: '#00ff00' });
      vi.mocked(mockLabelRepository.findById).mockResolvedValue(existingLabel);
      vi.mocked(mockLabelRepository.updateById).mockResolvedValue(updatedLabel);

      const response = await app.inject({
        method: 'PUT',
        url: '/api/labels/label-1',
        payload: { color: '#00ff00' },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as LabelEntity;
      expect(body.color).toBe('#00ff00');
    });

    it('should return 404 when label not found', async () => {
      vi.mocked(mockLabelRepository.findById).mockResolvedValue(null);

      const response = await app.inject({
        method: 'PUT',
        url: '/api/labels/non-existent',
        payload: { name: 'New Name' },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Not Found');
      expect(body.message).toBe('Label not found');
    });

    it('should return 400 when name is empty', async () => {
      const existingLabel = createMockLabel({ id: 'label-1', name: 'Test Label' });
      vi.mocked(mockLabelRepository.findById).mockResolvedValue(existingLabel);

      const response = await app.inject({
        method: 'PUT',
        url: '/api/labels/label-1',
        payload: { name: '' },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toBe('Label name cannot be empty');
    });

    it('should return 400 when name is whitespace only', async () => {
      const existingLabel = createMockLabel({ id: 'label-1', name: 'Test Label' });
      vi.mocked(mockLabelRepository.findById).mockResolvedValue(existingLabel);

      const response = await app.inject({
        method: 'PUT',
        url: '/api/labels/label-1',
        payload: { name: '   ' },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toBe('Label name cannot be empty');
    });

    it('should return 400 when name is too long', async () => {
      const existingLabel = createMockLabel({ id: 'label-1', name: 'Test Label' });
      vi.mocked(mockLabelRepository.findById).mockResolvedValue(existingLabel);
      const longName = 'a'.repeat(101);

      const response = await app.inject({
        method: 'PUT',
        url: '/api/labels/label-1',
        payload: { name: longName },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toBe('Label name must be 100 characters or less');
    });

    it('should return 409 when updating to a duplicate name', async () => {
      const existingLabel = createMockLabel({ id: 'label-1', name: 'Label 1' });
      const duplicateLabel = createMockLabel({ id: 'label-2', name: 'Label 2' });
      vi.mocked(mockLabelRepository.findById).mockResolvedValue(existingLabel);
      vi.mocked(mockLabelRepository.findByName).mockResolvedValue(duplicateLabel);

      const response = await app.inject({
        method: 'PUT',
        url: '/api/labels/label-1',
        payload: { name: 'Label 2' },
      });

      expect(response.statusCode).toBe(409);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Conflict');
      expect(body.message).toBe('Label with name "Label 2" already exists');
    });

    it('should allow updating to the same name (self)', async () => {
      const existingLabel = createMockLabel({ id: 'label-1', name: 'Test Label' });
      const updatedLabel = createMockLabel({ id: 'label-1', name: 'Test Label', color: '#00ff00' });
      vi.mocked(mockLabelRepository.findById).mockResolvedValue(existingLabel);
      vi.mocked(mockLabelRepository.findByName).mockResolvedValue(existingLabel);
      vi.mocked(mockLabelRepository.updateById).mockResolvedValue(updatedLabel);

      const response = await app.inject({
        method: 'PUT',
        url: '/api/labels/label-1',
        payload: { name: 'Test Label', color: '#00ff00' },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as LabelEntity;
      expect(body.name).toBe('Test Label');
      expect(body.color).toBe('#00ff00');
    });
  });

  describe('DELETE /api/labels/:id', () => {
    it('should delete a label successfully', async () => {
      const label = createMockLabel({ id: 'label-1' });
      vi.mocked(mockLabelRepository.findById).mockResolvedValue(label);
      vi.mocked(mockLabelRepository.deleteById).mockResolvedValue(label);

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/labels/label-1',
      });

      expect(response.statusCode).toBe(204);
      expect(response.body).toBe('');
      expect(mockLabelRepository.findById).toHaveBeenCalledWith('label-1');
      expect(mockLabelRepository.deleteById).toHaveBeenCalledWith('label-1');
    });

    it('should return 404 when label not found', async () => {
      vi.mocked(mockLabelRepository.findById).mockResolvedValue(null);

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/labels/non-existent',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Not Found');
      expect(body.message).toBe('Label not found');
      expect(mockLabelRepository.deleteById).not.toHaveBeenCalled();
    });
  });
});
