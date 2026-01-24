import {
  statsEndpoints,
  type OverviewStats,
  type DailyViewStats,
  type DailyRecommendationStats,
  type PopularImage,
  type StatsQueryOptions,
  type PopularImagesQueryOptions,
} from '@picstash/api';
import { apiClient } from '@/api/client';

// Re-export types for convenience
export type {
  OverviewStats,
  DailyViewStats,
  DailyRecommendationStats,
  PopularImage,
  StatsQueryOptions,
  PopularImagesQueryOptions,
};

function buildQueryString(params: Record<string, number | undefined>): string {
  const queryParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      queryParams.set(key, value.toString());
    }
  }
  const queryString = queryParams.toString();
  return queryString !== '' ? `?${queryString}` : '';
}

export async function fetchOverviewStats(
  options?: StatsQueryOptions,
): Promise<OverviewStats> {
  const queryString = buildQueryString({ days: options?.days });
  return await apiClient<OverviewStats>(`${statsEndpoints.overview}${queryString}`);
}

export async function fetchViewTrends(
  options?: StatsQueryOptions,
): Promise<DailyViewStats[]> {
  const queryString = buildQueryString({ days: options?.days });
  return await apiClient<DailyViewStats[]>(`${statsEndpoints.viewTrends}${queryString}`);
}

export async function fetchRecommendationTrends(
  options?: StatsQueryOptions,
): Promise<DailyRecommendationStats[]> {
  const queryString = buildQueryString({ days: options?.days });
  return await apiClient<DailyRecommendationStats[]>(
    `${statsEndpoints.recommendationTrends}${queryString}`,
  );
}

export async function fetchPopularImages(
  options?: PopularImagesQueryOptions,
): Promise<PopularImage[]> {
  const queryString = buildQueryString({
    days: options?.days,
    limit: options?.limit,
  });
  return await apiClient<PopularImage[]>(`${statsEndpoints.popularImages}${queryString}`);
}
