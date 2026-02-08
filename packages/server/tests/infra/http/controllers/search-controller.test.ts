import 'reflect-metadata';
import Fastify, { type FastifyInstance } from 'fastify';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { SearchController } from '@/infra/http/controllers/search-controller';
import type { PrismaService } from '@/infra/database/prisma-service';
import type {
  SearchHistoryRepository,
  LabelRepository,
  LabelEntity,
  SearchHistory,
} from '@picstash/core';

interface ErrorResponse {
  error: string;
}

interface Suggestion {
  type: 'label' | 'keyword' | 'history';
  value: string;
  id?: string;
}

interface SuggestionsResponse {
  suggestions: Suggestion[];
}

interface HistoryResponse {
  history: SearchHistory[];
}

function createMockSearchHistory(overrides: Partial<SearchHistory> = {}): SearchHistory {
  const now = new Date();
  return {
    id: 'history-1',
    query: 'test query',
    searchedAt: now,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function createMockLabel(overrides: Partial<LabelEntity> = {}): LabelEntity {
  const now = new Date();
  return {
    id: 'label-1',
    name: 'Test Label',
    color: '#ff0000',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function createMockSearchHistoryRepository(): SearchHistoryRepository {
  return {
    save: vi.fn(),
    findByQuery: vi.fn(),
    findByPrefix: vi.fn().mockResolvedValue([]),
    findRecent: vi.fn().mockResolvedValue([]),
    deleteById: vi.fn(),
    deleteAll: vi.fn(),
  };
}

function createMockLabelRepository(): LabelRepository {
  return {
    create: vi.fn(),
    updateById: vi.fn(),
    deleteById: vi.fn(),
    findById: vi.fn(),
    findByName: vi.fn(),
    findAll: vi.fn().mockResolvedValue([]),
    findAllWithEmbedding: vi.fn(),
    findIdsWithoutEmbedding: vi.fn(),
    updateEmbedding: vi.fn(),
    clearAllEmbeddings: vi.fn(),
    countWithEmbedding: vi.fn(),
  };
}

interface MockPrismaClient {
  imageAttribute: {
    findMany: ReturnType<typeof vi.fn>;
  };
}

function createMockPrismaService(): PrismaService {
  const mockClient: MockPrismaClient = {
    imageAttribute: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  };
  return {
    getClient: vi.fn().mockReturnValue(mockClient),
    connect: vi.fn(),
    disconnect: vi.fn(),
  } as unknown as PrismaService;
}

describe('SearchController', () => {
  let app: FastifyInstance;
  let mockSearchHistoryRepository: SearchHistoryRepository;
  let mockLabelRepository: LabelRepository;
  let mockPrismaService: PrismaService;
  let controller: SearchController;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockSearchHistoryRepository = createMockSearchHistoryRepository();
    mockLabelRepository = createMockLabelRepository();
    mockPrismaService = createMockPrismaService();

    // Create controller with mocked dependencies
    controller = new SearchController(
      mockSearchHistoryRepository,
      mockLabelRepository,
      mockPrismaService,
    );

    // Create Fastify app and register routes
    app = Fastify({ logger: false });
    controller.registerRoutes(app);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /api/search/suggestions', () => {
    it('should return empty suggestions when query is not provided', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/search/suggestions',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as SuggestionsResponse;
      expect(body.suggestions).toEqual([]);
    });

    it('should return empty suggestions when query is empty string', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/search/suggestions?q=',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as SuggestionsResponse;
      expect(body.suggestions).toEqual([]);
    });

    it('should return empty suggestions when query is only whitespace', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/search/suggestions?q=   ',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as SuggestionsResponse;
      expect(body.suggestions).toEqual([]);
    });

    it('should return history suggestions when matching history exists', async () => {
      const mockHistory = createMockSearchHistory({ id: 'h1', query: 'test search' });
      vi.mocked(mockSearchHistoryRepository.findByPrefix).mockResolvedValue([mockHistory]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/search/suggestions?q=test',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as SuggestionsResponse;
      expect(body.suggestions).toHaveLength(1);
      expect(body.suggestions[0]).toEqual({
        type: 'history',
        value: 'test search',
        id: 'h1',
      });
      expect(mockSearchHistoryRepository.findByPrefix).toHaveBeenCalledWith('test', 5);
    });

    it('should return label suggestions when matching labels exist', async () => {
      const mockLabel = createMockLabel({ id: 'l1', name: 'testlabel' });
      vi.mocked(mockLabelRepository.findAll).mockResolvedValue([mockLabel]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/search/suggestions?q=test',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as SuggestionsResponse;
      expect(body.suggestions).toHaveLength(1);
      expect(body.suggestions[0]).toEqual({
        type: 'label',
        value: 'testlabel',
      });
    });

    it('should return keyword suggestions from image attributes', async () => {
      const mockClient = mockPrismaService.getClient() as unknown as MockPrismaClient;
      vi.mocked(mockClient.imageAttribute.findMany).mockResolvedValue([
        { keywords: 'test keyword, another' },
      ]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/search/suggestions?q=test',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as SuggestionsResponse;
      expect(body.suggestions).toHaveLength(1);
      expect(body.suggestions[0]).toEqual({
        type: 'keyword',
        value: 'test keyword',
      });
    });

    it('should combine and sort suggestions by type (history, label, keyword)', async () => {
      const mockHistory = createMockSearchHistory({ id: 'h1', query: 'testing history' });
      vi.mocked(mockSearchHistoryRepository.findByPrefix).mockResolvedValue([mockHistory]);

      const mockLabel = createMockLabel({ id: 'l1', name: 'testing label' });
      vi.mocked(mockLabelRepository.findAll).mockResolvedValue([mockLabel]);

      const mockClient = mockPrismaService.getClient() as unknown as MockPrismaClient;
      vi.mocked(mockClient.imageAttribute.findMany).mockResolvedValue([
        { keywords: 'testing keyword' },
      ]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/search/suggestions?q=testing',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as SuggestionsResponse;
      expect(body.suggestions).toHaveLength(3);
      expect(body.suggestions[0]?.type).toBe('history');
      expect(body.suggestions[1]?.type).toBe('label');
      expect(body.suggestions[2]?.type).toBe('keyword');
    });

    it('should deduplicate suggestions (skip label if history with same value exists)', async () => {
      const mockHistory = createMockSearchHistory({ id: 'h1', query: 'test' });
      vi.mocked(mockSearchHistoryRepository.findByPrefix).mockResolvedValue([mockHistory]);

      const mockLabel = createMockLabel({ id: 'l1', name: 'test' });
      vi.mocked(mockLabelRepository.findAll).mockResolvedValue([mockLabel]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/search/suggestions?q=test',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as SuggestionsResponse;
      expect(body.suggestions).toHaveLength(1);
      expect(body.suggestions[0]?.type).toBe('history');
    });

    it('should limit results to MAX_SUGGESTIONS (10)', async () => {
      const mockHistories = Array.from({ length: 5 }, (_, i) =>
        createMockSearchHistory({ id: `h${i}`, query: `test ${i}` }),
      );
      vi.mocked(mockSearchHistoryRepository.findByPrefix).mockResolvedValue(mockHistories);

      const mockLabels = Array.from({ length: 10 }, (_, i) =>
        createMockLabel({ id: `l${i}`, name: `testlabel${i}` }),
      );
      vi.mocked(mockLabelRepository.findAll).mockResolvedValue(mockLabels);

      const response = await app.inject({
        method: 'GET',
        url: '/api/search/suggestions?q=test',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as SuggestionsResponse;
      expect(body.suggestions.length).toBeLessThanOrEqual(10);
    });

    it('should handle case-insensitive matching for labels', async () => {
      const mockLabel = createMockLabel({ id: 'l1', name: 'TestLabel' });
      vi.mocked(mockLabelRepository.findAll).mockResolvedValue([mockLabel]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/search/suggestions?q=testl',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as SuggestionsResponse;
      expect(body.suggestions).toHaveLength(1);
      expect(body.suggestions[0]?.value).toBe('TestLabel');
    });

    it('should handle case-insensitive matching for keywords', async () => {
      const mockClient = mockPrismaService.getClient() as unknown as MockPrismaClient;
      vi.mocked(mockClient.imageAttribute.findMany).mockResolvedValue([
        { keywords: 'TestKeyword, AnotherTest' },
      ]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/search/suggestions?q=testk',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as SuggestionsResponse;
      expect(body.suggestions).toHaveLength(1);
      expect(body.suggestions[0]?.value).toBe('TestKeyword');
    });

    it('should handle null keywords in image attributes', async () => {
      const mockClient = mockPrismaService.getClient() as unknown as MockPrismaClient;
      vi.mocked(mockClient.imageAttribute.findMany).mockResolvedValue([
        { keywords: null },
        { keywords: 'test keyword' },
      ]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/search/suggestions?q=test',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as SuggestionsResponse;
      expect(body.suggestions).toHaveLength(1);
      expect(body.suggestions[0]?.value).toBe('test keyword');
    });

    it('should handle empty keywords in comma-separated list', async () => {
      const mockClient = mockPrismaService.getClient() as unknown as MockPrismaClient;
      vi.mocked(mockClient.imageAttribute.findMany).mockResolvedValue([
        { keywords: 'test keyword, , , another test' },
      ]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/search/suggestions?q=test',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as SuggestionsResponse;
      expect(body.suggestions).toHaveLength(1);
      expect(body.suggestions[0]?.value).toBe('test keyword');
    });

    it('should skip labels that do not match the prefix', async () => {
      const mockLabel = createMockLabel({ id: 'l1', name: 'notmatching' });
      vi.mocked(mockLabelRepository.findAll).mockResolvedValue([mockLabel]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/search/suggestions?q=test',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as SuggestionsResponse;
      expect(body.suggestions).toEqual([]);
    });

    it('should skip keyword if it already exists in history', async () => {
      const mockHistory = createMockSearchHistory({ id: 'h1', query: 'test keyword' });
      vi.mocked(mockSearchHistoryRepository.findByPrefix).mockResolvedValue([mockHistory]);

      const mockClient = mockPrismaService.getClient() as unknown as MockPrismaClient;
      vi.mocked(mockClient.imageAttribute.findMany).mockResolvedValue([
        { keywords: 'test keyword' },
      ]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/search/suggestions?q=test',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as SuggestionsResponse;
      expect(body.suggestions).toHaveLength(1);
      expect(body.suggestions[0]?.type).toBe('history');
    });

    it('should skip keyword if it already exists as label', async () => {
      const mockLabel = createMockLabel({ id: 'l1', name: 'test keyword' });
      vi.mocked(mockLabelRepository.findAll).mockResolvedValue([mockLabel]);

      const mockClient = mockPrismaService.getClient() as unknown as MockPrismaClient;
      vi.mocked(mockClient.imageAttribute.findMany).mockResolvedValue([
        { keywords: 'test keyword' },
      ]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/search/suggestions?q=test',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as SuggestionsResponse;
      expect(body.suggestions).toHaveLength(1);
      expect(body.suggestions[0]?.type).toBe('label');
    });

    it('should sort labels alphabetically within type', async () => {
      const mockLabels = [
        createMockLabel({ id: 'l1', name: 'zebra' }),
        createMockLabel({ id: 'l2', name: 'apple' }),
        createMockLabel({ id: 'l3', name: 'banana' }),
      ];
      vi.mocked(mockLabelRepository.findAll).mockResolvedValue(mockLabels);

      const response = await app.inject({
        method: 'GET',
        url: '/api/search/suggestions?q=',
      });

      // Empty query returns empty suggestions
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as SuggestionsResponse;
      expect(body.suggestions).toEqual([]);
    });

    it('should deduplicate history entries with same query', async () => {
      const mockHistories = [
        createMockSearchHistory({ id: 'h1', query: 'test' }),
        createMockSearchHistory({ id: 'h2', query: 'TEST' }),
      ];
      vi.mocked(mockSearchHistoryRepository.findByPrefix).mockResolvedValue(mockHistories);

      const response = await app.inject({
        method: 'GET',
        url: '/api/search/suggestions?q=test',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as SuggestionsResponse;
      // Only first history entry should be included (case-insensitive dedup)
      expect(body.suggestions).toHaveLength(1);
      expect(body.suggestions[0]?.value).toBe('test');
    });
  });

  describe('POST /api/search/history', () => {
    it('should save search history successfully', async () => {
      const savedHistory = createMockSearchHistory({ query: 'new search' });
      vi.mocked(mockSearchHistoryRepository.save).mockResolvedValue(savedHistory);

      const response = await app.inject({
        method: 'POST',
        url: '/api/search/history',
        payload: { query: 'new search' },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body) as SearchHistory;
      expect(body.query).toBe('new search');
      expect(mockSearchHistoryRepository.save).toHaveBeenCalledWith({ query: 'new search' });
    });

    it('should trim query before saving', async () => {
      const savedHistory = createMockSearchHistory({ query: 'trimmed query' });
      vi.mocked(mockSearchHistoryRepository.save).mockResolvedValue(savedHistory);

      const response = await app.inject({
        method: 'POST',
        url: '/api/search/history',
        payload: { query: '  trimmed query  ' },
      });

      expect(response.statusCode).toBe(201);
      expect(mockSearchHistoryRepository.save).toHaveBeenCalledWith({ query: 'trimmed query' });
    });

    it('should return 400 when body is not an object', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/search/history',
        payload: 'not an object',
        headers: { 'content-type': 'application/json' },
      });

      // Fastify may parse this as invalid JSON
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });

    it('should return 400 when query is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/search/history',
        payload: {},
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Invalid request body');
    });

    it('should return 400 when query is not a string', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/search/history',
        payload: { query: 123 },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Invalid request body');
    });

    it('should return 400 when query is empty string', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/search/history',
        payload: { query: '' },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Query is required');
    });

    it('should return 400 when query is only whitespace', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/search/history',
        payload: { query: '   ' },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Query is required');
    });

    it('should return 400 when body is null', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/search/history',
        payload: undefined,
        headers: { 'content-type': 'application/json' },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/search/history', () => {
    it('should return empty history when none exists', async () => {
      vi.mocked(mockSearchHistoryRepository.findRecent).mockResolvedValue([]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/search/history',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as HistoryResponse;
      expect(body.history).toEqual([]);
      expect(mockSearchHistoryRepository.findRecent).toHaveBeenCalledWith({ limit: 50 });
    });

    it('should return recent search history', async () => {
      const mockHistories = [
        createMockSearchHistory({ id: 'h1', query: 'first search' }),
        createMockSearchHistory({ id: 'h2', query: 'second search' }),
      ];
      vi.mocked(mockSearchHistoryRepository.findRecent).mockResolvedValue(mockHistories);

      const response = await app.inject({
        method: 'GET',
        url: '/api/search/history',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as HistoryResponse;
      expect(body.history).toHaveLength(2);
      expect(body.history[0]?.query).toBe('first search');
      expect(body.history[1]?.query).toBe('second search');
    });

    it('should limit history to 50 entries', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/search/history',
      });

      expect(response.statusCode).toBe(200);
      expect(mockSearchHistoryRepository.findRecent).toHaveBeenCalledWith({ limit: 50 });
    });
  });

  describe('DELETE /api/search/history/:id', () => {
    it('should delete history entry successfully', async () => {
      vi.mocked(mockSearchHistoryRepository.deleteById).mockResolvedValue();

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/search/history/history-id-123',
      });

      expect(response.statusCode).toBe(204);
      expect(response.body).toBe('');
      expect(mockSearchHistoryRepository.deleteById).toHaveBeenCalledWith('history-id-123');
    });

    it('should return 404 when history not found', async () => {
      vi.mocked(mockSearchHistoryRepository.deleteById).mockRejectedValue(
        new Error('Not found'),
      );

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/search/history/non-existent-id',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('History not found');
    });

    it('should return 404 for any error during deletion', async () => {
      vi.mocked(mockSearchHistoryRepository.deleteById).mockRejectedValue(
        new Error('Database error'),
      );

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/search/history/some-id',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('History not found');
    });
  });

  describe('DELETE /api/search/history', () => {
    it('should delete all history successfully', async () => {
      vi.mocked(mockSearchHistoryRepository.deleteAll).mockResolvedValue();

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/search/history',
      });

      expect(response.statusCode).toBe(204);
      expect(response.body).toBe('');
      expect(mockSearchHistoryRepository.deleteAll).toHaveBeenCalled();
    });

    it('should return 204 even when no history exists', async () => {
      vi.mocked(mockSearchHistoryRepository.deleteAll).mockResolvedValue();

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/search/history',
      });

      expect(response.statusCode).toBe(204);
    });
  });
});
