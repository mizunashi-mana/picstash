/**
 * Jobs API - エンドポイント定義と型
 *
 * client と server で共有するジョブ関連の API 定義
 */

import { buildUrl } from './url.js';

// ============================================================
// レスポンス型
// ============================================================

/** ジョブステータス */
export type JobStatusValue = 'waiting' | 'active' | 'completed' | 'failed';

/** ジョブ詳細 */
export interface Job {
  id: string;
  type: string;
  status: JobStatusValue;
  progress: number;
  result?: Record<string, unknown>;
  error?: string;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

// ============================================================
// クエリパラメータ型
// ============================================================

/** ジョブ一覧取得オプション */
export type JobsListQuery = {
  /** ステータスフィルタ（カンマ区切りで複数指定可） */
  status?: string;
  /** ジョブタイプフィルタ */
  type?: string;
  /** 取得件数 */
  limit?: number;
  /** オフセット */
  offset?: number;
};

// ============================================================
// エンドポイント定義
// ============================================================

/**
 * ジョブエンドポイント定義
 */
export const jobsEndpoints = {
  /** ジョブ一覧取得 */
  list: (query?: JobsListQuery) => buildUrl('/api/jobs', query),

  /** ジョブ詳細取得 */
  detail: (jobId: string) => `/api/jobs/${jobId}` as const,

  /**
   * server 側のルート登録用パターン
   */
  routes: {
    list: '/api/jobs',
    detail: '/api/jobs/:id',
  },
} as const;
