import { imageEndpoints, jobsEndpoints } from '@picstash/api';
import { apiClient } from '@/shared/api/client';

// Generate Description API (Async Job)
export interface GenerateDescriptionJobResponse {
  jobId: string;
  status: 'queued';
  message: string;
}

export interface JobStatus {
  id: string;
  type: string;
  status: 'waiting' | 'active' | 'completed' | 'failed';
  progress: number;
  result?: {
    description: string;
    model: string;
    usedContext?: boolean;
  };
  error?: string;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export async function generateDescriptionJob(
  imageId: string,
): Promise<GenerateDescriptionJobResponse> {
  return await apiClient<GenerateDescriptionJobResponse>(
    imageEndpoints.generateDescription(imageId),
    { method: 'POST', body: JSON.stringify({}) },
  );
}

export async function getJobStatus(jobId: string): Promise<JobStatus> {
  return await apiClient<JobStatus>(jobsEndpoints.detail(jobId));
}
