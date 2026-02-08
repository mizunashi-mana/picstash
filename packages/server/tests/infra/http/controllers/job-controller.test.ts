import 'reflect-metadata';
import Fastify, { type FastifyInstance } from 'fastify';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { JobController } from '@/infra/http/controllers/job-controller';
import type { Job, JobQueue, ListJobsResult } from '@picstash/core';

interface ErrorResponse {
  error: string;
  message?: string;
}

interface JobResponse {
  id: string;
  type: string;
  status: string;
  progress: number;
  result?: unknown;
  error?: string;
  payload?: unknown;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

interface ListJobsResponse {
  jobs: JobResponse[];
  total: number;
}

function createMockJobQueue(): JobQueue {
  return {
    add: vi.fn(),
    getJob: vi.fn(),
    listJobs: vi.fn(),
    acquireJob: vi.fn(),
    completeJob: vi.fn(),
    failJob: vi.fn(),
    updateProgress: vi.fn(),
  };
}

function createMockJob(overrides: Partial<Job> = {}): Job {
  const now = new Date();
  return {
    id: 'job-1',
    type: 'test-job',
    status: 'waiting',
    payload: { data: 'test' },
    progress: 0,
    attempts: 0,
    maxAttempts: 3,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('JobController', () => {
  let app: FastifyInstance;
  let mockJobQueue: JobQueue;
  let controller: JobController;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockJobQueue = createMockJobQueue();

    // Create controller with mocked dependencies
    controller = new JobController(mockJobQueue);

    // Create Fastify app and register routes
    app = Fastify({ logger: false });
    controller.registerRoutes(app);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /api/jobs', () => {
    it('should return empty list when no jobs exist', async () => {
      const emptyResult: ListJobsResult = {
        jobs: [],
        total: 0,
      };
      vi.mocked(mockJobQueue.listJobs).mockResolvedValue(emptyResult);

      const response = await app.inject({
        method: 'GET',
        url: '/api/jobs',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as ListJobsResponse;
      expect(body.jobs).toHaveLength(0);
      expect(body.total).toBe(0);
      expect(mockJobQueue.listJobs).toHaveBeenCalledWith({
        status: undefined,
        type: undefined,
        limit: undefined,
        offset: undefined,
      });
    });

    it('should return list of jobs', async () => {
      const now = new Date();
      const startedAt = new Date(now.getTime() - 1000);
      const completedAt = new Date();
      const jobs: Job[] = [
        createMockJob({
          id: 'job-1',
          type: 'caption-generation',
          status: 'completed',
          progress: 100,
          result: { caption: 'Test caption' },
          startedAt,
          completedAt,
        }),
        createMockJob({
          id: 'job-2',
          type: 'embedding-generation',
          status: 'active',
          progress: 50,
          startedAt: now,
        }),
      ];
      vi.mocked(mockJobQueue.listJobs).mockResolvedValue({
        jobs,
        total: 2,
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/jobs',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as ListJobsResponse;
      expect(body.jobs).toHaveLength(2);
      expect(body.total).toBe(2);
      expect(body.jobs[0]?.id).toBe('job-1');
      expect(body.jobs[0]?.type).toBe('caption-generation');
      expect(body.jobs[0]?.status).toBe('completed');
      expect(body.jobs[0]?.progress).toBe(100);
      expect(body.jobs[0]?.result).toEqual({ caption: 'Test caption' });
      expect(body.jobs[0]?.startedAt).toBe(startedAt.toISOString());
      expect(body.jobs[0]?.completedAt).toBe(completedAt.toISOString());
      expect(body.jobs[1]?.id).toBe('job-2');
      expect(body.jobs[1]?.status).toBe('active');
      expect(body.jobs[1]?.completedAt).toBeNull();
    });

    it('should filter by single status', async () => {
      vi.mocked(mockJobQueue.listJobs).mockResolvedValue({
        jobs: [],
        total: 0,
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/jobs?status=waiting',
      });

      expect(response.statusCode).toBe(200);
      expect(mockJobQueue.listJobs).toHaveBeenCalledWith({
        status: 'waiting',
        type: undefined,
        limit: undefined,
        offset: undefined,
      });
    });

    it('should filter by multiple statuses', async () => {
      vi.mocked(mockJobQueue.listJobs).mockResolvedValue({
        jobs: [],
        total: 0,
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/jobs?status=waiting,active',
      });

      expect(response.statusCode).toBe(200);
      expect(mockJobQueue.listJobs).toHaveBeenCalledWith({
        status: ['waiting', 'active'],
        type: undefined,
        limit: undefined,
        offset: undefined,
      });
    });

    it('should filter by all valid statuses', async () => {
      vi.mocked(mockJobQueue.listJobs).mockResolvedValue({
        jobs: [],
        total: 0,
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/jobs?status=waiting,active,completed,failed',
      });

      expect(response.statusCode).toBe(200);
      expect(mockJobQueue.listJobs).toHaveBeenCalledWith({
        status: ['waiting', 'active', 'completed', 'failed'],
        type: undefined,
        limit: undefined,
        offset: undefined,
      });
    });

    it('should ignore invalid status values', async () => {
      vi.mocked(mockJobQueue.listJobs).mockResolvedValue({
        jobs: [],
        total: 0,
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/jobs?status=invalid,waiting,unknown',
      });

      expect(response.statusCode).toBe(200);
      expect(mockJobQueue.listJobs).toHaveBeenCalledWith({
        status: 'waiting',
        type: undefined,
        limit: undefined,
        offset: undefined,
      });
    });

    it('should ignore all invalid status values and use undefined', async () => {
      vi.mocked(mockJobQueue.listJobs).mockResolvedValue({
        jobs: [],
        total: 0,
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/jobs?status=invalid,unknown',
      });

      expect(response.statusCode).toBe(200);
      expect(mockJobQueue.listJobs).toHaveBeenCalledWith({
        status: undefined,
        type: undefined,
        limit: undefined,
        offset: undefined,
      });
    });

    it('should filter by type', async () => {
      vi.mocked(mockJobQueue.listJobs).mockResolvedValue({
        jobs: [],
        total: 0,
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/jobs?type=caption-generation',
      });

      expect(response.statusCode).toBe(200);
      expect(mockJobQueue.listJobs).toHaveBeenCalledWith({
        status: undefined,
        type: 'caption-generation',
        limit: undefined,
        offset: undefined,
      });
    });

    it('should apply limit parameter', async () => {
      vi.mocked(mockJobQueue.listJobs).mockResolvedValue({
        jobs: [],
        total: 0,
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/jobs?limit=10',
      });

      expect(response.statusCode).toBe(200);
      expect(mockJobQueue.listJobs).toHaveBeenCalledWith({
        status: undefined,
        type: undefined,
        limit: 10,
        offset: undefined,
      });
    });

    it('should apply offset parameter', async () => {
      vi.mocked(mockJobQueue.listJobs).mockResolvedValue({
        jobs: [],
        total: 0,
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/jobs?offset=20',
      });

      expect(response.statusCode).toBe(200);
      expect(mockJobQueue.listJobs).toHaveBeenCalledWith({
        status: undefined,
        type: undefined,
        limit: undefined,
        offset: 20,
      });
    });

    it('should apply all query parameters together', async () => {
      vi.mocked(mockJobQueue.listJobs).mockResolvedValue({
        jobs: [],
        total: 0,
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/jobs?status=waiting,active&type=embedding-generation&limit=50&offset=10',
      });

      expect(response.statusCode).toBe(200);
      expect(mockJobQueue.listJobs).toHaveBeenCalledWith({
        status: ['waiting', 'active'],
        type: 'embedding-generation',
        limit: 50,
        offset: 10,
      });
    });

    it('should ignore invalid limit (NaN)', async () => {
      vi.mocked(mockJobQueue.listJobs).mockResolvedValue({
        jobs: [],
        total: 0,
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/jobs?limit=invalid',
      });

      expect(response.statusCode).toBe(200);
      expect(mockJobQueue.listJobs).toHaveBeenCalledWith({
        status: undefined,
        type: undefined,
        limit: undefined,
        offset: undefined,
      });
    });

    it('should ignore negative limit', async () => {
      vi.mocked(mockJobQueue.listJobs).mockResolvedValue({
        jobs: [],
        total: 0,
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/jobs?limit=-5',
      });

      expect(response.statusCode).toBe(200);
      expect(mockJobQueue.listJobs).toHaveBeenCalledWith({
        status: undefined,
        type: undefined,
        limit: undefined,
        offset: undefined,
      });
    });

    it('should ignore invalid offset (NaN)', async () => {
      vi.mocked(mockJobQueue.listJobs).mockResolvedValue({
        jobs: [],
        total: 0,
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/jobs?offset=invalid',
      });

      expect(response.statusCode).toBe(200);
      expect(mockJobQueue.listJobs).toHaveBeenCalledWith({
        status: undefined,
        type: undefined,
        limit: undefined,
        offset: undefined,
      });
    });

    it('should ignore negative offset', async () => {
      vi.mocked(mockJobQueue.listJobs).mockResolvedValue({
        jobs: [],
        total: 0,
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/jobs?offset=-10',
      });

      expect(response.statusCode).toBe(200);
      expect(mockJobQueue.listJobs).toHaveBeenCalledWith({
        status: undefined,
        type: undefined,
        limit: undefined,
        offset: undefined,
      });
    });

    it('should include error field for failed jobs', async () => {
      const jobs: Job[] = [
        createMockJob({
          id: 'job-1',
          status: 'failed',
          error: 'Something went wrong',
        }),
      ];
      vi.mocked(mockJobQueue.listJobs).mockResolvedValue({
        jobs,
        total: 1,
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/jobs',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as ListJobsResponse;
      expect(body.jobs[0]?.error).toBe('Something went wrong');
    });

    it('should include payload in job response', async () => {
      const payload = { imageId: 'img-123', options: { quality: 'high' } };
      const jobs: Job[] = [
        createMockJob({
          id: 'job-1',
          payload,
        }),
      ];
      vi.mocked(mockJobQueue.listJobs).mockResolvedValue({
        jobs,
        total: 1,
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/jobs',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as ListJobsResponse;
      expect(body.jobs[0]?.payload).toEqual(payload);
    });
  });

  describe('GET /api/jobs/:id', () => {
    it('should return 404 when job not found', async () => {
      vi.mocked(mockJobQueue.getJob).mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: '/api/jobs/non-existent-id',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Not Found');
      expect(body.message).toBe('Job not found');
      expect(mockJobQueue.getJob).toHaveBeenCalledWith('non-existent-id');
    });

    it('should return job details for waiting job', async () => {
      const now = new Date();
      const job = createMockJob({
        id: 'job-123',
        type: 'caption-generation',
        status: 'waiting',
        progress: 0,
        attempts: 0,
        maxAttempts: 3,
        createdAt: now,
        updatedAt: now,
      });
      vi.mocked(mockJobQueue.getJob).mockResolvedValue(job);

      const response = await app.inject({
        method: 'GET',
        url: '/api/jobs/job-123',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as JobResponse;
      expect(body.id).toBe('job-123');
      expect(body.type).toBe('caption-generation');
      expect(body.status).toBe('waiting');
      expect(body.progress).toBe(0);
      expect(body.attempts).toBe(0);
      expect(body.maxAttempts).toBe(3);
      expect(body.createdAt).toBe(now.toISOString());
      expect(body.updatedAt).toBe(now.toISOString());
      expect(body.startedAt).toBeNull();
      expect(body.completedAt).toBeNull();
      expect(mockJobQueue.getJob).toHaveBeenCalledWith('job-123');
    });

    it('should return job details for active job', async () => {
      const createdAt = new Date();
      const startedAt = new Date(createdAt.getTime() + 1000);
      const updatedAt = new Date(startedAt.getTime() + 500);
      const job = createMockJob({
        id: 'job-456',
        type: 'embedding-generation',
        status: 'active',
        progress: 50,
        attempts: 1,
        createdAt,
        updatedAt,
        startedAt,
      });
      vi.mocked(mockJobQueue.getJob).mockResolvedValue(job);

      const response = await app.inject({
        method: 'GET',
        url: '/api/jobs/job-456',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as JobResponse;
      expect(body.id).toBe('job-456');
      expect(body.status).toBe('active');
      expect(body.progress).toBe(50);
      expect(body.attempts).toBe(1);
      expect(body.startedAt).toBe(startedAt.toISOString());
      expect(body.completedAt).toBeNull();
    });

    it('should return job details for completed job with result', async () => {
      const createdAt = new Date();
      const startedAt = new Date(createdAt.getTime() + 1000);
      const completedAt = new Date(startedAt.getTime() + 5000);
      const result = { caption: 'A beautiful sunset over the ocean' };
      const job = createMockJob({
        id: 'job-789',
        type: 'caption-generation',
        status: 'completed',
        progress: 100,
        result,
        attempts: 1,
        createdAt,
        updatedAt: completedAt,
        startedAt,
        completedAt,
      });
      vi.mocked(mockJobQueue.getJob).mockResolvedValue(job);

      const response = await app.inject({
        method: 'GET',
        url: '/api/jobs/job-789',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as JobResponse;
      expect(body.id).toBe('job-789');
      expect(body.status).toBe('completed');
      expect(body.progress).toBe(100);
      expect(body.result).toEqual(result);
      expect(body.startedAt).toBe(startedAt.toISOString());
      expect(body.completedAt).toBe(completedAt.toISOString());
    });

    it('should return job details for failed job with error', async () => {
      const createdAt = new Date();
      const startedAt = new Date(createdAt.getTime() + 1000);
      const completedAt = new Date(startedAt.getTime() + 2000);
      const job = createMockJob({
        id: 'job-failed',
        type: 'embedding-generation',
        status: 'failed',
        progress: 0,
        error: 'GPU memory exhausted',
        attempts: 3,
        maxAttempts: 3,
        createdAt,
        updatedAt: completedAt,
        startedAt,
        completedAt,
      });
      vi.mocked(mockJobQueue.getJob).mockResolvedValue(job);

      const response = await app.inject({
        method: 'GET',
        url: '/api/jobs/job-failed',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as JobResponse;
      expect(body.id).toBe('job-failed');
      expect(body.status).toBe('failed');
      expect(body.error).toBe('GPU memory exhausted');
      expect(body.attempts).toBe(3);
      expect(body.maxAttempts).toBe(3);
      expect(body.completedAt).toBe(completedAt.toISOString());
    });

    it('should handle UUID-style job IDs', async () => {
      const jobId = '550e8400-e29b-41d4-a716-446655440000';
      vi.mocked(mockJobQueue.getJob).mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: `/api/jobs/${jobId}`,
      });

      expect(response.statusCode).toBe(404);
      expect(mockJobQueue.getJob).toHaveBeenCalledWith(jobId);
    });

    it('should handle special characters in job IDs', async () => {
      const jobId = 'job_2024-01-15_123';
      vi.mocked(mockJobQueue.getJob).mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: `/api/jobs/${jobId}`,
      });

      expect(response.statusCode).toBe(404);
      expect(mockJobQueue.getJob).toHaveBeenCalledWith(jobId);
    });
  });
});
