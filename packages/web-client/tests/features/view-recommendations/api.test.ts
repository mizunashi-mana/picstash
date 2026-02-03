import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchRecommendations,
  recordImpressions,
  recordRecommendationClick,
} from '@/features/view-recommendations/api/recommendations';
import { apiClient } from '@/shared/api/client';

vi.mock('@/shared/api/client');

describe('recommendations/api', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchRecommendations', () => {
    it('should fetch recommendations without options', async () => {
      const mockResult = {
        recommendations: [
          { id: '1', title: 'Image 1', thumbnailPath: '/thumb/1', score: 0.9 },
        ],
      };
      vi.mocked(apiClient).mockResolvedValue(mockResult);

      const result = await fetchRecommendations();

      expect(apiClient).toHaveBeenCalledWith('/recommendations');
      expect(result).toEqual(mockResult);
    });

    it('should fetch recommendations with limit option', async () => {
      const mockResult = { recommendations: [] };
      vi.mocked(apiClient).mockResolvedValue(mockResult);

      await fetchRecommendations({ limit: 10 });

      expect(apiClient).toHaveBeenCalledWith('/recommendations?limit=10');
    });

    it('should fetch recommendations with historyDays option', async () => {
      const mockResult = { recommendations: [] };
      vi.mocked(apiClient).mockResolvedValue(mockResult);

      await fetchRecommendations({ historyDays: 7 });

      expect(apiClient).toHaveBeenCalledWith('/recommendations?historyDays=7');
    });

    it('should fetch recommendations with both options', async () => {
      const mockResult = { recommendations: [] };
      vi.mocked(apiClient).mockResolvedValue(mockResult);

      await fetchRecommendations({ limit: 5, historyDays: 14 });

      expect(apiClient).toHaveBeenCalledWith(
        '/recommendations?limit=5&historyDays=14',
      );
    });

    it('should return reason when no recommendations available', async () => {
      const mockResult = {
        recommendations: [],
        reason: 'no_history' as const,
      };
      vi.mocked(apiClient).mockResolvedValue(mockResult);

      const result = await fetchRecommendations();

      expect(result.reason).toBe('no_history');
    });
  });

  describe('recordImpressions', () => {
    it('should record impressions', async () => {
      const input = [
        { imageId: 'img-1', score: 0.9 },
        { imageId: 'img-2', score: 0.8 },
      ];
      const mockResult = { ids: ['conv-1', 'conv-2'] };
      vi.mocked(apiClient).mockResolvedValue(mockResult);

      const result = await recordImpressions(input);

      expect(apiClient).toHaveBeenCalledWith(
        '/recommendation-conversions/impressions',
        {
          method: 'POST',
          body: JSON.stringify({ recommendations: input }),
        },
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('recordRecommendationClick', () => {
    it('should record a click on a recommendation', async () => {
      const input = { viewHistoryId: 'vh-1' };
      const mockConversion = {
        id: 'conv-1',
        imageId: 'img-1',
        recommendationScore: 0.9,
        impressionAt: '2026-01-01T00:00:00Z',
        clickedAt: '2026-01-01T00:01:00Z',
        viewHistoryId: 'vh-1',
        createdAt: '2026-01-01T00:00:00Z',
      };
      vi.mocked(apiClient).mockResolvedValue(mockConversion);

      const result = await recordRecommendationClick('conv-1', input);

      expect(apiClient).toHaveBeenCalledWith(
        '/recommendation-conversions/conv-1/click',
        {
          method: 'PATCH',
          body: JSON.stringify(input),
        },
      );
      expect(result).toEqual(mockConversion);
    });
  });
});
