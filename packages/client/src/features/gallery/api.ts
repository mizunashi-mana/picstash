import { apiClient } from '@/api/client';

export interface Image {
  id: string;
  filename: string;
  path: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  createdAt: string;
  updatedAt: string;
}

export async function fetchImages(): Promise<Image[]> {
  return apiClient<Image[]>('/images');
}

export function getImageUrl(imageId: string): string {
  return `/api/images/${imageId}/file`;
}
