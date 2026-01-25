import 'reflect-metadata';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { PrismaViewHistoryRepository } from '@/infra/adapters/prisma-view-history-repository.js';
import { prisma } from '@/infra/database/prisma.js';

vi.mock('@/infra/database/prisma.js', () => ({
  prisma: {
    viewHistory: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      aggregate: vi.fn(),
    },
  },
}));

describe('PrismaViewHistoryRepository', () => {
  let repository: PrismaViewHistoryRepository;

  const mockViewHistory = {
    id: 'view-1',
    imageId: 'image-1',
    viewedAt: new Date(),
    duration: 5000,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockViewHistoryWithImage = {
    ...mockViewHistory,
    image: {
      id: 'image-1',
      title: 'Test Image',
      thumbnailPath: 'thumbnails/test.jpg',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new PrismaViewHistoryRepository();
  });

  describe('create', () => {
    it('should create a new view history', async () => {
      vi.mocked(prisma.viewHistory.create).mockResolvedValue(mockViewHistory);

      const result = await repository.create({ imageId: 'image-1' });

      expect(result).toEqual(mockViewHistory);
      expect(prisma.viewHistory.create).toHaveBeenCalledWith({
        data: { imageId: 'image-1' },
      });
    });
  });

  describe('findById', () => {
    it('should find view history by id', async () => {
      vi.mocked(prisma.viewHistory.findUnique).mockResolvedValue(mockViewHistory);

      const result = await repository.findById('view-1');

      expect(result).toEqual(mockViewHistory);
      expect(prisma.viewHistory.findUnique).toHaveBeenCalledWith({
        where: { id: 'view-1' },
      });
    });

    it('should return null when not found', async () => {
      vi.mocked(prisma.viewHistory.findUnique).mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('updateDuration', () => {
    it('should update view duration', async () => {
      const updatedHistory = { ...mockViewHistory, duration: 10000 };
      vi.mocked(prisma.viewHistory.update).mockResolvedValue(updatedHistory);

      const result = await repository.updateDuration('view-1', { duration: 10000 });

      expect(result).toEqual(updatedHistory);
      expect(prisma.viewHistory.update).toHaveBeenCalledWith({
        where: { id: 'view-1' },
        data: { duration: 10000 },
      });
    });
  });

  describe('findRecentWithImages', () => {
    it('should find recent view history with images', async () => {
      vi.mocked(prisma.viewHistory.findMany).mockResolvedValue([mockViewHistoryWithImage]);

      const result = await repository.findRecentWithImages();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: mockViewHistoryWithImage.id,
        imageId: mockViewHistoryWithImage.imageId,
        viewedAt: mockViewHistoryWithImage.viewedAt,
        duration: mockViewHistoryWithImage.duration,
        createdAt: mockViewHistoryWithImage.createdAt,
        updatedAt: mockViewHistoryWithImage.updatedAt,
        image: mockViewHistoryWithImage.image,
      });
      expect(prisma.viewHistory.findMany).toHaveBeenCalledWith({
        take: 50,
        skip: 0,
        orderBy: { viewedAt: 'desc' },
        include: {
          image: {
            select: {
              id: true,
              title: true,
              thumbnailPath: true,
            },
          },
        },
      });
    });

    it('should respect limit and offset options', async () => {
      vi.mocked(prisma.viewHistory.findMany).mockResolvedValue([]);

      await repository.findRecentWithImages({ limit: 10, offset: 20 });

      expect(prisma.viewHistory.findMany).toHaveBeenCalledWith({
        take: 10,
        skip: 20,
        orderBy: { viewedAt: 'desc' },
        include: {
          image: {
            select: {
              id: true,
              title: true,
              thumbnailPath: true,
            },
          },
        },
      });
    });
  });

  describe('getImageStats', () => {
    it('should return image view statistics', async () => {
      const lastViewed = new Date();
      vi.mocked(prisma.viewHistory.aggregate).mockResolvedValue({
        _count: { _all: 5 },
        _sum: { duration: 25000 },
        _max: { viewedAt: lastViewed },
        _avg: { duration: null },
        _min: { duration: null, viewedAt: null },
      });

      const result = await repository.getImageStats('image-1');

      expect(result).toEqual({
        viewCount: 5,
        totalDuration: 25000,
        lastViewedAt: lastViewed,
      });
      expect(prisma.viewHistory.aggregate).toHaveBeenCalledWith({
        where: { imageId: 'image-1' },
        _count: { _all: true },
        _sum: { duration: true },
        _max: { viewedAt: true },
      });
    });

    it('should handle null duration sum', async () => {
      vi.mocked(prisma.viewHistory.aggregate).mockResolvedValue({
        _count: { _all: 0 },
        _sum: { duration: null },
        _max: { viewedAt: null },
        _avg: { duration: null },
        _min: { duration: null, viewedAt: null },
      });

      const result = await repository.getImageStats('image-1');

      expect(result).toEqual({
        viewCount: 0,
        totalDuration: 0,
        lastViewedAt: null,
      });
    });
  });

  describe('deleteById', () => {
    it('should delete view history by id', async () => {
      vi.mocked(prisma.viewHistory.delete).mockResolvedValue(mockViewHistory);

      await repository.deleteById('view-1');

      expect(prisma.viewHistory.delete).toHaveBeenCalledWith({
        where: { id: 'view-1' },
      });
    });
  });
});
