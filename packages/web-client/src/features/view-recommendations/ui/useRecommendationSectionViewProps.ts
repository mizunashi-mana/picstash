import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  fetchRecommendations,
  recordImpressions,
} from '@/features/view-recommendations/api/recommendations';
import { useApiClient } from '@/shared';
import type { RecommendationSectionViewProps } from '@/features/view-recommendations/ui/RecommendationSectionView';

/** Maps imageId to conversionId */
type ConversionMap = Map<string, string>;

export function useRecommendationSectionViewProps(): RecommendationSectionViewProps {
  const apiClient = useApiClient();

  // === Queries ===
  const { data, isLoading, error } = useQuery({
    queryKey: ['recommendations'],
    queryFn: async () => await fetchRecommendations({ limit: 12 }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // === Impression tracking ===
  const [conversionMap, setConversionMap] = useState<ConversionMap>(new Map());
  const recordedRef = useRef<string | null>(null);

  // Record impressions when recommendations are loaded
  useEffect(() => {
    if (
      data === undefined
      || data.recommendations.length === 0
    ) {
      return;
    }

    // Create a stable key to track if we've already recorded these recommendations
    const key = data.recommendations.map(r => r.id).join(',');
    if (recordedRef.current === key) {
      return;
    }

    recordedRef.current = key;

    // Record impressions
    const inputs = data.recommendations.map(rec => ({
      imageId: rec.id,
      score: rec.score,
    }));

    recordImpressions(inputs)
      .then((result) => {
        // Build mapping from imageId to conversionId
        const map = new Map<string, string>();
        data.recommendations.forEach((rec, index) => {
          const conversionId = result.ids[index];
          if (conversionId !== undefined) {
            map.set(rec.id, conversionId);
          }
        });
        setConversionMap(map);
      })
      .catch(() => {
        // Silently fail - impression tracking is not critical
      });
  }, [data]);

  // === Selectors ===
  const recommendations = data?.recommendations ?? [];
  const emptyReason = data?.reason;

  return {
    recommendations,
    conversionMap,
    isLoading,
    error,
    emptyReason,
    getThumbnailUrl: apiClient.images.getThumbnailUrl,
  };
}
