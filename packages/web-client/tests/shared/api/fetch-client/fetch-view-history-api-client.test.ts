import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type BaseHttpClient } from '@/shared/api/fetch-client/base-client';
import { FetchViewHistoryApiClient } from '@/shared/api/fetch-client/fetch-view-history-api-client';

describe('FetchViewHistoryApiClient', () => {
  let client: FetchViewHistoryApiClient;
  let mockHttp: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockHttp = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
    };
    client = new FetchViewHistoryApiClient(mockHttp as unknown as BaseHttpClient);
  });

  it('should call http.post for recordStart', async () => {
    const mockData = { id: 'vh-1', imageId: 'img-1' };
    mockHttp.post.mockResolvedValueOnce(mockData);

    const result = await client.recordStart('img-1');

    expect(mockHttp.post).toHaveBeenCalledWith('/api/view-history', {
      imageId: 'img-1',
    });
    expect(result).toEqual(mockData);
  });

  it('should call http.patch for recordEnd', async () => {
    const mockData = { id: 'vh-1', duration: 5000 };
    mockHttp.patch.mockResolvedValueOnce(mockData);

    const result = await client.recordEnd('vh-1', 5000);

    expect(mockHttp.patch).toHaveBeenCalledWith('/api/view-history/vh-1', {
      duration: 5000,
    });
    expect(result).toEqual(mockData);
  });

  it('should call http.get for list', async () => {
    const mockData = [{ id: 'vh-1', imageId: 'img-1' }];
    mockHttp.get.mockResolvedValueOnce(mockData);

    const result = await client.list();

    expect(mockHttp.get).toHaveBeenCalledWith('/api/view-history');
    expect(result).toEqual(mockData);
  });

  it('should call http.get for list with options', async () => {
    const mockData = [{ id: 'vh-1', imageId: 'img-1' }];
    mockHttp.get.mockResolvedValueOnce(mockData);

    const result = await client.list({ limit: 10 });

    expect(mockHttp.get).toHaveBeenCalledWith('/api/view-history?limit=10');
    expect(result).toEqual(mockData);
  });

  it('should call http.get for imageStats', async () => {
    const mockData = { totalViews: 100, avgDuration: 5000 };
    mockHttp.get.mockResolvedValueOnce(mockData);

    const result = await client.imageStats('img-1');

    expect(mockHttp.get).toHaveBeenCalledWith('/api/images/img-1/view-stats');
    expect(result).toEqual(mockData);
  });
});
