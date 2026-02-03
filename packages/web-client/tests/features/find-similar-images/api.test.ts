import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchSimilarImages } from '@/features/find-similar-images/api/similar';
import { apiClient } from '@/shared/api/client';

vi.mock('@/shared/api/client');

describe('find-similar-images/api', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchSimilarImages', () => {
    it('should fetch similar images', async () => {
      const mockResponse = {
        imageId: 'img-1',
        similarImages: [{ id: 'img-2', title: 'Similar', thumbnailPath: '/thumb/2', distance: 0.1 }],
      };
      vi.mocked(apiClient).mockResolvedValue(mockResponse);

      const result = await fetchSimilarImages('img-1');

      expect(apiClient).toHaveBeenCalledWith('/api/images/img-1/similar');
      expect(result).toEqual(mockResponse);
    });

    it('should fetch with limit option', async () => {
      vi.mocked(apiClient).mockResolvedValue({ imageId: 'img-1', similarImages: [] });

      await fetchSimilarImages('img-1', { limit: 5 });

      expect(apiClient).toHaveBeenCalledWith('/api/images/img-1/similar?limit=5');
    });
  });
});
