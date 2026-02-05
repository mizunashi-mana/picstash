import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type BaseHttpClient } from '@/shared/api/fetch-client/base-client';
import { FetchLabelApiClient } from '@/shared/api/fetch-client/fetch-label-api-client';

describe('FetchLabelApiClient', () => {
  let client: FetchLabelApiClient;
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
    client = new FetchLabelApiClient(mockHttp as unknown as BaseHttpClient);
  });

  it('should call http.get for list', async () => {
    const mockData = [{ id: '1', name: 'Label 1', color: '#ff0000' }];
    mockHttp.get.mockResolvedValueOnce(mockData);

    const result = await client.list();

    expect(mockHttp.get).toHaveBeenCalledWith('/api/labels');
    expect(result).toEqual(mockData);
  });

  it('should call http.get for detail', async () => {
    const mockData = { id: '1', name: 'Label 1', color: '#ff0000' };
    mockHttp.get.mockResolvedValueOnce(mockData);

    const result = await client.detail('1');

    expect(mockHttp.get).toHaveBeenCalledWith('/api/labels/1');
    expect(result).toEqual(mockData);
  });

  it('should call http.post for create', async () => {
    const mockData = { id: '1', name: 'New Label', color: '#00ff00' };
    mockHttp.post.mockResolvedValueOnce(mockData);

    const result = await client.create({ name: 'New Label', color: '#00ff00' });

    expect(mockHttp.post).toHaveBeenCalledWith('/api/labels', {
      name: 'New Label',
      color: '#00ff00',
    });
    expect(result).toEqual(mockData);
  });

  it('should call http.put for update', async () => {
    const mockData = { id: '1', name: 'Updated Label', color: '#0000ff' };
    mockHttp.put.mockResolvedValueOnce(mockData);

    const result = await client.update('1', { name: 'Updated Label' });

    expect(mockHttp.put).toHaveBeenCalledWith('/api/labels/1', {
      name: 'Updated Label',
    });
    expect(result).toEqual(mockData);
  });

  it('should call http.delete for delete', async () => {
    mockHttp.delete.mockResolvedValueOnce(undefined);

    await client.delete('1');

    expect(mockHttp.delete).toHaveBeenCalledWith('/api/labels/1');
  });
});
