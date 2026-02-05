/**
 * Fetch Recommendations API Client
 *
 * Implements RecommendationsApiClient interface using fetch.
 */

import {
  recommendationsEndpoints,
  type CreateImpressionsInput,
  type CreateImpressionsResult,
  type RecommendationConversion,
  type RecommendationsApiClient,
  type RecommendationsQuery,
  type RecommendationsResult,
  type RecordClickInput,
} from '@picstash/api';
import { type BaseHttpClient } from './base-client';

export class FetchRecommendationsApiClient implements RecommendationsApiClient {
  private readonly http: BaseHttpClient;

  constructor(http: BaseHttpClient) {
    this.http = http;
  }

  async fetch(options?: RecommendationsQuery): Promise<RecommendationsResult> {
    return await this.http.get<RecommendationsResult>(
      recommendationsEndpoints.list(options),
    );
  }

  async recordImpressions(
    recommendations: CreateImpressionsInput[],
  ): Promise<CreateImpressionsResult> {
    return await this.http.post<CreateImpressionsResult>(
      recommendationsEndpoints.impressions,
      { recommendations },
    );
  }

  async recordClick(
    conversionId: string,
    input: RecordClickInput,
  ): Promise<RecommendationConversion> {
    return await this.http.patch<RecommendationConversion>(
      recommendationsEndpoints.click(conversionId),
      input,
    );
  }
}
