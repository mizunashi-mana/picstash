/**
 * Jobs API - エンドポイント定義と型
 *
 * client と server で共有するジョブ関連の API 定義
 */

import { buildUrl } from './url.js';

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
