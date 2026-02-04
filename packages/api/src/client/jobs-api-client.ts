/**
 * Jobs API Client Interface
 */

import type { Job, JobsListQuery } from '../jobs.js';

export interface JobsApiClient {
  /** ジョブ一覧取得 */
  list: (query?: JobsListQuery) => Promise<Job[]>;

  /** ジョブ詳細取得 */
  detail: (jobId: string) => Promise<Job>;
}
