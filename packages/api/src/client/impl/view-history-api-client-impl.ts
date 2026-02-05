/**
 * View History API Client Implementation
 */

import {
  viewHistoryEndpoints,
  type ImageViewStats,
  type ViewHistory,
  type ViewHistoryListQuery,
  type ViewHistoryWithImage,
} from '@/view-history.js';
import type { HttpClient } from '@/client/http-client.js';
import type { ViewHistoryApiClient } from '@/client/view-history-api-client.js';

export function createViewHistoryApiClient(
  http: HttpClient,
): ViewHistoryApiClient {
  return {
    recordStart: async (imageId: string) =>
      await http.post<ViewHistory>(viewHistoryEndpoints.list(), { imageId }),

    recordEnd: async (viewHistoryId: string, duration: number) =>
      await http.patch<ViewHistory>(viewHistoryEndpoints.detail(viewHistoryId), {
        duration,
      }),

    list: async (options?: ViewHistoryListQuery) =>
      await http.get<ViewHistoryWithImage[]>(viewHistoryEndpoints.list(options)),

    imageStats: async (imageId: string) =>
      await http.get<ImageViewStats>(viewHistoryEndpoints.imageStats(imageId)),
  };
}
