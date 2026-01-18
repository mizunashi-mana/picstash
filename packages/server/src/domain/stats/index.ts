/** Overview statistics for the dashboard */
export interface OverviewStats {
  /** Total number of images in the library */
  totalImages: number;
  /** Total number of view history records */
  totalViews: number;
  /** Total viewing time in milliseconds */
  totalViewDuration: number;
  /** Recommendation conversion rate (0-1) */
  conversionRate: number;
  /** Average view duration in milliseconds */
  avgViewDuration: number | null;
}

/** Daily view statistics */
export interface DailyViewStats {
  /** Date (YYYY-MM-DD) */
  date: string;
  /** Number of views on this day */
  viewCount: number;
  /** Total duration on this day in milliseconds */
  totalDuration: number;
}

/** Daily recommendation statistics */
export interface DailyRecommendationStats {
  /** Date (YYYY-MM-DD) */
  date: string;
  /** Number of impressions on this day */
  impressions: number;
  /** Number of clicks on this day */
  clicks: number;
  /** Conversion rate on this day (0-1) */
  conversionRate: number;
}

/** Popular image with view statistics */
export interface PopularImage {
  /** Image ID */
  id: string;
  /** Thumbnail path */
  thumbnailPath: string | null;
  /** Number of views */
  viewCount: number;
  /** Total view duration in milliseconds */
  totalDuration: number;
  /** Last viewed date */
  lastViewedAt: Date | null;
}
