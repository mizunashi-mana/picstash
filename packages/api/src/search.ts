/**
 * Search API - エンドポイント定義と型
 *
 * client と server で共有する検索関連の API 定義
 */

/**
 * 検索エンドポイント定義
 */
export const searchEndpoints = {
  /** 検索サジェスト取得 */
  suggestions: '/api/search/suggestions' as const,

  /** 検索履歴一覧取得 (GET) / 検索履歴保存 (POST) / 全履歴削除 (DELETE) */
  history: '/api/search/history' as const,

  /** 検索履歴削除 */
  historyDetail: (id: string) => `/api/search/history/${id}` as const,

  /**
   * server 側のルート登録用パターン
   */
  routes: {
    suggestions: '/api/search/suggestions',
    history: '/api/search/history',
    historyDetail: '/api/search/history/:id',
  },
} as const;
