import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchImageAttributes,
  createImageAttribute,
  updateImageAttribute,
  deleteImageAttribute,
  fetchSuggestedAttributes,
  generateDescriptionJob,
  getJobStatus,
  fetchSimilarImages,
  fetchSearchSuggestions,
  saveSearchHistory,
  fetchSearchHistory,
  deleteSearchHistory,
  deleteAllSearchHistory,
} from '@/features/gallery/api';
import { apiClient } from '@/shared/api/client';

vi.mock('@/shared/api/client');

describe('gallery/api', () => {
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

  describe('generateDescriptionJob', () => {
    it('should create a description generation job', async () => {
      const mockResponse = { jobId: 'job-1', status: 'queued' as const, message: 'Job queued' };
      vi.mocked(apiClient).mockResolvedValue(mockResponse);

      const result = await generateDescriptionJob('img-1');

      expect(apiClient).toHaveBeenCalledWith('/api/images/img-1/generate-description', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getJobStatus', () => {
    it('should get job status', async () => {
      const mockJob = { id: 'job-1', type: 'caption-generation', status: 'completed' };
      vi.mocked(apiClient).mockResolvedValue(mockJob);

      const result = await getJobStatus('job-1');

      expect(apiClient).toHaveBeenCalledWith('/api/jobs/job-1');
      expect(result).toEqual(mockJob);
    });
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
