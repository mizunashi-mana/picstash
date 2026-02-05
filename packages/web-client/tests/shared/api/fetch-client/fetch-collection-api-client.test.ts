import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type BaseHttpClient } from '@/shared/api/fetch-client/base-client';
import { FetchCollectionApiClient } from '@/shared/api/fetch-client/fetch-collection-api-client';

describe('FetchCollectionApiClient', () => {
  let client: FetchCollectionApiClient;
  let mockHttp: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockHttp = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };
    client = new FetchCollectionApiClient(mockHttp as unknown as BaseHttpClient);
  });

  it('should call http.get for list', async () => {
    const mockData = [{ id: '1', name: 'Collection 1', imageCount: 5 }];
    mockHttp.get.mockResolvedValueOnce(mockData);

    const result = await client.list();

    expect(mockHttp.get).toHaveBeenCalledWith('/api/collections');
    expect(result).toEqual(mockData);
  });

  it('should call http.get for detail', async () => {
    const mockData = { id: '1', name: 'Collection 1', images: [] };
    mockHttp.get.mockResolvedValueOnce(mockData);

    const result = await client.detail('1');

    expect(mockHttp.get).toHaveBeenCalledWith('/api/collections/1');
    expect(result).toEqual(mockData);
  });

  it('should call http.post for create', async () => {
    const mockData = { id: '1', name: 'New Collection' };
    mockHttp.post.mockResolvedValueOnce(mockData);

    const result = await client.create({ name: 'New Collection' });

    expect(mockHttp.post).toHaveBeenCalledWith('/api/collections', {
      name: 'New Collection',
    });
    expect(result).toEqual(mockData);
  });

  it('should call http.put for update', async () => {
    const mockData = { id: '1', name: 'Updated Collection' };
    mockHttp.put.mockResolvedValueOnce(mockData);

    const result = await client.update('1', { name: 'Updated Collection' });

    expect(mockHttp.put).toHaveBeenCalledWith('/api/collections/1', {
      name: 'Updated Collection',
    });
    expect(result).toEqual(mockData);
  });

  it('should call http.delete for delete', async () => {
    mockHttp.delete.mockResolvedValueOnce(undefined);

    await client.delete('1');

    expect(mockHttp.delete).toHaveBeenCalledWith('/api/collections/1');
  });

  it('should call http.post for addImage', async () => {
    mockHttp.post.mockResolvedValueOnce(undefined);

    await client.addImage('col-1', { imageId: 'img-1' });

    expect(mockHttp.post).toHaveBeenCalledWith('/api/collections/col-1/images', {
      imageId: 'img-1',
    });
  });

  it('should call http.delete for removeImage', async () => {
    mockHttp.delete.mockResolvedValueOnce(undefined);

    await client.removeImage('col-1', 'img-1');

    expect(mockHttp.delete).toHaveBeenCalledWith(
      '/api/collections/col-1/images/img-1',
    );
  });

  it('should call http.put for updateImageOrder', async () => {
    mockHttp.put.mockResolvedValueOnce(undefined);

    await client.updateImageOrder('col-1', { imageIds: ['img-1', 'img-2'] });

    expect(mockHttp.put).toHaveBeenCalledWith('/api/collections/col-1/images/order', {
      imageIds: ['img-1', 'img-2'],
    });
  });

  it('should call http.get for fetchImageCollections', async () => {
    const mockData = [{ id: '1', name: 'Collection 1' }];
    mockHttp.get.mockResolvedValueOnce(mockData);

    const result = await client.fetchImageCollections('img-1');

    expect(mockHttp.get).toHaveBeenCalledWith('/api/images/img-1/collections');
    expect(result).toEqual(mockData);
  });
});
