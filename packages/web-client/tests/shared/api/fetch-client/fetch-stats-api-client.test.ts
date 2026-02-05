import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type BaseHttpClient } from '@/shared/api/fetch-client/base-client';
import { FetchStatsApiClient } from '@/shared/api/fetch-client/fetch-stats-api-client';

describe('FetchStatsApiClient', () => {
  let client: FetchStatsApiClient;
  let mockHttp: {
    get: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockHttp = {
      get: vi.fn(),
    };
    client = new FetchStatsApiClient(mockHttp as unknown as BaseHttpClient);
  });

  it('should call http.get for overview', async () => {
    const mockData = { totalImages: 100, totalCollections: 10 };
    mockHttp.get.mockResolvedValueOnce(mockData);

    const result = await client.overview();

    expect(mockHttp.get).toHaveBeenCalledWith('/api/stats/overview');
    expect(result).toEqual(mockData);
  });

  it('should call http.get for overview with options', async () => {
    const mockData = { totalImages: 100 };
    mockHttp.get.mockResolvedValueOnce(mockData);

    const result = await client.overview({ days: 30 });

    expect(mockHttp.get).toHaveBeenCalledWith('/api/stats/overview?days=30');
    expect(result).toEqual(mockData);
  });

  it('should call http.get for viewTrends', async () => {
    const mockData = [{ date: '2024-01-01', views: 100 }];
    mockHttp.get.mockResolvedValueOnce(mockData);

    const result = await client.viewTrends();

    expect(mockHttp.get).toHaveBeenCalledWith('/api/stats/view-trends');
    expect(result).toEqual(mockData);
  });

  it('should call http.get for recommendationTrends', async () => {
    const mockData = [{ date: '2024-01-01', impressions: 100 }];
    mockHttp.get.mockResolvedValueOnce(mockData);

    const result = await client.recommendationTrends();

    expect(mockHttp.get).toHaveBeenCalledWith('/api/stats/recommendation-trends');
    expect(result).toEqual(mockData);
  });

  it('should call http.get for popularImages', async () => {
    const mockData = [{ imageId: '1', views: 100 }];
    mockHttp.get.mockResolvedValueOnce(mockData);

    const result = await client.popularImages();

    expect(mockHttp.get).toHaveBeenCalledWith('/api/stats/popular-images');
    expect(result).toEqual(mockData);
  });

  it('should call http.get for popularImages with options', async () => {
    const mockData = [{ imageId: '1', views: 100 }];
    mockHttp.get.mockResolvedValueOnce(mockData);

    const result = await client.popularImages({ limit: 5 });

    expect(mockHttp.get).toHaveBeenCalledWith('/api/stats/popular-images?limit=5');
    expect(result).toEqual(mockData);
  });
});
