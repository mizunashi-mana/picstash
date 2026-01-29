import { apiClient } from '@/api/client';

export interface RecommendedImage {
  id: string;
  title: string;
  thumbnailPath: string | null;
  score: number;
}

export interface RecommendationsResult {
  recommendations: RecommendedImage[];
  reason?: 'no_history' | 'no_embeddings' | 'no_similar';
}

export interface FetchRecommendationsOptions {
  limit?: number;
  historyDays?: number;
}

export async function fetchRecommendations(
  options?: FetchRecommendationsOptions,
): Promise<RecommendationsResult> {
  const params = new URLSearchParams();
  if (options?.limit !== undefined) {
    params.set('limit', options.limit.toString());
  }
  if (options?.historyDays !== undefined) {
    params.set('historyDays', options.historyDays.toString());
  }
  const queryString = params.toString();
  const url = `/api/recommendations${queryString !== '' ? `?${queryString}` : ''}`;
  return await apiClient<RecommendationsResult>(url);
}

// Conversion tracking types and functions

export interface CreateImpressionsInput {
  imageId: string;
  score: number;
}

export interface CreateImpressionsResult {
  ids: string[];
}

export interface RecordClickInput {
  viewHistoryId: string;
}

export interface RecommendationConversion {
  id: string;
  imageId: string;
  recommendationScore: number;
  impressionAt: string;
  clickedAt: string | null;
  viewHistoryId: string | null;
  createdAt: string;
}

/** Record impressions when recommendations are displayed */
export async function recordImpressions(
  recommendations: CreateImpressionsInput[],
): Promise<CreateImpressionsResult> {
  return await apiClient<CreateImpressionsResult>(
    '/api/recommendation-conversions/impressions',
    {
      method: 'POST',
      body: JSON.stringify({ recommendations }),
    },
  );
}

/** Record a click on a recommendation */
export async function recordRecommendationClick(
  conversionId: string,
  input: RecordClickInput,
): Promise<RecommendationConversion> {
  return await apiClient<RecommendationConversion>(
    `/api/recommendation-conversions/${conversionId}/click`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
  );
}
