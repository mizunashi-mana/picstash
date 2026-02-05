/**
 * Recommendations API Client Implementation
 */

import {
  recommendationsEndpoints,
  type CreateImpressionsInput,
  type CreateImpressionsResult,
  type RecommendationConversion,
  type RecommendationsQuery,
  type RecommendationsResult,
  type RecordClickInput,
} from '@/recommendations.js';
import type { HttpClient } from '@/client/http-client.js';
import type { RecommendationsApiClient } from '@/client/recommendations-api-client.js';

export function createRecommendationsApiClient(
  http: HttpClient,
): RecommendationsApiClient {
  return {
    fetch: async (options?: RecommendationsQuery) =>
      await http.get<RecommendationsResult>(
        recommendationsEndpoints.list(options),
      ),

    recordImpressions: async (recommendations: CreateImpressionsInput[]) =>
      await http.post<CreateImpressionsResult>(
        recommendationsEndpoints.impressions,
        { recommendations },
      ),

    recordClick: async (conversionId: string, input: RecordClickInput) =>
      await http.patch<RecommendationConversion>(
        recommendationsEndpoints.click(conversionId),
        input,
      ),
  };
}
