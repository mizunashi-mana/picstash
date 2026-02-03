import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchImageAttributes,
  createImageAttribute,
  updateImageAttribute,
  deleteImageAttribute,
  fetchSuggestedAttributes,
} from '@/features/manage-image-attributes/api/attributes';
import { apiClient } from '@/shared/api/client';

vi.mock('@/shared/api/client');

describe('manage-image-attributes/api', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchImageAttributes', () => {
    it('should fetch attributes for an image', async () => {
      const mockAttrs = [{ id: 'attr-1', labelId: 'label-1', value: 'test' }];
      vi.mocked(apiClient).mockResolvedValue(mockAttrs);

      const result = await fetchImageAttributes('img-1');

      expect(apiClient).toHaveBeenCalledWith('/api/images/img-1/attributes');
      expect(result).toEqual(mockAttrs);
    });
  });

  describe('createImageAttribute', () => {
    it('should create an attribute for an image', async () => {
      const input = { labelId: 'label-1', value: 'test' };
      const mockAttr = { id: 'attr-1', ...input };
      vi.mocked(apiClient).mockResolvedValue(mockAttr);

      const result = await createImageAttribute('img-1', input);

      expect(apiClient).toHaveBeenCalledWith('/api/images/img-1/attributes', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      expect(result).toEqual(mockAttr);
    });
  });

  describe('updateImageAttribute', () => {
    it('should update an attribute', async () => {
      const input = { keywords: 'updated keywords' };
      const mockAttr = { id: 'attr-1', keywords: 'updated keywords' };
      vi.mocked(apiClient).mockResolvedValue(mockAttr);

      const result = await updateImageAttribute('img-1', 'attr-1', input);

      expect(apiClient).toHaveBeenCalledWith('/api/images/img-1/attributes/attr-1', {
        method: 'PUT',
        body: JSON.stringify(input),
      });
      expect(result).toEqual(mockAttr);
    });
  });

  describe('deleteImageAttribute', () => {
    it('should delete an attribute', async () => {
      vi.mocked(apiClient).mockResolvedValue(undefined);

      await deleteImageAttribute('img-1', 'attr-1');

      expect(apiClient).toHaveBeenCalledWith('/api/images/img-1/attributes/attr-1', {
        method: 'DELETE',
      });
    });
  });

  describe('fetchSuggestedAttributes', () => {
    it('should fetch suggested attributes', async () => {
      const mockResponse = {
        imageId: 'img-1',
        suggestions: [{ labelId: 'label-1', labelName: 'Tag', score: 0.9, suggestedKeywords: [] }],
      };
      vi.mocked(apiClient).mockResolvedValue(mockResponse);

      const result = await fetchSuggestedAttributes('img-1');

      expect(apiClient).toHaveBeenCalledWith('/api/images/img-1/suggested-attributes');
      expect(result).toEqual(mockResponse);
    });

    it('should fetch with options', async () => {
      vi.mocked(apiClient).mockResolvedValue({ imageId: 'img-1', suggestions: [] });

      await fetchSuggestedAttributes('img-1', { threshold: 0.5, limit: 10 });

      expect(apiClient).toHaveBeenCalledWith('/api/images/img-1/suggested-attributes?threshold=0.5&limit=10');
    });
  });
});
