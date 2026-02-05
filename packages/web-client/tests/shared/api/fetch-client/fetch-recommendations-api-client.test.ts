import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type BaseHttpClient } from '@/shared/api/fetch-client/base-client';
import { FetchRecommendationsApiClient } from '@/shared/api/fetch-client/fetch-recommendations-api-client';

describe('FetchRecommendationsApiClient', () => {
  let client: FetchRecommendationsApiClient;
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
    client = new FetchRecommendationsApiClient(mockHttp as unknown as BaseHttpClient);
  });

  it('should call http.get for fetch', async () => {
    const mockData = { recommendations: [{ imageId: '1' }] };
    mockHttp.get.mockResolvedValueOnce(mockData);

    const result = await client.fetch();

    expect(mockHttp.get).toHaveBeenCalledWith('/api/recommendations');
    expect(result).toEqual(mockData);
  });

  it('should call http.get for fetch with options', async () => {
    const mockData = { recommendations: [{ imageId: '1' }] };
    mockHttp.get.mockResolvedValueOnce(mockData);

    const result = await client.fetch({ limit: 5 });

    expect(mockHttp.get).toHaveBeenCalledWith('/api/recommendations?limit=5');
    expect(result).toEqual(mockData);
  });

  it('should call http.post for recordImpressions', async () => {
    const mockData = { conversions: [{ id: 'conv-1' }] };
    mockHttp.post.mockResolvedValueOnce(mockData);

    const result = await client.recordImpressions([{ imageId: '1', score: 0.9 }]);

    expect(mockHttp.post).toHaveBeenCalledWith('/api/recommendation-conversions/impressions', {
      recommendations: [{ imageId: '1', score: 0.9 }],
    });
    expect(result).toEqual(mockData);
  });

  it('should call http.patch for recordClick', async () => {
    const mockData = { id: 'conv-1', viewHistoryId: 'vh-1' };
    mockHttp.patch.mockResolvedValueOnce(mockData);

    const result = await client.recordClick('conv-1', { viewHistoryId: 'vh-1' });

    expect(mockHttp.patch).toHaveBeenCalledWith('/api/recommendation-conversions/conv-1/click', {
      viewHistoryId: 'vh-1',
    });
    expect(result).toEqual(mockData);
  });
});
