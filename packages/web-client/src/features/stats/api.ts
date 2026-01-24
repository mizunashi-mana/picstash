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

export async function fetchOverviewStats(
  options?: StatsQueryOptions,
): Promise<OverviewStats> {
  return await apiClient<OverviewStats>(statsEndpoints.overview(options));
}

export async function fetchViewTrends(
  options?: StatsQueryOptions,
): Promise<DailyViewStats[]> {
  return await apiClient<DailyViewStats[]>(statsEndpoints.viewTrends(options));
}

export async function fetchRecommendationTrends(
  options?: StatsQueryOptions,
): Promise<DailyRecommendationStats[]> {
  return await apiClient<DailyRecommendationStats[]>(
    statsEndpoints.recommendationTrends(options),
  );
}

export async function fetchPopularImages(
  options?: PopularImagesQueryOptions,
): Promise<PopularImage[]> {
  return await apiClient<PopularImage[]>(statsEndpoints.popularImages(options));
}
