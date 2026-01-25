import type {
  RecommendationConversion,
  CreateImpressionInput,
  RecordClickInput,
  ConversionStats,
} from '@/domain/recommendation-conversion/index.js';

// Re-export domain types for convenience
export type {
  RecommendationConversion,
  CreateImpressionInput,
  RecordClickInput,
  ConversionStats,
};

/** Options for getting conversion stats */
export interface ConversionStatsOptions {
  /** Number of days to look back (default: 30) */
  days?: number;
}

export interface RecommendationConversionRepository {
  /** Create impression records for displayed recommendations */
  createImpressions: (
    inputs: CreateImpressionInput[],
  ) => Promise<RecommendationConversion[]>;

  /** Find a conversion record by ID */
  findById: (id: string) => Promise<RecommendationConversion | null>;

  /** Record a click on a recommendation */
  recordClick: (
    id: string,
    input: RecordClickInput,
  ) => Promise<RecommendationConversion>;

  /** Get conversion statistics for a time period */
  getStats: (options?: ConversionStatsOptions) => Promise<ConversionStats>;
}
