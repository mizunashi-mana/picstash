import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchOverviewStats,
  fetchViewTrends,
  fetchRecommendationTrends,
  fetchPopularImages,
} from '@/features/stats/api';
import { apiClient } from '@/shared/api/client';

vi.mock('@/shared/api/client');

describe('stats/api', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchOverviewStats', () => {
    it('should fetch overview stats without options', async () => {
      const mockStats = {
        totalImages: 100,
        totalViews: 500,
        totalViewDuration: 10000,
        conversionRate: 0.15,
        avgViewDuration: 200,
      };
      vi.mocked(apiClient).mockResolvedValue(mockStats);

      const result = await fetchOverviewStats();

      expect(apiClient).toHaveBeenCalledWith('/api/stats/overview');
      expect(result).toEqual(mockStats);
    });

    it('should fetch overview stats with days option', async () => {
      const mockStats = { totalImages: 50 };
      vi.mocked(apiClient).mockResolvedValue(mockStats);

      await fetchOverviewStats({ days: 7 });

      expect(apiClient).toHaveBeenCalledWith('/api/stats/overview?days=7');
    });
  });

  describe('fetchViewTrends', () => {
    it('should fetch view trends', async () => {
      const mockTrends = [
        { date: '2026-01-01', viewCount: 10, totalDuration: 1000 },
        { date: '2026-01-02', viewCount: 15, totalDuration: 1500 },
      ];
      vi.mocked(apiClient).mockResolvedValue(mockTrends);

      const result = await fetchViewTrends();

      expect(apiClient).toHaveBeenCalledWith('/api/stats/view-trends');
      expect(result).toEqual(mockTrends);
    });

    it('should fetch view trends with days option', async () => {
      vi.mocked(apiClient).mockResolvedValue([]);

      await fetchViewTrends({ days: 30 });

      expect(apiClient).toHaveBeenCalledWith('/api/stats/view-trends?days=30');
    });
  });

  describe('fetchRecommendationTrends', () => {
    it('should fetch recommendation trends', async () => {
      const mockTrends = [
        { date: '2026-01-01', impressions: 100, clicks: 15, conversionRate: 0.15 },
      ];
      vi.mocked(apiClient).mockResolvedValue(mockTrends);

      const result = await fetchRecommendationTrends();

      expect(apiClient).toHaveBeenCalledWith('/api/stats/recommendation-trends');
      expect(result).toEqual(mockTrends);
    });

    it('should fetch recommendation trends with days option', async () => {
      vi.mocked(apiClient).mockResolvedValue([]);

      await fetchRecommendationTrends({ days: 14 });

      expect(apiClient).toHaveBeenCalledWith('/api/stats/recommendation-trends?days=14');
    });
  });

  describe('fetchPopularImages', () => {
    it('should fetch popular images', async () => {
      const mockImages = [
        { id: '1', title: 'Popular Image', thumbnailPath: '/thumb/1', viewCount: 100, totalDuration: 5000, lastViewedAt: '2026-01-01T00:00:00Z' },
      ];
      vi.mocked(apiClient).mockResolvedValue(mockImages);

      const result = await fetchPopularImages();

      expect(apiClient).toHaveBeenCalledWith('/api/stats/popular-images');
      expect(result).toEqual(mockImages);
    });

    it('should fetch popular images with limit', async () => {
      vi.mocked(apiClient).mockResolvedValue([]);

      await fetchPopularImages({ limit: 5 });

      expect(apiClient).toHaveBeenCalledWith('/api/stats/popular-images?limit=5');
    });

    it('should fetch popular images with days and limit', async () => {
      vi.mocked(apiClient).mockResolvedValue([]);

      await fetchPopularImages({ days: 7, limit: 10 });

      expect(apiClient).toHaveBeenCalledWith('/api/stats/popular-images?days=7&limit=10');
    });
  });
});
