import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  fetchOverviewStats,
  fetchPopularImages,
  fetchRecommendationTrends,
  fetchViewTrends,
} from '@/features/view-stats/api/stats';
import type { StatsPageViewProps } from '@/pages/stats/ui/StatsPageView';

export function useStatsPageViewProps(): StatsPageViewProps {
  // === State ===
  const [days, setDays] = useState('30');
  const daysNumber = parseInt(days, 10);

  // === Queries ===
  const overviewQuery = useQuery({
    queryKey: ['stats', 'overview', daysNumber],
    queryFn: async () => await fetchOverviewStats({ days: daysNumber }),
  });

  const viewTrendsQuery = useQuery({
    queryKey: ['stats', 'view-trends', daysNumber],
    queryFn: async () => await fetchViewTrends({ days: daysNumber }),
  });

  const recommendationTrendsQuery = useQuery({
    queryKey: ['stats', 'recommendation-trends', daysNumber],
    queryFn: async () => await fetchRecommendationTrends({ days: daysNumber }),
  });

  const popularImagesQuery = useQuery({
    queryKey: ['stats', 'popular-images', daysNumber],
    queryFn: async () => await fetchPopularImages({ days: daysNumber, limit: 10 }),
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
  };
}
