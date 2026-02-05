/**
 * Recommendations API Client Interface
 */

import type {
  CreateImpressionsInput,
  CreateImpressionsResult,
  RecommendationConversion,
  RecommendationsQuery,
  RecommendationsResult,
  RecordClickInput,
} from '@/recommendations.js';

export interface RecommendationsApiClient {
  /** レコメンド取得 */
  fetch: (options?: RecommendationsQuery) => Promise<RecommendationsResult>;

  /** インプレッション記録 */
  recordImpressions: (recommendations: CreateImpressionsInput[]) => Promise<CreateImpressionsResult>;

  /** クリック記録 */
  recordClick: (conversionId: string, input: RecordClickInput) => Promise<RecommendationConversion>;
}
