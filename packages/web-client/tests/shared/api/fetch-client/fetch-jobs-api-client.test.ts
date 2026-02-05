import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type BaseHttpClient } from '@/shared/api/fetch-client/base-client';
import { FetchJobsApiClient } from '@/shared/api/fetch-client/fetch-jobs-api-client';

describe('FetchJobsApiClient', () => {
  let client: FetchJobsApiClient;
  let mockHttp: {
    get: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockHttp = {
      get: vi.fn(),
    };
    client = new FetchJobsApiClient(mockHttp as unknown as BaseHttpClient);
  });

  it('should call http.get for list', async () => {
    const mockData = [{ id: 'job-1', status: 'pending' }];
    mockHttp.get.mockResolvedValueOnce(mockData);

    const result = await client.list();

    expect(mockHttp.get).toHaveBeenCalledWith('/api/jobs');
    expect(result).toEqual(mockData);
  });

  it('should call http.get for list with query', async () => {
    const mockData = [{ id: 'job-1', status: 'completed' }];
    mockHttp.get.mockResolvedValueOnce(mockData);

    const result = await client.list({ status: 'completed' });

    expect(mockHttp.get).toHaveBeenCalledWith('/api/jobs?status=completed');
    expect(result).toEqual(mockData);
  });

  it('should call http.get for detail', async () => {
    const mockData = { id: 'job-1', status: 'completed' };
    mockHttp.get.mockResolvedValueOnce(mockData);

    const result = await client.detail('job-1');

    expect(mockHttp.get).toHaveBeenCalledWith('/api/jobs/job-1');
    expect(result).toEqual(mockData);
  });
});
