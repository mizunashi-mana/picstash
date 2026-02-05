import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type BaseHttpClient } from '@/shared/api/fetch-client/base-client';
import { FetchArchiveImportApiClient } from '@/shared/api/fetch-client/fetch-archive-import-api-client';

describe('FetchArchiveImportApiClient', () => {
  let client: FetchArchiveImportApiClient;
  let mockHttp: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    postFormData: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockHttp = {
      get: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
      postFormData: vi.fn(),
    };
    client = new FetchArchiveImportApiClient(mockHttp as unknown as BaseHttpClient);
  });

  it('should call http.postFormData for upload', async () => {
    const mockData = { sessionId: 'session-1' };
    const blob = new Blob(['test']);
    mockHttp.postFormData.mockResolvedValueOnce(mockData);

    const result = await client.upload(blob);

    expect(mockHttp.postFormData).toHaveBeenCalled();
    expect(result).toEqual(mockData);
  });

  it('should call http.get for getSession', async () => {
    const mockData = { sessionId: 'session-1', files: [] };
    mockHttp.get.mockResolvedValueOnce(mockData);

    const result = await client.getSession('session-1');

    expect(mockHttp.get).toHaveBeenCalledWith('/api/archives/session-1');
    expect(result).toEqual(mockData);
  });

  it('should call http.delete for deleteSession', async () => {
    mockHttp.delete.mockResolvedValueOnce(undefined);

    await client.deleteSession('session-1');

    expect(mockHttp.delete).toHaveBeenCalledWith('/api/archives/session-1');
  });

  it('should return thumbnail URL for getThumbnailUrl', () => {
    const result = client.getThumbnailUrl('session-1', 0);

    expect(result).toBe('/api/archives/session-1/files/0/thumbnail');
  });

  it('should return image URL for getImageUrl', () => {
    const result = client.getImageUrl('session-1', 0);

    expect(result).toBe('/api/archives/session-1/files/0/file');
  });

  it('should call http.post for importImages', async () => {
    const mockData = { jobId: 'job-1' };
    mockHttp.post.mockResolvedValueOnce(mockData);

    const result = await client.importImages('session-1', [0, 1, 2]);

    expect(mockHttp.post).toHaveBeenCalledWith('/api/archives/session-1/import', {
      indices: [0, 1, 2],
    });
    expect(result).toEqual(mockData);
  });

  it('should call http.get for getImportJobStatus', async () => {
    const mockData = { jobId: 'job-1', status: 'completed' };
    mockHttp.get.mockResolvedValueOnce(mockData);

    const result = await client.getImportJobStatus('job-1');

    expect(mockHttp.get).toHaveBeenCalledWith('/api/import-jobs/job-1');
    expect(result).toEqual(mockData);
  });
});
