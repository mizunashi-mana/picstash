/**
 * View History API Client Interface
 */

import type { ViewHistoryListQuery,
  ImageViewStats,
  ViewHistory,
  ViewHistoryWithImage } from '@/view-history.js';

export interface ViewHistoryApiClient {
  /** 閲覧開始記録 */
  recordStart: (imageId: string) => Promise<ViewHistory>;

  /** 閲覧終了記録 */
  recordEnd: (viewHistoryId: string, duration: number) => Promise<ViewHistory>;

  /** 閲覧履歴一覧取得 */
  list: (options?: ViewHistoryListQuery) => Promise<ViewHistoryWithImage[]>;

  /** 画像閲覧統計取得 */
  imageStats: (imageId: string) => Promise<ImageViewStats>;
}
