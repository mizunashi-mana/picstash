/**
 * Stats API Client Interface
 */

import type {
  DailyRecommendationStats,
  DailyViewStats,
  OverviewStats,
  PopularImage,
  PopularImagesQueryOptions,
  StatsQueryOptions,
} from '../stats.js';

export interface StatsApiClient {
  /** 概要統計取得 */
  overview: (options?: StatsQueryOptions) => Promise<OverviewStats>;

  /** 日別閲覧トレンド取得 */
  viewTrends: (options?: StatsQueryOptions) => Promise<DailyViewStats[]>;

  /** 日別レコメンドトレンド取得 */
  recommendationTrends: (options?: StatsQueryOptions) => Promise<DailyRecommendationStats[]>;

  /** よく閲覧された画像取得 */
  popularImages: (options?: PopularImagesQueryOptions) => Promise<PopularImage[]>;
}
