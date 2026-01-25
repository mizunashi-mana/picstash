import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '@/api/client';
import { fetchDuplicates, deleteDuplicateImage } from '@/features/duplicates/api';

vi.mock('@/api/client');

describe('duplicates/api', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchDuplicates', () => {
    it('should fetch duplicates without options', async () => {
      const mockResponse = {
        groups: [
          {
            original: { id: '1', title: 'Original', thumbnailPath: '/thumb/1', createdAt: '2026-01-01T00:00:00Z' },
            duplicates: [
              { id: '2', title: 'Duplicate', thumbnailPath: '/thumb/2', createdAt: '2026-01-01T00:00:00Z', distance: 0.1 },
            ],
          },
        ],
        totalGroups: 1,
        totalDuplicates: 1,
      };
      vi.mocked(apiClient).mockResolvedValue(mockResponse);

      const result = await fetchDuplicates();

      expect(apiClient).toHaveBeenCalledWith('/images/duplicates');
      expect(result).toEqual(mockResponse);
    });

    it('should fetch duplicates with threshold option', async () => {
      const mockResponse = { groups: [], totalGroups: 0, totalDuplicates: 0 };
      vi.mocked(apiClient).mockResolvedValue(mockResponse);

      await fetchDuplicates({ threshold: 0.5 });

      expect(apiClient).toHaveBeenCalledWith('/images/duplicates?threshold=0.5');
    });
  });

  describe('deleteDuplicateImage', () => {
    it('should delete a duplicate image', async () => {
      vi.mocked(apiClient).mockResolvedValue(undefined);

      await deleteDuplicateImage('img-1');

      expect(apiClient).toHaveBeenCalledWith('/images/img-1', { method: 'DELETE' });
    });
  });
});
