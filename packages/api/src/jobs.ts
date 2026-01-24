/**
 * Jobs API - エンドポイント定義と型
 *
 * client と server で共有するジョブ関連の API 定義
 */

/**
 * ジョブエンドポイント定義
 */
export const jobsEndpoints = {
  /** ジョブ一覧取得 */
  list: '/api/jobs' as const,

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
