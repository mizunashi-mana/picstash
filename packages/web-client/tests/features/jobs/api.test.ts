import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getJob, listJobs } from '@/features/jobs/api';

describe('jobs/api', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetAllMocks();
  });

  describe('listJobs', () => {
    it('should fetch jobs list without params', async () => {
      const mockJobs = {
        jobs: [{ id: 'job-1', type: 'caption-generation', status: 'active' }],
        total: 1,
      };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockJobs,
      });

      const result = await listJobs();

      expect(mockFetch).toHaveBeenCalledWith('/api/jobs', expect.any(Object));
      expect(result).toEqual(mockJobs);
    });

    it('should include single status as query param', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ jobs: [], total: 0 }),
      });

      await listJobs({ status: 'active' });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/jobs?status=active',
        expect.any(Object),
      );
    });

    it('should join multiple statuses with comma', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ jobs: [], total: 0 }),
      });

      await listJobs({ status: ['waiting', 'active'] });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/jobs?status=waiting%2Cactive',
        expect.any(Object),
      );
    });

    it('should include type, limit, and offset params', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ jobs: [], total: 0 }),
      });

      await listJobs({ type: 'caption-generation', limit: 10, offset: 20 });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/jobs?type=caption-generation&limit=10&offset=20',
        expect.any(Object),
      );
    });
  });

  describe('getJob', () => {
    it('should fetch a specific job by id', async () => {
      const mockJob = { id: 'job-1', type: 'caption-generation', status: 'completed' };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockJob,
      });

      const result = await getJob('job-1');

      expect(mockFetch).toHaveBeenCalledWith('/api/jobs/job-1', expect.any(Object));
      expect(result).toEqual(mockJob);
    });
  });
});
