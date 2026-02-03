import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchImageViewStats,
  fetchViewHistory,
  recordViewEnd,
  recordViewStart,
} from '@/features/track-view-history/api/view-history';

describe('view-history/api', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetAllMocks();
  });

  describe('recordViewStart', () => {
    it('should POST to create a new view history record', async () => {
      const mockViewHistory = {
        id: 'vh-1',
        imageId: 'img-1',
        viewedAt: '2024-01-01T00:00:00Z',
        duration: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockViewHistory,
      });

      const result = await recordViewStart('img-1');

      expect(mockFetch).toHaveBeenCalledWith('/api/view-history', {
        method: 'POST',
        body: JSON.stringify({ imageId: 'img-1' }),
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result).toEqual(mockViewHistory);
    });
  });

  describe('recordViewEnd', () => {
    it('should PATCH to update view history with duration', async () => {
      const mockViewHistory = {
        id: 'vh-1',
        imageId: 'img-1',
        viewedAt: '2024-01-01T00:00:00Z',
        duration: 5000,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockViewHistory,
      });

      const result = await recordViewEnd('vh-1', 5000);

      expect(mockFetch).toHaveBeenCalledWith('/api/view-history/vh-1', {
        method: 'PATCH',
        body: JSON.stringify({ duration: 5000 }),
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result).toEqual(mockViewHistory);
    });
  });

  describe('fetchViewHistory', () => {
    it('should GET view history list', async () => {
      const mockHistory = [
        {
          id: 'vh-1',
          imageId: 'img-1',
          viewedAt: '2024-01-01T00:00:00Z',
          duration: 5000,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          image: { id: 'img-1', title: 'Test Image', thumbnailPath: '/thumb.jpg' },
        },
      ];
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockHistory,
      });

      const result = await fetchViewHistory();

      expect(mockFetch).toHaveBeenCalledWith('/api/view-history', expect.any(Object));
      expect(result).toEqual(mockHistory);
    });

    it('should include pagination params', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [],
      });

      await fetchViewHistory({ limit: 20, offset: 10 });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/view-history?limit=20&offset=10',
        expect.any(Object),
      );
    });
  });

  describe('fetchImageViewStats', () => {
    it('should GET view stats for an image', async () => {
      const mockStats = {
        viewCount: 10,
        totalDuration: 50000,
        lastViewedAt: '2024-01-01T00:00:00Z',
      };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockStats,
      });

      const result = await fetchImageViewStats('img-1');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/images/img-1/view-stats',
        expect.any(Object),
      );
      expect(result).toEqual(mockStats);
    });
  });
});
