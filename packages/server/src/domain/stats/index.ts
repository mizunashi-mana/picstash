/**
 * Stats ドメイン - @picstash/api から型を re-export
 *
 * API レスポンスの型安全性のため、shared パッケージの型を使用
 */
export type {
  OverviewStats,
  DailyViewStats,
  DailyRecommendationStats,
  PopularImage,
} from '@picstash/api';
