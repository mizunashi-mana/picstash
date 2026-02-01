import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchImages,
  fetchImagesPaginated,
  fetchImage,
  deleteImage,
  updateImage,
  getImageUrl,
  getThumbnailUrl,
} from '@/entities/image';
import { apiClient } from '@/shared/api/client';

vi.mock('@/shared/api/client');

describe('entities/image/api', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchImages', () => {
    it('should fetch all images without query', async () => {
      const mockImages = [{ id: '1', title: 'Image 1' }];
      vi.mocked(apiClient).mockResolvedValue(mockImages);

      const result = await fetchImages();

      expect(apiClient).toHaveBeenCalledWith('/api/images');
      expect(result).toEqual(mockImages);
    });

    it('should fetch images with search query', async () => {
      const mockImages = [{ id: '1', title: 'Cat' }];
      vi.mocked(apiClient).mockResolvedValue(mockImages);

      const result = await fetchImages('cat');

      expect(apiClient).toHaveBeenCalledWith('/api/images?q=cat');
      expect(result).toEqual(mockImages);
    });

    it('should trim query and ignore empty strings', async () => {
      vi.mocked(apiClient).mockResolvedValue([]);

      await fetchImages('  ');

      expect(apiClient).toHaveBeenCalledWith('/api/images');
    });
  });

  describe('fetchImagesPaginated', () => {
    it('should fetch paginated images with default options', async () => {
      const mockResult = { items: [], total: 0, limit: 50, offset: 0 };
      vi.mocked(apiClient).mockResolvedValue(mockResult);

      const result = await fetchImagesPaginated();

      expect(apiClient).toHaveBeenCalledWith('/api/images?limit=50&offset=0');
      expect(result).toEqual(mockResult);
    });

    it('should fetch paginated images with custom options', async () => {
      const mockResult = { items: [], total: 100, limit: 10, offset: 20 };
      vi.mocked(apiClient).mockResolvedValue(mockResult);

      await fetchImagesPaginated('test', { limit: 10, offset: 20 });

      expect(apiClient).toHaveBeenCalledWith('/api/images?q=test&limit=10&offset=20');
    });
  });

  describe('fetchImage', () => {
    it('should fetch a specific image', async () => {
      const mockImage = { id: '1', title: 'Image 1' };
      vi.mocked(apiClient).mockResolvedValue(mockImage);

      const result = await fetchImage('1');

      expect(apiClient).toHaveBeenCalledWith('/api/images/1');
      expect(result).toEqual(mockImage);
    });
  });

  describe('deleteImage', () => {
    it('should delete an image', async () => {
      vi.mocked(apiClient).mockResolvedValue(undefined);

      await deleteImage('1');

      expect(apiClient).toHaveBeenCalledWith('/api/images/1', { method: 'DELETE' });
    });
  });

  describe('updateImage', () => {
    it('should update an image', async () => {
      const mockImage = { id: '1', description: 'Updated' };
      vi.mocked(apiClient).mockResolvedValue(mockImage);

      const result = await updateImage('1', { description: 'Updated' });

      expect(apiClient).toHaveBeenCalledWith('/api/images/1', {
        method: 'PATCH',
        body: JSON.stringify({ description: 'Updated' }),
      });
      expect(result).toEqual(mockImage);
    });
  });

  describe('getImageUrl', () => {
    it('should return the image file URL', () => {
      const url = getImageUrl('img-1');
      expect(url).toBe('/api/images/img-1/file');
    });
  });

  describe('getThumbnailUrl', () => {
    it('should return the thumbnail URL', () => {
      const url = getThumbnailUrl('img-1');
      expect(url).toBe('/api/images/img-1/thumbnail');
    });
  });
});
