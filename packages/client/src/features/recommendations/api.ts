import { apiClient } from '@/api/client';

export interface RecommendedImage {
  id: string;
  filename: string;
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
  const url = `/recommendations${queryString !== '' ? `?${queryString}` : ''}`;
  return await apiClient<RecommendationsResult>(url);
}
