/**
 * ジョブキューのポート定義
 * SQLite や Redis など、異なるバックエンドに切り替え可能な抽象化層
 */

export type JobStatus = 'waiting' | 'active' | 'completed' | 'failed';

export interface Job<TPayload = unknown, TResult = unknown> {
  id: string;
  type: string;
  status: JobStatus;
  payload: TPayload;
  result?: TResult;
  error?: string;
  progress: number;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface AddJobOptions {
  maxAttempts?: number;
}

export interface ListJobsOptions {
  status?: JobStatus | JobStatus[];
  type?: string;
  limit?: number;
  offset?: number;
}

export interface ListJobsResult<TPayload = unknown, TResult = unknown> {
  jobs: Array<Job<TPayload, TResult>>;
  total: number;
}

export interface JobQueue {
  /** ジョブを追加 */
  add: <T>(type: string, payload: T, options?: AddJobOptions) => Promise<Job<T>>;

  /** ジョブを取得 */
  getJob: <TPayload = unknown, TResult = unknown>(
    id: string,
  ) => Promise<Job<TPayload, TResult> | null>;

  /** ジョブ一覧を取得 */
  listJobs: <TPayload = unknown, TResult = unknown>(
    options?: ListJobsOptions,
  ) => Promise<ListJobsResult<TPayload, TResult>>;

  /** 待機中のジョブを1件取得してアクティブに（アトミック操作） */
  acquireJob: <TPayload = unknown>(type: string) => Promise<Job<TPayload> | null>;

  /** ジョブを完了 */
  completeJob: <T>(id: string, result: T) => Promise<void>;

  /** ジョブを失敗 */
  failJob: (id: string, error: string) => Promise<boolean>;

  /** 進捗を更新 */
  updateProgress: (id: string, progress: number) => Promise<void>;
}
