/**
 * Fetch Stats API Client
 *
 * Implements StatsApiClient interface using fetch.
 */

import {
  statsEndpoints,
  type DailyRecommendationStats,
  type DailyViewStats,
  type OverviewStats,
  type PopularImage,
  type PopularImagesQueryOptions,
  type StatsApiClient,
  type StatsQueryOptions,
} from '@picstash/api';
import { type BaseHttpClient } from './base-client';

export class FetchStatsApiClient implements StatsApiClient {
  private readonly http: BaseHttpClient;

  constructor(http: BaseHttpClient) {
    this.http = http;
  }

  async overview(options?: StatsQueryOptions): Promise<OverviewStats> {
    return await this.http.get<OverviewStats>(statsEndpoints.overview(options));
  }

  async viewTrends(options?: StatsQueryOptions): Promise<DailyViewStats[]> {
    return await this.http.get<DailyViewStats[]>(statsEndpoints.viewTrends(options));
  }

  async recommendationTrends(
    options?: StatsQueryOptions,
  ): Promise<DailyRecommendationStats[]> {
    return await this.http.get<DailyRecommendationStats[]>(
      statsEndpoints.recommendationTrends(options),
    );
  }

  async popularImages(
    options?: PopularImagesQueryOptions,
  ): Promise<PopularImage[]> {
    return await this.http.get<PopularImage[]>(
      statsEndpoints.popularImages(options),
    );
  }
}
