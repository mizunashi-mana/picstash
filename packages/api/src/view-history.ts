/**
 * View History API - エンドポイント定義と型
 *
 * client と server で共有する閲覧履歴関連の API 定義
 */

/**
 * 閲覧履歴エンドポイント定義
 */
export const viewHistoryEndpoints = {
  /** 閲覧履歴一覧取得 (GET) / 閲覧開始記録 (POST) */
  list: '/api/view-history' as const,

  /** 閲覧時間更新 (PATCH) */
  detail: (id: string) => `/api/view-history/${id}` as const,

  /** 画像の閲覧統計取得 */
  imageStats: (imageId: string) => `/api/images/${imageId}/view-stats` as const,

  /**
   * server 側のルート登録用パターン
   */
  routes: {
    list: '/api/view-history',
    detail: '/api/view-history/:id',
    imageStats: '/api/images/:id/view-stats',
  },
} as const;
