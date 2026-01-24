import { apiClient } from '@/api/client';

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
  const queryParams: Record<string, string> = {};

  if (params?.status !== undefined) {
    queryParams.status = Array.isArray(params.status)
      ? params.status.join(',')
      : params.status;
  }
  if (params?.type !== undefined) {
    queryParams.type = params.type;
  }
  if (params?.limit !== undefined) {
    queryParams.limit = params.limit.toString();
  }
  if (params?.offset !== undefined) {
    queryParams.offset = params.offset.toString();
  }

  return await apiClient<ListJobsResponse>('/jobs', { params: queryParams });
}

export async function getJob(id: string): Promise<Job> {
  return await apiClient<Job>(`/jobs/${id}`);
}
