/* v8 ignore file -- Hook: API 呼び出しが主体でモック困難 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApiClient } from '@/shared';
import type { StatsPageViewProps } from '@/pages/stats/ui/StatsPageView';

export function useStatsPageViewProps(): StatsPageViewProps {
  // === State ===
  const [days, setDays] = useState('30');
  const daysNumber = parseInt(days, 10);
  const apiClient = useApiClient();

  // === Queries ===
  const overviewQuery = useQuery({
    queryKey: ['stats', 'overview', daysNumber],
    queryFn: async () => await apiClient.stats.overview({ days: daysNumber }),
  });

  const viewTrendsQuery = useQuery({
    queryKey: ['stats', 'view-trends', daysNumber],
    queryFn: async () => await apiClient.stats.viewTrends({ days: daysNumber }),
  });

  const recommendationTrendsQuery = useQuery({
    queryKey: ['stats', 'recommendation-trends', daysNumber],
    queryFn: async () => await apiClient.stats.recommendationTrends({ days: daysNumber }),
  });

  const popularImagesQuery = useQuery({
    queryKey: ['stats', 'popular-images', daysNumber],
    queryFn: async () => await apiClient.stats.popularImages({ days: daysNumber, limit: 10 }),
  });

  // === Derived state ===
  const isLoading = overviewQuery.isLoading || viewTrendsQuery.isLoading
    || recommendationTrendsQuery.isLoading || popularImagesQuery.isLoading;
  const hasError = overviewQuery.isError || viewTrendsQuery.isError
    || recommendationTrendsQuery.isError || popularImagesQuery.isError;

  return {
    days,
    overviewStats: overviewQuery.data,
    viewTrends: viewTrendsQuery.data,
    recommendationTrends: recommendationTrendsQuery.data,
    popularImages: popularImagesQuery.data,
    isLoading,
    hasError,
    onDaysChange: setDays,
    getThumbnailUrl: apiClient.images.getThumbnailUrl,
  };
}
