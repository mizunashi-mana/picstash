import { imageEndpoints } from '@picstash/api';
import { apiClient } from '@/shared/api/client';
import type { Image, PaginatedResult, PaginationOptions, UpdateImageInput } from '@/entities/image/model/types';

export async function fetchImages(query?: string): Promise<Image[]> {
  const trimmed = query?.trim();
  const q = trimmed !== '' ? trimmed : undefined;
  return await apiClient<Image[]>(imageEndpoints.list({ q }));
}

export async function fetchImagesPaginated(
  query?: string,
  options?: PaginationOptions,
): Promise<PaginatedResult<Image>> {
  const trimmed = query?.trim();
  const q = trimmed !== '' ? trimmed : undefined;
  return await apiClient<PaginatedResult<Image>>(
    imageEndpoints.list({
      q,
      limit: options?.limit ?? 50,
      offset: options?.offset ?? 0,
    }),
  );
}

export async function fetchImage(id: string): Promise<Image> {
  return await apiClient<Image>(imageEndpoints.detail(id));
}

export async function deleteImage(id: string): Promise<void> {
  await apiClient<undefined>(imageEndpoints.detail(id), { method: 'DELETE' });
}

export async function updateImage(
  id: string,
  input: UpdateImageInput,
): Promise<Image> {
  return await apiClient<Image>(imageEndpoints.detail(id), {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function getImageUrl(imageId: string): string {
  return imageEndpoints.file(imageId);
}

export function getThumbnailUrl(imageId: string): string {
  return imageEndpoints.thumbnail(imageId);
}
