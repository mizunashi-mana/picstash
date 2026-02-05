import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type BaseHttpClient } from '@/shared/api/fetch-client/base-client';
import { FetchUrlCrawlApiClient } from '@/shared/api/fetch-client/fetch-url-crawl-api-client';

describe('FetchUrlCrawlApiClient', () => {
  let client: FetchUrlCrawlApiClient;
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
    client = new FetchUrlCrawlApiClient(mockHttp as unknown as BaseHttpClient);
  });

  it('should call http.post for crawl', async () => {
    const mockData = { sessionId: 'session-1' };
    mockHttp.post.mockResolvedValueOnce(mockData);

    const result = await client.crawl('https://example.com');

    expect(mockHttp.post).toHaveBeenCalledWith('/api/url-crawl', {
      url: 'https://example.com',
    });
    expect(result).toEqual(mockData);
  });

  it('should call http.get for getSession', async () => {
    const mockData = { sessionId: 'session-1', images: [] };
    mockHttp.get.mockResolvedValueOnce(mockData);

    const result = await client.getSession('session-1');

    expect(mockHttp.get).toHaveBeenCalledWith('/api/url-crawl/session-1');
    expect(result).toEqual(mockData);
  });

  it('should call http.delete for deleteSession', async () => {
    mockHttp.delete.mockResolvedValueOnce(undefined);

    await client.deleteSession('session-1');

    expect(mockHttp.delete).toHaveBeenCalledWith('/api/url-crawl/session-1');
  });

  it('should return thumbnail URL for getThumbnailUrl', () => {
    const result = client.getThumbnailUrl('session-1', 0);

    expect(result).toBe('/api/url-crawl/session-1/images/0/thumbnail');
  });

  it('should return image URL for getImageUrl', () => {
    const result = client.getImageUrl('session-1', 0);

    expect(result).toBe('/api/url-crawl/session-1/images/0/file');
  });

  it('should call http.post for importImages', async () => {
    const mockData = { importedCount: 3 };
    mockHttp.post.mockResolvedValueOnce(mockData);

    const result = await client.importImages('session-1', [0, 1, 2]);

    expect(mockHttp.post).toHaveBeenCalledWith('/api/url-crawl/session-1/import', {
      indices: [0, 1, 2],
    });
    expect(result).toEqual(mockData);
  });
});
