/**
 * View History API - エンドポイント定義と型
 *
 * client と server で共有する閲覧履歴関連の API 定義
 */

import { buildUrl } from './url.js';

// ============================================================
// レスポンス型
// ============================================================

/** 閲覧履歴 */
export interface ViewHistory {
  id: string;
  imageId: string;
  viewedAt: string;
  duration: number | null;
  createdAt: string;
  updatedAt: string;
}

/** 閲覧履歴（画像情報付き） */
export interface ViewHistoryWithImage extends ViewHistory {
  image: {
    id: string;
    title: string;
    thumbnailPath: string | null;
  };
}

/** 画像閲覧統計 */
export interface ImageViewStats {
  viewCount: number;
  totalDuration: number;
  lastViewedAt: string | null;
}

// ============================================================
// クエリパラメータ型
// ============================================================

/** 閲覧履歴一覧取得オプション */
export type ViewHistoryListQuery = {
  /** 取得件数 */
  limit?: number;
  /** オフセット */
  offset?: number;
};

// ============================================================
// エンドポイント定義
// ============================================================

/**
 * 閲覧履歴エンドポイント定義
 */
export const viewHistoryEndpoints = {
  /** 閲覧履歴一覧取得 (GET) / 閲覧開始記録 (POST) */
  list: (query?: ViewHistoryListQuery) => buildUrl('/api/view-history', query),

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
