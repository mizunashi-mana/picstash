import 'reflect-metadata';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { PrismaRecommendationConversionRepository } from '@/infra/adapters/prisma-recommendation-conversion-repository';
import { prisma } from '@/infra/database/prisma.js';
import { Prisma } from '@~generated/prisma/client.js';

// Mock the Prisma client module including the error class
vi.mock('@~generated/prisma/client.js', () => {
  class PrismaClientKnownRequestError extends Error {
    code: string;
    constructor(message: string, options: { code: string; clientVersion: string }) {
      super(message);
      this.code = options.code;
      this.name = 'PrismaClientKnownRequestError';
    }
  }
  return {
    Prisma: {
      PrismaClientKnownRequestError,
    },
  };
});

vi.mock('@/infra/database/prisma.js', () => ({
  prisma: {
    recommendationConversion: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      aggregate: vi.fn(),
      count: vi.fn(),
    },
    viewHistory: {
      aggregate: vi.fn(),
    },
  },
}));

describe('PrismaRecommendationConversionRepository', () => {
  let repository: PrismaRecommendationConversionRepository;

  const mockConversion = {
    id: 'conv-1',
    imageId: 'image-1',
    recommendationScore: 0.95,
    impressionAt: new Date(),
    clickedAt: null,
    viewHistoryId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new PrismaRecommendationConversionRepository();
  });

  describe('createImpressions', () => {
    it('should create impressions for valid inputs', async () => {
      vi.mocked(prisma.recommendationConversion.create).mockResolvedValue(mockConversion);

      const result = await repository.createImpressions([
        { imageId: 'image-1', score: 0.95 },
        { imageId: 'image-2', score: 0.85 },
      ]);

      expect(result).toHaveLength(2);
      expect(prisma.recommendationConversion.create).toHaveBeenCalledTimes(2);
    });

    it('should skip impressions for non-existent images (P2003 error)', async () => {
      const p2003Error = new Prisma.PrismaClientKnownRequestError(
        'Foreign key constraint failed',
        { code: 'P2003', clientVersion: '5.0.0' },
      );

      vi.mocked(prisma.recommendationConversion.create)
        .mockRejectedValueOnce(p2003Error)
        .mockResolvedValueOnce(mockConversion);

      const result = await repository.createImpressions([
        { imageId: 'non-existent', score: 0.95 },
        { imageId: 'image-1', score: 0.85 },
      ]);

      expect(result).toHaveLength(1);
      expect(prisma.recommendationConversion.create).toHaveBeenCalledTimes(2);
    });

    it('should throw other errors', async () => {
      const otherError = new Error('Database connection failed');
      vi.mocked(prisma.recommendationConversion.create).mockRejectedValue(otherError);

      await expect(
        repository.createImpressions([{ imageId: 'image-1', score: 0.95 }]),
      ).rejects.toThrow('Database connection failed');
    });
  });

  describe('findById', () => {
    it('should find conversion by id', async () => {
      vi.mocked(prisma.recommendationConversion.findUnique).mockResolvedValue(mockConversion);

      const result = await repository.findById('conv-1');

      expect(result).toEqual(mockConversion);
      expect(prisma.recommendationConversion.findUnique).toHaveBeenCalledWith({
        where: { id: 'conv-1' },
      });
    });

    it('should return null when not found', async () => {
      vi.mocked(prisma.recommendationConversion.findUnique).mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('recordClick', () => {
    it('should record click with view history', async () => {
      const clickedConversion = {
        ...mockConversion,
        clickedAt: new Date(),
        viewHistoryId: 'view-1',
      };
      vi.mocked(prisma.recommendationConversion.update).mockResolvedValue(clickedConversion);

      const result = await repository.recordClick('conv-1', { viewHistoryId: 'view-1' });

      expect(result.clickedAt).not.toBeNull();
      expect(result.viewHistoryId).toBe('view-1');
      expect(prisma.recommendationConversion.update).toHaveBeenCalledWith({
        where: { id: 'conv-1' },
        data: {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- expect.any returns any
          clickedAt: expect.any(Date),
          viewHistoryId: 'view-1',
        },
      });
    });
  });

  describe('getStats', () => {
    it('should return conversion stats with default 30 days', async () => {
      vi.mocked(prisma.recommendationConversion.aggregate).mockResolvedValue({
        _count: { _all: 100 },
        _avg: { recommendationScore: null },
        _sum: { recommendationScore: null },
        _min: { recommendationScore: null, impressionAt: null, clickedAt: null },
        _max: { recommendationScore: null, impressionAt: null, clickedAt: null },
      });
      vi.mocked(prisma.recommendationConversion.count).mockResolvedValue(25);
      vi.mocked(prisma.viewHistory.aggregate).mockResolvedValue({
        _avg: { duration: 5000 },
        _count: { _all: 0 },
        _sum: { duration: null },
        _min: { duration: null, viewedAt: null },
        _max: { duration: null, viewedAt: null },
      });

      const result = await repository.getStats();

      expect(result.totalImpressions).toBe(100);
      expect(result.totalClicks).toBe(25);
      expect(result.conversionRate).toBe(0.25);
      expect(result.avgClickedDuration).toBe(5000);
    });

    it('should handle custom days option', async () => {
      vi.mocked(prisma.recommendationConversion.aggregate).mockResolvedValue({
        _count: { _all: 50 },
        _avg: { recommendationScore: null },
        _sum: { recommendationScore: null },
        _min: { recommendationScore: null, impressionAt: null, clickedAt: null },
        _max: { recommendationScore: null, impressionAt: null, clickedAt: null },
      });
      vi.mocked(prisma.recommendationConversion.count).mockResolvedValue(10);
      vi.mocked(prisma.viewHistory.aggregate).mockResolvedValue({
        _avg: { duration: null },
        _count: { _all: 0 },
        _sum: { duration: null },
        _min: { duration: null, viewedAt: null },
        _max: { duration: null, viewedAt: null },
      });

      const result = await repository.getStats({ days: 7 });

      expect(result.totalImpressions).toBe(50);
      expect(result.totalClicks).toBe(10);
      expect(result.conversionRate).toBe(0.2);
      expect(result.avgClickedDuration).toBeNull();
    });

    it('should handle zero impressions', async () => {
      vi.mocked(prisma.recommendationConversion.aggregate).mockResolvedValue({
        _count: { _all: 0 },
        _avg: { recommendationScore: null },
        _sum: { recommendationScore: null },
        _min: { recommendationScore: null, impressionAt: null, clickedAt: null },
        _max: { recommendationScore: null, impressionAt: null, clickedAt: null },
      });
      vi.mocked(prisma.recommendationConversion.count).mockResolvedValue(0);
      vi.mocked(prisma.viewHistory.aggregate).mockResolvedValue({
        _avg: { duration: null },
        _count: { _all: 0 },
        _sum: { duration: null },
        _min: { duration: null, viewedAt: null },
        _max: { duration: null, viewedAt: null },
      });

      const result = await repository.getStats();

      expect(result.totalImpressions).toBe(0);
      expect(result.totalClicks).toBe(0);
      expect(result.conversionRate).toBe(0);
    });
  });
});
