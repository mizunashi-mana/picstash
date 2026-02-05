/**
 * Stats API Client Implementation
 */

import {
  statsEndpoints,
  type DailyRecommendationStats,
  type DailyViewStats,
  type OverviewStats,
  type PopularImage,
  type PopularImagesQueryOptions,
  type StatsQueryOptions,
} from '@/stats.js';
import type { HttpClient } from '@/client/http-client.js';
import type { StatsApiClient } from '@/client/stats-api-client.js';

export function createStatsApiClient(http: HttpClient): StatsApiClient {
  return {
    overview: async (options?: StatsQueryOptions) =>
      await http.get<OverviewStats>(statsEndpoints.overview(options)),

    viewTrends: async (options?: StatsQueryOptions) =>
      await http.get<DailyViewStats[]>(statsEndpoints.viewTrends(options)),

    recommendationTrends: async (options?: StatsQueryOptions) =>
      await http.get<DailyRecommendationStats[]>(
        statsEndpoints.recommendationTrends(options),
      ),

    popularImages: async (options?: PopularImagesQueryOptions) =>
      await http.get<PopularImage[]>(statsEndpoints.popularImages(options)),
  };
}
