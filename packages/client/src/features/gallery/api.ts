import { apiClient } from '@/api/client';

export interface Image {
  id: string;
  filename: string;
  path: string;
  thumbnailPath: string | null;
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

export async function fetchImage(id: string): Promise<Image> {
  return apiClient<Image>(`/images/${id}`);
}

export async function deleteImage(id: string): Promise<void> {
  await apiClient<void>(`/images/${id}`, { method: 'DELETE' });
}

export function getImageUrl(imageId: string): string {
  return `/api/images/${imageId}/file`;
}

export function getThumbnailUrl(imageId: string): string {
  return `/api/images/${imageId}/thumbnail`;
}
