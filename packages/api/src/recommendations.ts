/**
 * Recommendations API - エンドポイント定義と型
 *
 * client と server で共有するレコメンド関連の API 定義
 */

import { buildUrl } from './url.js';

// ============================================================
// レスポンス型
// ============================================================

/** レコメンド画像 */
export interface RecommendedImage {
  id: string;
  title: string;
  thumbnailPath: string | null;
  score: number;
}

/** レコメンド結果 */
export interface RecommendationsResult {
  recommendations: RecommendedImage[];
  reason?: 'no_history' | 'no_embeddings' | 'no_similar';
}

/** インプレッション記録入力 */
export interface CreateImpressionsInput {
  imageId: string;
  score: number;
}

/** インプレッション記録結果 */
export interface CreateImpressionsResult {
  ids: string[];
}

/** クリック記録入力 */
export interface RecordClickInput {
  viewHistoryId: string;
}

/** レコメンドコンバージョン */
export interface RecommendationConversion {
  id: string;
  imageId: string;
  recommendationScore: number;
  impressionAt: string;
  clickedAt: string | null;
  viewHistoryId: string | null;
  createdAt: string;
}

// ============================================================
// クエリパラメータ型
// ============================================================

/** レコメンド取得オプション */
export type RecommendationsQuery = {
  /** 取得件数 */
  limit?: number;
  /** 履歴参照日数 */
  historyDays?: number;
};

// ============================================================
// エンドポイント定義
// ============================================================

/**
 * レコメンドエンドポイント定義
 */
export const recommendationsEndpoints = {
  /** レコメンド取得 */
  list: (query?: RecommendationsQuery) =>
    buildUrl('/api/recommendations', query),

  /** インプレッション記録 */
  impressions: '/api/recommendation-conversions/impressions' as const,

  /** クリック記録 */
  click: (conversionId: string) =>
    `/api/recommendation-conversions/${conversionId}/click` as const,

  /**
   * server 側のルート登録用パターン
   */
  routes: {
    list: '/api/recommendations',
    impressions: '/api/recommendation-conversions/impressions',
    click: '/api/recommendation-conversions/:conversionId/click',
  },
} as const;
