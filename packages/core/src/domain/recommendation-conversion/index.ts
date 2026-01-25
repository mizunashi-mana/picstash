/** Recommendation conversion record */
export interface RecommendationConversion {
  id: string;
  imageId: string;
  recommendationScore: number;
  impressionAt: Date;
  clickedAt: Date | null;
  viewHistoryId: string | null;
  createdAt: Date;
}

/** Input for creating impression records */
export interface CreateImpressionInput {
  imageId: string;
  score: number;
}

/** Input for recording a click */
export interface RecordClickInput {
  viewHistoryId: string;
}

/** Conversion statistics for a time period */
export interface ConversionStats {
  /** Total number of impressions */
  totalImpressions: number;
  /** Total number of clicks */
  totalClicks: number;
  /** Conversion rate (clicks / impressions) */
  conversionRate: number;
  /** Average view duration for clicked recommendations (ms) */
  avgClickedDuration: number | null;
  /** Period start date */
  periodStart: Date;
  /** Period end date */
  periodEnd: Date;
}
