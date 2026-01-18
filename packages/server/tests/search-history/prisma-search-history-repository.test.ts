import 'reflect-metadata';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { PrismaSearchHistoryRepository } from '@/infra/adapters/prisma-search-history-repository';
import { prisma } from '@/infra/database/prisma.js';

// Mock the prisma client
vi.mock('@/infra/database/prisma.js', () => ({
  prisma: {
    searchHistory: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

describe('PrismaSearchHistoryRepository', () => {
  let repository: PrismaSearchHistoryRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new PrismaSearchHistoryRepository();
  });

  describe('save', () => {
    it('should create new search history', async () => {
      const mockHistory = {
        id: 'history-1',
        query: 'test query',
        searchedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.searchHistory.upsert).mockResolvedValue(mockHistory);

      const result = await repository.save({ query: 'test query' });

      expect(result).toEqual(mockHistory);
      expect(prisma.searchHistory.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { query: 'test query' },
        }) as unknown,
      );

      // Verify the call arguments more specifically
      const call = vi.mocked(prisma.searchHistory.upsert).mock.calls[0]?.[0];
      expect(call?.where).toEqual({ query: 'test query' });
      expect(call?.create.query).toBe('test query');
      expect(call?.update.searchedAt).toBeInstanceOf(Date);
    });

    it('should update existing search history on duplicate', async () => {
      const mockHistory = {
        id: 'history-1',
        query: 'existing query',
        searchedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.searchHistory.upsert).mockResolvedValue(mockHistory);

      await repository.save({ query: 'existing query' });

      expect(prisma.searchHistory.upsert).toHaveBeenCalled();
    });

    it('should trim whitespace from query', async () => {
      const mockHistory = {
        id: 'history-1',
        query: 'trimmed query',
        searchedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.searchHistory.upsert).mockResolvedValue(mockHistory);

      await repository.save({ query: '  trimmed query  ' });

      expect(prisma.searchHistory.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { query: 'trimmed query' },
        }),
      );
    });

    it('should throw error for empty query', async () => {
      await expect(repository.save({ query: '' })).rejects.toThrow(
        'Query cannot be empty',
      );
      await expect(repository.save({ query: '   ' })).rejects.toThrow(
        'Query cannot be empty',
      );
    });
  });

  describe('findByQuery', () => {
    it('should find search history by exact query', async () => {
      const mockHistory = {
        id: 'history-1',
        query: 'test query',
        searchedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.searchHistory.findUnique).mockResolvedValue(mockHistory);

      const result = await repository.findByQuery('test query');

      expect(result).toEqual(mockHistory);
      expect(prisma.searchHistory.findUnique).toHaveBeenCalledWith({
        where: { query: 'test query' },
      });
    });

    it('should return null when not found', async () => {
      vi.mocked(prisma.searchHistory.findUnique).mockResolvedValue(null);

      const result = await repository.findByQuery('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByPrefix', () => {
    it('should filter by prefix (case-insensitive)', async () => {
      const mockHistories = [
        {
          id: '1',
          query: 'test query 1',
          searchedAt: new Date('2024-01-03'),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          query: 'Test Query 2',
          searchedAt: new Date('2024-01-02'),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '3',
          query: 'other query',
          searchedAt: new Date('2024-01-01'),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(prisma.searchHistory.findMany).mockResolvedValue(mockHistories);

      const result = await repository.findByPrefix('test');

      expect(result).toHaveLength(2);
      expect(result[0]?.query).toBe('test query 1');
      expect(result[1]?.query).toBe('Test Query 2');
    });

    it('should respect limit parameter', async () => {
      const mockHistories = [
        {
          id: '1',
          query: 'test 1',
          searchedAt: new Date('2024-01-03'),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          query: 'test 2',
          searchedAt: new Date('2024-01-02'),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '3',
          query: 'test 3',
          searchedAt: new Date('2024-01-01'),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(prisma.searchHistory.findMany).mockResolvedValue(mockHistories);

      const result = await repository.findByPrefix('test', 2);

      expect(result).toHaveLength(2);
    });

    it('should return empty array for empty prefix', async () => {
      const result = await repository.findByPrefix('');

      expect(result).toEqual([]);
      expect(prisma.searchHistory.findMany).not.toHaveBeenCalled();
    });

    it('should return empty array for whitespace-only prefix', async () => {
      const result = await repository.findByPrefix('   ');

      expect(result).toEqual([]);
      expect(prisma.searchHistory.findMany).not.toHaveBeenCalled();
    });
  });

  describe('findRecent', () => {
    it('should return recent search history ordered by searchedAt desc', async () => {
      const mockHistories = [
        {
          id: '1',
          query: 'recent',
          searchedAt: new Date('2024-01-03'),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          query: 'older',
          searchedAt: new Date('2024-01-02'),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(prisma.searchHistory.findMany).mockResolvedValue(mockHistories);

      const result = await repository.findRecent({ limit: 10 });

      expect(result).toEqual(mockHistories);
      expect(prisma.searchHistory.findMany).toHaveBeenCalledWith({
        orderBy: { searchedAt: 'desc' },
        take: 10,
      });
    });

    it('should use default limit when not specified', async () => {
      vi.mocked(prisma.searchHistory.findMany).mockResolvedValue([]);

      await repository.findRecent();

      expect(prisma.searchHistory.findMany).toHaveBeenCalledWith({
        orderBy: { searchedAt: 'desc' },
        take: 20, // DEFAULT_LIMIT
      });
    });
  });

  describe('deleteById', () => {
    it('should delete search history by id', async () => {
      vi.mocked(prisma.searchHistory.delete).mockResolvedValue({
        id: 'history-1',
        query: 'test',
        searchedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await repository.deleteById('history-1');

      expect(prisma.searchHistory.delete).toHaveBeenCalledWith({
        where: { id: 'history-1' },
      });
    });

    it('should throw when deleting non-existent history', async () => {
      vi.mocked(prisma.searchHistory.delete).mockRejectedValue(
        new Error('Record not found'),
      );

      await expect(repository.deleteById('non-existent')).rejects.toThrow();
    });
  });

  describe('deleteAll', () => {
    it('should delete all search history', async () => {
      vi.mocked(prisma.searchHistory.deleteMany).mockResolvedValue({ count: 5 });

      await repository.deleteAll();

      expect(prisma.searchHistory.deleteMany).toHaveBeenCalled();
    });
  });
});
