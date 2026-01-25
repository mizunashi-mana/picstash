import 'reflect-metadata';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { PrismaImageAttributeRepository } from '@/infra/adapters/prisma-image-attribute-repository.js';
import type { PrismaService } from '@/infra/database/prisma-service.js';

const mockPrismaClient = {
  imageAttribute: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
};

const mockPrismaService = {
  getClient: () => mockPrismaClient,
  connect: vi.fn(),
  disconnect: vi.fn(),
} as unknown as PrismaService;

describe('PrismaImageAttributeRepository', () => {
  let repository: PrismaImageAttributeRepository;

  const mockLabel = {
    id: 'label-1',
    name: 'character',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAttribute = {
    id: 'attr-1',
    imageId: 'image-1',
    labelId: 'label-1',
    keywords: 'keyword1, keyword2',
    createdAt: new Date(),
    updatedAt: new Date(),
    label: mockLabel,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new PrismaImageAttributeRepository(mockPrismaService);
  });

  describe('findById', () => {
    it('should find attribute by id', async () => {
      vi.mocked(mockPrismaClient.imageAttribute.findUnique).mockResolvedValue(mockAttribute);

      const result = await repository.findById('attr-1');

      expect(result).toEqual(mockAttribute);
      expect(mockPrismaClient.imageAttribute.findUnique).toHaveBeenCalledWith({
        where: { id: 'attr-1' },
        include: { label: true },
      });
    });

    it('should return null when not found', async () => {
      vi.mocked(mockPrismaClient.imageAttribute.findUnique).mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByImageId', () => {
    it('should find all attributes for an image', async () => {
      const attributes = [mockAttribute, { ...mockAttribute, id: 'attr-2' }];
      vi.mocked(mockPrismaClient.imageAttribute.findMany).mockResolvedValue(attributes);

      const result = await repository.findByImageId('image-1');

      expect(result).toEqual(attributes);
      expect(mockPrismaClient.imageAttribute.findMany).toHaveBeenCalledWith({
        where: { imageId: 'image-1' },
        include: { label: true },
        orderBy: { createdAt: 'asc' },
      });
    });

    it('should return empty array when no attributes', async () => {
      vi.mocked(mockPrismaClient.imageAttribute.findMany).mockResolvedValue([]);

      const result = await repository.findByImageId('image-1');

      expect(result).toEqual([]);
    });
  });

  describe('findByImageAndLabel', () => {
    it('should find attribute by image and label', async () => {
      vi.mocked(mockPrismaClient.imageAttribute.findUnique).mockResolvedValue(mockAttribute);

      const result = await repository.findByImageAndLabel('image-1', 'label-1');

      expect(result).toEqual(mockAttribute);
      expect(mockPrismaClient.imageAttribute.findUnique).toHaveBeenCalledWith({
        where: { imageId_labelId: { imageId: 'image-1', labelId: 'label-1' } },
        include: { label: true },
      });
    });

    it('should return null when not found', async () => {
      vi.mocked(mockPrismaClient.imageAttribute.findUnique).mockResolvedValue(null);

      const result = await repository.findByImageAndLabel('image-1', 'label-2');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new attribute', async () => {
      vi.mocked(mockPrismaClient.imageAttribute.create).mockResolvedValue(mockAttribute);

      const result = await repository.create({
        imageId: 'image-1',
        labelId: 'label-1',
        keywords: 'keyword1, keyword2',
      });

      expect(result).toEqual(mockAttribute);
      expect(mockPrismaClient.imageAttribute.create).toHaveBeenCalledWith({
        data: {
          imageId: 'image-1',
          labelId: 'label-1',
          keywords: 'keyword1, keyword2',
        },
        include: { label: true },
      });
    });
  });

  describe('updateById', () => {
    it('should update attribute keywords', async () => {
      const updatedAttribute = { ...mockAttribute, keywords: 'new-keyword' };
      vi.mocked(mockPrismaClient.imageAttribute.update).mockResolvedValue(updatedAttribute);

      const result = await repository.updateById('attr-1', {
        keywords: 'new-keyword',
      });

      expect(result).toEqual(updatedAttribute);
      expect(mockPrismaClient.imageAttribute.update).toHaveBeenCalledWith({
        where: { id: 'attr-1' },
        data: { keywords: 'new-keyword' },
        include: { label: true },
      });
    });
  });

  describe('deleteById', () => {
    it('should delete attribute by id', async () => {
      vi.mocked(mockPrismaClient.imageAttribute.delete).mockResolvedValue(mockAttribute);

      await repository.deleteById('attr-1');

      expect(mockPrismaClient.imageAttribute.delete).toHaveBeenCalledWith({
        where: { id: 'attr-1' },
      });
    });
  });
});
