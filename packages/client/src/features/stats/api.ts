import { apiClient } from '@/api/client';

export interface OverviewStats {
  totalImages: number;
  totalViews: number;
  totalViewDuration: number;
  conversionRate: number;
  avgViewDuration: number | null;
}

export interface DailyViewStats {
  date: string;
  viewCount: number;
  totalDuration: number;
}

export interface DailyRecommendationStats {
  date: string;
  impressions: number;
  clicks: number;
  conversionRate: number;
}

export interface PopularImage {
  id: string;
  filename: string;
  thumbnailPath: string | null;
  viewCount: number;
  totalDuration: number;
  lastViewedAt: string | null;
}

export interface StatsOptions {
  days?: number;
}

export interface PopularImagesOptions extends StatsOptions {
  limit?: number;
}

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
  options?: StatsOptions,
): Promise<OverviewStats> {
  const queryString = buildQueryString({ days: options?.days });
  return await apiClient<OverviewStats>(`/stats/overview${queryString}`);
}

export async function fetchViewTrends(
  options?: StatsOptions,
): Promise<DailyViewStats[]> {
  const queryString = buildQueryString({ days: options?.days });
  return await apiClient<DailyViewStats[]>(`/stats/view-trends${queryString}`);
}

export async function fetchRecommendationTrends(
  options?: StatsOptions,
): Promise<DailyRecommendationStats[]> {
  const queryString = buildQueryString({ days: options?.days });
  return await apiClient<DailyRecommendationStats[]>(
    `/stats/recommendation-trends${queryString}`,
  );
}

export async function fetchPopularImages(
  options?: PopularImagesOptions,
): Promise<PopularImage[]> {
  const queryString = buildQueryString({
    days: options?.days,
    limit: options?.limit,
  });
  return await apiClient<PopularImage[]>(`/stats/popular-images${queryString}`);
}
