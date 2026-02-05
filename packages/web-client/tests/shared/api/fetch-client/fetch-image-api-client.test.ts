import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type BaseHttpClient } from '@/shared/api/fetch-client/base-client';
import { FetchImageApiClient } from '@/shared/api/fetch-client/fetch-image-api-client';

describe('FetchImageApiClient', () => {
  let client: FetchImageApiClient;
  let mockHttp: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    postFormData: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockHttp = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      postFormData: vi.fn(),
    };
    client = new FetchImageApiClient(mockHttp as unknown as BaseHttpClient);
  });

  it('should call http.get for list', async () => {
    const mockData = [{ id: '1', filename: 'image.jpg' }];
    mockHttp.get.mockResolvedValueOnce(mockData);

    const result = await client.list();

    expect(mockHttp.get).toHaveBeenCalledWith('/api/images');
    expect(result).toEqual(mockData);
  });

  it('should call http.get for list with query', async () => {
    const mockData = [{ id: '1', filename: 'image.jpg' }];
    mockHttp.get.mockResolvedValueOnce(mockData);

    const result = await client.list({ q: 'test' });

    expect(mockHttp.get).toHaveBeenCalledWith('/api/images?q=test');
    expect(result).toEqual(mockData);
  });

  it('should call http.get for listPaginated', async () => {
    const mockData = { items: [{ id: '1' }], total: 1 };
    mockHttp.get.mockResolvedValueOnce(mockData);

    const result = await client.listPaginated('test', { limit: 10, offset: 0 });

    expect(mockHttp.get).toHaveBeenCalledWith('/api/images?q=test&limit=10&offset=0');
    expect(result).toEqual(mockData);
  });

  it('should call http.get for listPaginated with empty query', async () => {
    const mockData = { items: [{ id: '1' }], total: 1 };
    mockHttp.get.mockResolvedValueOnce(mockData);

    const result = await client.listPaginated('  ');

    expect(mockHttp.get).toHaveBeenCalledWith('/api/images?limit=50&offset=0');
    expect(result).toEqual(mockData);
  });

  it('should call http.get for detail', async () => {
    const mockData = { id: '1', filename: 'image.jpg' };
    mockHttp.get.mockResolvedValueOnce(mockData);

    const result = await client.detail('1');

    expect(mockHttp.get).toHaveBeenCalledWith('/api/images/1');
    expect(result).toEqual(mockData);
  });

  it('should call http.patch for update', async () => {
    const mockData = { id: '1', description: 'Updated' };
    mockHttp.patch.mockResolvedValueOnce(mockData);

    const result = await client.update('1', { description: 'Updated' });

    expect(mockHttp.patch).toHaveBeenCalledWith('/api/images/1', {
      description: 'Updated',
    });
    expect(result).toEqual(mockData);
  });

  it('should call http.delete for delete', async () => {
    mockHttp.delete.mockResolvedValueOnce(undefined);

    await client.delete('1');

    expect(mockHttp.delete).toHaveBeenCalledWith('/api/images/1');
  });

  it('should return image URL for getImageUrl', () => {
    const result = client.getImageUrl('1');

    expect(result).toBe('/api/images/1/file');
  });

  it('should return thumbnail URL for getThumbnailUrl', () => {
    const result = client.getThumbnailUrl('1');

    expect(result).toBe('/api/images/1/thumbnail');
  });

  it('should call http.get for fetchSimilar', async () => {
    const mockData = { images: [{ id: '2', similarity: 0.9 }] };
    mockHttp.get.mockResolvedValueOnce(mockData);

    const result = await client.fetchSimilar('1');

    expect(mockHttp.get).toHaveBeenCalledWith('/api/images/1/similar');
    expect(result).toEqual(mockData);
  });

  it('should call http.get for fetchDuplicates', async () => {
    const mockData = { groups: [] };
    mockHttp.get.mockResolvedValueOnce(mockData);

    const result = await client.fetchDuplicates();

    expect(mockHttp.get).toHaveBeenCalledWith('/api/images/duplicates');
    expect(result).toEqual(mockData);
  });

  it('should call http.get for fetchSuggestedAttributes', async () => {
    const mockData = { attributes: [] };
    mockHttp.get.mockResolvedValueOnce(mockData);

    const result = await client.fetchSuggestedAttributes('1');

    expect(mockHttp.get).toHaveBeenCalledWith('/api/images/1/suggested-attributes');
    expect(result).toEqual(mockData);
  });

  it('should call http.post for generateDescription', async () => {
    const mockData = { jobId: 'job-1' };
    mockHttp.post.mockResolvedValueOnce(mockData);

    const result = await client.generateDescription('1');

    expect(mockHttp.post).toHaveBeenCalledWith('/api/images/1/generate-description');
    expect(result).toEqual(mockData);
  });

  it('should call http.get for fetchCollections', async () => {
    const mockData = [{ id: 'col-1', name: 'Collection 1' }];
    mockHttp.get.mockResolvedValueOnce(mockData);

    const result = await client.fetchCollections('1');

    expect(mockHttp.get).toHaveBeenCalledWith('/api/images/1/collections');
    expect(result).toEqual(mockData);
  });

  it('should call http.postFormData for upload', async () => {
    const mockData = { id: '1', filename: 'uploaded.jpg' };
    const blob = new Blob(['test']);
    mockHttp.postFormData.mockResolvedValueOnce(mockData);

    const result = await client.upload(blob);

    expect(mockHttp.postFormData).toHaveBeenCalled();
    expect(result).toEqual(mockData);
  });
});
