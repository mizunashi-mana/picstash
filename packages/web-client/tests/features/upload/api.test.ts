import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { uploadImage } from '@/features/upload/api';

describe('upload/api', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetAllMocks();
  });

  describe('uploadImage', () => {
    it('should upload an image file', async () => {
      const mockImage = {
        id: 'img-1',
        path: '/uploads/test.png',
        mimeType: 'image/png',
        size: 1024,
        width: 100,
        height: 100,
        title: 'test.png',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      };
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockImage,
      });

      const file = new File(['test'], 'test.png', { type: 'image/png' });
      const result = await uploadImage(file);

      expect(mockFetch).toHaveBeenCalledWith('/api/images', {
        method: 'POST',
        body: expect.any(FormData),
      });
      expect(result).toEqual(mockImage);
    });

    it('should throw error when upload fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'File too large' }),
      });

      const file = new File(['test'], 'test.png', { type: 'image/png' });

      await expect(uploadImage(file)).rejects.toThrow('File too large');
    });

    it('should throw default error when no message provided', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({}),
      });

      const file = new File(['test'], 'test.png', { type: 'image/png' });

      await expect(uploadImage(file)).rejects.toThrow('Upload failed');
    });
  });
});
