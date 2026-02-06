/**
 * Jobs API Client Interface
 */

import type { Job, JobsListQuery, ListJobsResponse } from '@/jobs.js';

export interface JobsApiClient {
  /** ジョブ一覧取得 */
  list: (query?: JobsListQuery) => Promise<ListJobsResponse>;

  /** ジョブ詳細取得 */
  detail: (jobId: string) => Promise<Job>;
}
