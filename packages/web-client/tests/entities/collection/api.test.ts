import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchCollections,
  fetchCollection,
  createCollection,
  updateCollection,
  deleteCollection,
  addImageToCollection,
  removeImageFromCollection,
  updateImageOrder,
  fetchImageCollections,
} from '@/entities/collection';
import { apiClient } from '@/shared/api/client';

vi.mock('@/shared/api/client');

describe('entities/collection/api', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchCollections', () => {
    it('should fetch all collections with counts', async () => {
      const mockCollections = [
        { id: '1', name: 'Collection 1', description: null, coverImageId: null, imageCount: 5 },
        { id: '2', name: 'Collection 2', description: 'Test', coverImageId: 'img-1', imageCount: 10 },
      ];
      vi.mocked(apiClient).mockResolvedValue(mockCollections);

      const result = await fetchCollections();

      expect(apiClient).toHaveBeenCalledWith('/api/collections');
      expect(result).toEqual(mockCollections);
    });
  });

  describe('fetchCollection', () => {
    it('should fetch a specific collection with images', async () => {
      const mockCollection = {
        id: '1',
        name: 'Collection 1',
        description: null,
        coverImageId: null,
        images: [
          { id: 'ci-1', imageId: 'img-1', order: 0, title: 'Image 1', thumbnailPath: '/thumb/1' },
        ],
      };
      vi.mocked(apiClient).mockResolvedValue(mockCollection);

      const result = await fetchCollection('1');

      expect(apiClient).toHaveBeenCalledWith('/api/collections/1');
      expect(result).toEqual(mockCollection);
    });
  });

  describe('createCollection', () => {
    it('should create a new collection', async () => {
      const input = { name: 'New Collection' };
      const mockCollection = { id: '3', name: 'New Collection', description: null, coverImageId: null };
      vi.mocked(apiClient).mockResolvedValue(mockCollection);

      const result = await createCollection(input);

      expect(apiClient).toHaveBeenCalledWith('/api/collections', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      expect(result).toEqual(mockCollection);
    });

    it('should create a collection with description and cover image', async () => {
      const input = { name: 'New Collection', description: 'Test', coverImageId: 'img-1' };
      const mockCollection = { id: '3', ...input };
      vi.mocked(apiClient).mockResolvedValue(mockCollection);

      const result = await createCollection(input);

      expect(apiClient).toHaveBeenCalledWith('/api/collections', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      expect(result).toEqual(mockCollection);
    });
  });

  describe('updateCollection', () => {
    it('should update a collection', async () => {
      const input = { name: 'Updated Name' };
      const mockCollection = { id: '1', name: 'Updated Name', description: null, coverImageId: null };
      vi.mocked(apiClient).mockResolvedValue(mockCollection);

      const result = await updateCollection('1', input);

      expect(apiClient).toHaveBeenCalledWith('/api/collections/1', {
        method: 'PUT',
        body: JSON.stringify(input),
      });
      expect(result).toEqual(mockCollection);
    });
  });

  describe('deleteCollection', () => {
    it('should delete a collection', async () => {
      vi.mocked(apiClient).mockResolvedValue(undefined);

      await deleteCollection('1');

      expect(apiClient).toHaveBeenCalledWith('/api/collections/1', { method: 'DELETE' });
    });
  });

  describe('addImageToCollection', () => {
    it('should add an image to a collection', async () => {
      vi.mocked(apiClient).mockResolvedValue(undefined);

      await addImageToCollection('col-1', { imageId: 'img-1' });

      expect(apiClient).toHaveBeenCalledWith('/api/collections/col-1/images', {
        method: 'POST',
        body: JSON.stringify({ imageId: 'img-1' }),
      });
    });

    it('should add an image with specific order', async () => {
      vi.mocked(apiClient).mockResolvedValue(undefined);

      await addImageToCollection('col-1', { imageId: 'img-1', order: 5 });

      expect(apiClient).toHaveBeenCalledWith('/api/collections/col-1/images', {
        method: 'POST',
        body: JSON.stringify({ imageId: 'img-1', order: 5 }),
      });
    });
  });

  describe('removeImageFromCollection', () => {
    it('should remove an image from a collection', async () => {
      vi.mocked(apiClient).mockResolvedValue(undefined);

      await removeImageFromCollection('col-1', 'img-1');

      expect(apiClient).toHaveBeenCalledWith('/api/collections/col-1/images/img-1', {
        method: 'DELETE',
      });
    });
  });

  describe('updateImageOrder', () => {
    it('should update image order in a collection', async () => {
      const input = {
        orders: [
          { imageId: 'img-1', order: 0 },
          { imageId: 'img-2', order: 1 },
        ],
      };
      vi.mocked(apiClient).mockResolvedValue(undefined);

      await updateImageOrder('col-1', input);

      expect(apiClient).toHaveBeenCalledWith('/api/collections/col-1/images/order', {
        method: 'PUT',
        body: JSON.stringify(input),
      });
    });
  });

  describe('fetchImageCollections', () => {
    it('should fetch collections that contain a specific image', async () => {
      const mockCollections = [
        { id: '1', name: 'Collection 1', description: null, coverImageId: null },
      ];
      vi.mocked(apiClient).mockResolvedValue(mockCollections);

      const result = await fetchImageCollections('img-1');

      expect(apiClient).toHaveBeenCalledWith('/api/images/img-1/collections');
      expect(result).toEqual(mockCollections);
    });
  });
});
