// This file is deprecated. Use ApiClient from @/shared instead.
// Types should be imported from @picstash/api.
//
// Migration guide:
//   Before:
//     import { fetchRecommendations, recordImpressions } from '@/features/recommendations/api';
//     const result = await fetchRecommendations({ limit: 12 });
//
//   After:
//     import { useApiClient } from '@/shared';
//     import type { RecommendationsResult } from '@picstash/api';
//     const apiClient = useApiClient();
//     const result = await apiClient.recommendations.fetch({ limit: 12 });

export {};
