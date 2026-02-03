import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchSearchSuggestions,
  saveSearchHistory,
  fetchSearchHistory,
  deleteSearchHistory,
  deleteAllSearchHistory,
} from '@/features/search-images/api/search';
import { apiClient } from '@/shared/api/client';

vi.mock('@/shared/api/client');

describe('search-images/api', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchSearchSuggestions', () => {
    it('should fetch search suggestions', async () => {
      const mockResponse = {
        suggestions: [{ type: 'label' as const, value: 'cat' }],
      };
      vi.mocked(apiClient).mockResolvedValue(mockResponse);

      const result = await fetchSearchSuggestions('ca');

      expect(apiClient).toHaveBeenCalledWith('/api/search/suggestions?q=ca');
      expect(result).toEqual(mockResponse);
    });

    it('should return empty suggestions for empty query', async () => {
      const result = await fetchSearchSuggestions('  ');

      expect(apiClient).not.toHaveBeenCalled();
      expect(result).toEqual({ suggestions: [] });
    });
  });

  describe('saveSearchHistory', () => {
    it('should save search history', async () => {
      const mockHistory = { id: 'sh-1', query: 'test', searchedAt: '2026-01-01T00:00:00Z' };
      vi.mocked(apiClient).mockResolvedValue(mockHistory);

      const result = await saveSearchHistory('test');

      expect(apiClient).toHaveBeenCalledWith('/api/search/history', {
        method: 'POST',
        body: JSON.stringify({ query: 'test' }),
      });
      expect(result).toEqual(mockHistory);
    });
  });

  describe('fetchSearchHistory', () => {
    it('should fetch search history', async () => {
      const mockResponse = { history: [{ id: 'sh-1', query: 'test' }] };
      vi.mocked(apiClient).mockResolvedValue(mockResponse);

      const result = await fetchSearchHistory();

      expect(apiClient).toHaveBeenCalledWith('/api/search/history');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deleteSearchHistory', () => {
    it('should delete a search history entry', async () => {
      vi.mocked(apiClient).mockResolvedValue(undefined);

      await deleteSearchHistory('sh-1');

      expect(apiClient).toHaveBeenCalledWith('/api/search/history/sh-1', { method: 'DELETE' });
    });
  });

  describe('deleteAllSearchHistory', () => {
    it('should delete all search history', async () => {
      vi.mocked(apiClient).mockResolvedValue(undefined);

      await deleteAllSearchHistory();

      expect(apiClient).toHaveBeenCalledWith('/api/search/history', { method: 'DELETE' });
    });
  });
});
