import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type BaseHttpClient } from '@/shared/api/fetch-client/base-client';
import { FetchSearchApiClient } from '@/shared/api/fetch-client/fetch-search-api-client';

describe('FetchSearchApiClient', () => {
  let client: FetchSearchApiClient;
  let mockHttp: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockHttp = {
      get: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
    };
    client = new FetchSearchApiClient(mockHttp as unknown as BaseHttpClient);
  });

  it('should call http.get for suggestions', async () => {
    const mockData = { suggestions: ['cat', 'car'] };
    mockHttp.get.mockResolvedValueOnce(mockData);

    const result = await client.suggestions('ca');

    expect(mockHttp.get).toHaveBeenCalledWith('/api/search/suggestions?q=ca');
    expect(result).toEqual(mockData);
  });

  it('should return empty suggestions for empty query', async () => {
    const result = await client.suggestions('');

    expect(mockHttp.get).not.toHaveBeenCalled();
    expect(result).toEqual({ suggestions: [] });
  });

  it('should return empty suggestions for whitespace query', async () => {
    const result = await client.suggestions('   ');

    expect(mockHttp.get).not.toHaveBeenCalled();
    expect(result).toEqual({ suggestions: [] });
  });

  it('should call http.post for saveHistory', async () => {
    const mockData = { id: '1', query: 'test' };
    mockHttp.post.mockResolvedValueOnce(mockData);

    const result = await client.saveHistory('test');

    expect(mockHttp.post).toHaveBeenCalledWith('/api/search/history', {
      query: 'test',
    });
    expect(result).toEqual(mockData);
  });

  it('should call http.get for fetchHistory', async () => {
    const mockData = { history: [{ id: '1', query: 'test' }] };
    mockHttp.get.mockResolvedValueOnce(mockData);

    const result = await client.fetchHistory();

    expect(mockHttp.get).toHaveBeenCalledWith('/api/search/history');
    expect(result).toEqual(mockData);
  });

  it('should call http.delete for deleteHistory', async () => {
    mockHttp.delete.mockResolvedValueOnce(undefined);

    await client.deleteHistory('1');

    expect(mockHttp.delete).toHaveBeenCalledWith('/api/search/history/1');
  });

  it('should call http.delete for deleteAllHistory', async () => {
    mockHttp.delete.mockResolvedValueOnce(undefined);

    await client.deleteAllHistory();

    expect(mockHttp.delete).toHaveBeenCalledWith('/api/search/history');
  });
});
