import { jobsEndpoints } from '@picstash/api';
import { apiClient } from '@/shared/api/client';

export type JobStatus = 'waiting' | 'active' | 'completed' | 'failed';

export interface Job {
  id: string;
  type: string;
  status: JobStatus;
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

export interface ListJobsResponse {
  jobs: Job[];
  total: number;
}

export interface ListJobsParams {
  status?: JobStatus | JobStatus[];
  type?: string;
  limit?: number;
  offset?: number;
}

export async function listJobs(params?: ListJobsParams): Promise<ListJobsResponse> {
  const status = params?.status !== undefined
    ? Array.isArray(params.status)
      ? params.status.join(',')
      : params.status
    : undefined;

  return await apiClient<ListJobsResponse>(
    jobsEndpoints.list({
      status,
      type: params?.type,
      limit: params?.limit,
      offset: params?.offset,
    }),
  );
}

export async function getJob(id: string): Promise<Job> {
  return await apiClient<Job>(jobsEndpoints.detail(id));
}
