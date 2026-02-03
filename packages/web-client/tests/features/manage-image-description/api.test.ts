import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  generateDescriptionJob,
  getJobStatus,
} from '@/features/manage-image-description/api/description';
import { apiClient } from '@/shared/api/client';

vi.mock('@/shared/api/client');

describe('manage-image-description/api', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateDescriptionJob', () => {
    it('should create a description generation job', async () => {
      const mockResponse = { jobId: 'job-1', status: 'queued' as const, message: 'Job queued' };
      vi.mocked(apiClient).mockResolvedValue(mockResponse);

      const result = await generateDescriptionJob('img-1');

      expect(apiClient).toHaveBeenCalledWith('/api/images/img-1/generate-description', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getJobStatus', () => {
    it('should get job status', async () => {
      const mockJob = { id: 'job-1', type: 'caption-generation', status: 'completed' };
      vi.mocked(apiClient).mockResolvedValue(mockJob);

      const result = await getJobStatus('job-1');

      expect(apiClient).toHaveBeenCalledWith('/api/jobs/job-1');
      expect(result).toEqual(mockJob);
    });
  });
});
