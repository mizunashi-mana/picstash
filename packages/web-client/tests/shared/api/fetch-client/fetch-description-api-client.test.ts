import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type BaseHttpClient } from '@/shared/api/fetch-client/base-client';
import { FetchDescriptionApiClient } from '@/shared/api/fetch-client/fetch-description-api-client';

describe('FetchDescriptionApiClient', () => {
  let client: FetchDescriptionApiClient;
  let mockHttp: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockHttp = {
      get: vi.fn(),
      post: vi.fn(),
    };
    client = new FetchDescriptionApiClient(mockHttp as unknown as BaseHttpClient);
  });

  it('should call http.post for generateJob', async () => {
    const mockData = { jobId: 'job-1' };
    mockHttp.post.mockResolvedValueOnce(mockData);

    const result = await client.generateJob('img-1');

    expect(mockHttp.post).toHaveBeenCalledWith('/api/images/img-1/generate-description', {});
    expect(result).toEqual(mockData);
  });

  it('should call http.get for getJobStatus', async () => {
    const mockData = { id: 'job-1', status: 'completed' };
    mockHttp.get.mockResolvedValueOnce(mockData);

    const result = await client.getJobStatus('job-1');

    expect(mockHttp.get).toHaveBeenCalledWith('/api/jobs/job-1');
    expect(result).toEqual(mockData);
  });
});
