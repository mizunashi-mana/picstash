import 'reflect-metadata';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { PrismaLabelRepository } from '@/infra/adapters/prisma-label-repository';
import { prisma } from '@/infra/database/prisma.js';

vi.mock('@/infra/database/prisma.js', () => ({
  prisma: {
    attributeLabel: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe('PrismaLabelRepository', () => {
  let repository: PrismaLabelRepository;

  const mockLabel = {
    id: 'label-1',
    name: 'character',
    embedding: null,
    embeddedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new PrismaLabelRepository();
  });

  describe('create', () => {
    it('should create a new label', async () => {
      vi.mocked(prisma.attributeLabel.create).mockResolvedValue(mockLabel);

      const result = await repository.create({ name: 'character' });

      expect(result).toEqual(mockLabel);
      expect(prisma.attributeLabel.create).toHaveBeenCalledWith({
        data: { name: 'character' },
      });
    });
  });

  describe('findById', () => {
    it('should find label by id', async () => {
      vi.mocked(prisma.attributeLabel.findUnique).mockResolvedValue(mockLabel);

      const result = await repository.findById('label-1');

      expect(result).toEqual(mockLabel);
      expect(prisma.attributeLabel.findUnique).toHaveBeenCalledWith({
        where: { id: 'label-1' },
      });
    });

    it('should return null when not found', async () => {
      vi.mocked(prisma.attributeLabel.findUnique).mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByName', () => {
    it('should find label by name', async () => {
      vi.mocked(prisma.attributeLabel.findUnique).mockResolvedValue(mockLabel);

      const result = await repository.findByName('character');

      expect(result).toEqual(mockLabel);
      expect(prisma.attributeLabel.findUnique).toHaveBeenCalledWith({
        where: { name: 'character' },
      });
    });

    it('should return null when not found', async () => {
      vi.mocked(prisma.attributeLabel.findUnique).mockResolvedValue(null);

      const result = await repository.findByName('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should find all labels ordered by name', async () => {
      const labels = [mockLabel, { ...mockLabel, id: 'label-2', name: 'series' }];
      vi.mocked(prisma.attributeLabel.findMany).mockResolvedValue(labels);

      const result = await repository.findAll();

      expect(result).toEqual(labels);
      expect(prisma.attributeLabel.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('updateById', () => {
    it('should update label by id', async () => {
      const updatedLabel = { ...mockLabel, name: 'updated-name' };
      vi.mocked(prisma.attributeLabel.update).mockResolvedValue(updatedLabel);

      const result = await repository.updateById('label-1', { name: 'updated-name' });

      expect(result).toEqual(updatedLabel);
      expect(prisma.attributeLabel.update).toHaveBeenCalledWith({
        where: { id: 'label-1' },
        data: { name: 'updated-name' },
      });
    });
  });

  describe('deleteById', () => {
    it('should delete label by id', async () => {
      vi.mocked(prisma.attributeLabel.delete).mockResolvedValue(mockLabel);

      const result = await repository.deleteById('label-1');

      expect(result).toEqual(mockLabel);
      expect(prisma.attributeLabel.delete).toHaveBeenCalledWith({
        where: { id: 'label-1' },
      });
    });
  });

  describe('findAllWithEmbedding', () => {
    it('should find all labels with embeddings', async () => {
      const labelsWithEmbedding = [
        { id: 'label-1', name: 'character', embedding: new Uint8Array([1, 2, 3]) },
      ];
      vi.mocked(prisma.attributeLabel.findMany).mockResolvedValue(labelsWithEmbedding);

      const result = await repository.findAllWithEmbedding();

      expect(result).toEqual(labelsWithEmbedding);
      expect(prisma.attributeLabel.findMany).toHaveBeenCalledWith({
        where: { embedding: { not: null } },
        select: { id: true, name: true, embedding: true },
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('findIdsWithoutEmbedding', () => {
    it('should find labels without embeddings', async () => {
      const labelsWithoutEmbedding = [
        { id: 'label-1', name: 'character' },
        { id: 'label-2', name: 'series' },
      ];
      vi.mocked(prisma.attributeLabel.findMany).mockResolvedValue(labelsWithoutEmbedding);

      const result = await repository.findIdsWithoutEmbedding();

      expect(result).toEqual(labelsWithoutEmbedding);
      expect(prisma.attributeLabel.findMany).toHaveBeenCalledWith({
        where: { embedding: null },
        select: { id: true, name: true },
      });
    });
  });

  describe('updateEmbedding', () => {
    it('should update label embedding', async () => {
      const embedding = new Float32Array([0.1, 0.2, 0.3]);
      const embeddedAt = new Date();
      vi.mocked(prisma.attributeLabel.update).mockResolvedValue({
        ...mockLabel,
        embedding: new Uint8Array(embedding.buffer),
        embeddedAt,
      });

      await repository.updateEmbedding('label-1', { embedding, embeddedAt });

      expect(prisma.attributeLabel.update).toHaveBeenCalledWith({
        where: { id: 'label-1' },
        data: {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- expect.any returns any
          embedding: expect.any(Float32Array),
          embeddedAt,
        },
      });
    });
  });

  describe('clearAllEmbeddings', () => {
    it('should clear all embeddings', async () => {
      vi.mocked(prisma.attributeLabel.updateMany).mockResolvedValue({ count: 5 });

      await repository.clearAllEmbeddings();

      expect(prisma.attributeLabel.updateMany).toHaveBeenCalledWith({
        data: {
          embedding: null,
          embeddedAt: null,
        },
      });
    });
  });

  describe('countWithEmbedding', () => {
    it('should count labels with embeddings', async () => {
      vi.mocked(prisma.attributeLabel.count).mockResolvedValue(10);

      const result = await repository.countWithEmbedding();

      expect(result).toBe(10);
      expect(prisma.attributeLabel.count).toHaveBeenCalledWith({
        where: { embedding: { not: null } },
      });
    });
  });
});
