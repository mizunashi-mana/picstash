import { apiClient } from '@/api/client';
import { viewHistoryEndpoints } from '@picstash/api';

export interface ViewHistory {
  id: string;
  imageId: string;
  viewedAt: string;
  duration: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ViewHistoryWithImage extends ViewHistory {
  image: {
    id: string;
    title: string;
    thumbnailPath: string | null;
  };
}

export interface ImageViewStats {
  viewCount: number;
  totalDuration: number;
  lastViewedAt: string | null;
}

export async function recordViewStart(imageId: string): Promise<ViewHistory> {
  return await apiClient<ViewHistory>(viewHistoryEndpoints.list, {
    method: 'POST',
    body: JSON.stringify({ imageId }),
  });
}

export async function recordViewEnd(
  viewHistoryId: string,
  duration: number,
): Promise<ViewHistory> {
  return await apiClient<ViewHistory>(viewHistoryEndpoints.detail(viewHistoryId), {
    method: 'PATCH',
    body: JSON.stringify({ duration }),
  });
}

export async function fetchViewHistory(options?: {
  limit?: number;
  offset?: number;
}): Promise<ViewHistoryWithImage[]> {
  const params = new URLSearchParams();
  if (options?.limit !== undefined) {
    params.set('limit', options.limit.toString());
  }
  if (options?.offset !== undefined) {
    params.set('offset', options.offset.toString());
  }
  const queryString = params.toString();
  const baseUrl = viewHistoryEndpoints.list;
  const url = queryString !== '' ? `${baseUrl}?${queryString}` : baseUrl;
  return await apiClient<ViewHistoryWithImage[]>(url);
}

export async function fetchImageViewStats(imageId: string): Promise<ImageViewStats> {
  return await apiClient<ImageViewStats>(viewHistoryEndpoints.imageStats(imageId));
}
