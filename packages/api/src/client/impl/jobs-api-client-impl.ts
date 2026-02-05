/**
 * Jobs API Client Implementation
 */

import { jobsEndpoints, type Job, type JobsListQuery } from '@/jobs.js';
import type { HttpClient } from '@/client/http-client.js';
import type { JobsApiClient } from '@/client/jobs-api-client.js';

export function createJobsApiClient(http: HttpClient): JobsApiClient {
  return {
    list: async (query?: JobsListQuery) =>
      await http.get<Job[]>(jobsEndpoints.list(query)),

    detail: async (jobId: string) =>
      await http.get<Job>(jobsEndpoints.detail(jobId)),
  };
}
