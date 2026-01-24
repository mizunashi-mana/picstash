/**
 * Stats API - エンドポイント定義と型
 *
 * client と server で共有する統計関連の API 定義
 */
import { z } from 'zod';

/**
 * 統計エンドポイント定義
 */
export const statsEndpoints = {
  /** 概要統計を取得 */
  overview: '/api/stats/overview' as const,

  /** 日別閲覧トレンドを取得 */
  viewTrends: '/api/stats/view-trends' as const,

  /** 日別レコメンドトレンドを取得 */
  recommendationTrends: '/api/stats/recommendation-trends' as const,

  /** よく閲覧された画像を取得 */
  popularImages: '/api/stats/popular-images' as const,

  /**
   * server 側のルート登録用パターン
   */
  routes: {
    overview: '/api/stats/overview',
    viewTrends: '/api/stats/view-trends',
    recommendationTrends: '/api/stats/recommendation-trends',
    popularImages: '/api/stats/popular-images',
  },
} as const;

// ============================================================
// Zod スキーマ定義
// ============================================================

/**
 * 概要統計のスキーマ
 */
export const OverviewStatsSchema = z.object({
  /** 総画像数 */
  totalImages: z.number(),
  /** 総閲覧数 */
  totalViews: z.number(),
  /** 総閲覧時間（ミリ秒） */
  totalViewDuration: z.number(),
  /** コンバージョン率（0-1） */
  conversionRate: z.number(),
  /** 平均閲覧時間（ミリ秒） */
  avgViewDuration: z.number().nullable(),
});

/**
 * 日別閲覧統計のスキーマ
 */
export const DailyViewStatsSchema = z.object({
  /** 日付（YYYY-MM-DD） */
  date: z.string(),
  /** 閲覧数 */
  viewCount: z.number(),
  /** 合計閲覧時間（ミリ秒） */
  totalDuration: z.number(),
});

/**
 * 日別レコメンド統計のスキーマ
 */
export const DailyRecommendationStatsSchema = z.object({
  /** 日付（YYYY-MM-DD） */
  date: z.string(),
  /** 表示回数 */
  impressions: z.number(),
  /** クリック数 */
  clicks: z.number(),
  /** コンバージョン率（0-1） */
  conversionRate: z.number(),
});

/**
 * よく閲覧された画像のスキーマ
 */
export const PopularImageSchema = z.object({
  /** 画像 ID */
  id: z.string(),
  /** 画像タイトル */
  title: z.string(),
  /** サムネイルパス（内部用、URL 生成には imageEndpoints.thumbnail を使用） */
  thumbnailPath: z.string().nullable(),
  /** 閲覧数 */
  viewCount: z.number(),
  /** 合計閲覧時間（ミリ秒） */
  totalDuration: z.number(),
  /** 最終閲覧日時（ISO 8601 文字列） */
  lastViewedAt: z.string().nullable(),
});

// ============================================================
// 型定義（Zod スキーマから導出）
// ============================================================

/** 概要統計 */
export type OverviewStats = z.infer<typeof OverviewStatsSchema>;

/** 日別閲覧統計 */
export type DailyViewStats = z.infer<typeof DailyViewStatsSchema>;

/** 日別レコメンド統計 */
export type DailyRecommendationStats = z.infer<
  typeof DailyRecommendationStatsSchema
>;

/** よく閲覧された画像 */
export type PopularImage = z.infer<typeof PopularImageSchema>;

// ============================================================
// クエリパラメータ型
// ============================================================

/** 統計取得オプション */
export interface StatsQueryOptions {
  /** 取得期間（日数） */
  days?: number;
}

/** よく閲覧された画像取得オプション */
export interface PopularImagesQueryOptions extends StatsQueryOptions {
  /** 取得件数上限 */
  limit?: number;
}
