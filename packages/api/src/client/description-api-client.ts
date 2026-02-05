/**
 * Description API Client Interface
 */

import type { GenerateDescriptionJobResponse } from '@/images.js';
import type { Job } from '@/jobs.js';

export interface DescriptionApiClient {
  /** 説明文生成ジョブ作成 */
  generateJob: (imageId: string) => Promise<GenerateDescriptionJobResponse>;

  /** ジョブステータス取得 */
  getJobStatus: (jobId: string) => Promise<Job>;
}
