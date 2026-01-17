import type {
  OverviewStats,
  DailyViewStats,
  DailyRecommendationStats,
  PopularImage,
} from '@/domain/stats/index.js';

// Re-export domain types for convenience
export type {
  OverviewStats,
  DailyViewStats,
  DailyRecommendationStats,
  PopularImage,
};

/** Options for fetching trend data */
export interface TrendOptions {
  /** Number of days to look back (default: 30) */
  days?: number;
}

/** Options for fetching popular images */
export interface PopularImagesOptions {
  /** Number of days to look back (default: 30) */
  days?: number;
  /** Maximum number of images to return (default: 10) */
  limit?: number;
}

export interface StatsRepository {
  /** Get overview statistics */
  getOverview: (options?: TrendOptions) => Promise<OverviewStats>;

  /** Get daily view trends */
  getViewTrends: (options?: TrendOptions) => Promise<DailyViewStats[]>;

  /** Get daily recommendation trends */
  getRecommendationTrends: (
    options?: TrendOptions,
  ) => Promise<DailyRecommendationStats[]>;

  /** Get popular images by view count */
  getPopularImages: (options?: PopularImagesOptions) => Promise<PopularImage[]>;
}
