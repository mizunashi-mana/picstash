import { apiClient } from '@/api/client';
import type {
  CreateImageAttributeInput,
  ImageAttribute,
  UpdateImageAttributeInput,
} from '@picstash/shared';

export interface Image {
  id: string;
  filename: string;
  path: string;
  thumbnailPath: string | null;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateImageInput {
  description?: string | null;
}

export async function fetchImages(query?: string): Promise<Image[]> {
  const url = query != null && query.trim() !== ''
    ? `/images?q=${encodeURIComponent(query.trim())}`
    : '/images';
  return apiClient<Image[]>(url);
}

export async function fetchImage(id: string): Promise<Image> {
  return apiClient<Image>(`/images/${id}`);
}

export async function deleteImage(id: string): Promise<void> {
  await apiClient<void>(`/images/${id}`, { method: 'DELETE' });
}

export async function updateImage(
  id: string,
  input: UpdateImageInput,
): Promise<Image> {
  return apiClient<Image>(`/images/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function getImageUrl(imageId: string): string {
  return `/api/images/${imageId}/file`;
}

export function getThumbnailUrl(imageId: string): string {
  return `/api/images/${imageId}/thumbnail`;
}

// Image Attribute APIs
export async function fetchImageAttributes(
  imageId: string,
): Promise<ImageAttribute[]> {
  return apiClient<ImageAttribute[]>(`/images/${imageId}/attributes`);
}

export async function createImageAttribute(
  imageId: string,
  input: CreateImageAttributeInput,
): Promise<ImageAttribute> {
  return apiClient<ImageAttribute>(`/images/${imageId}/attributes`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateImageAttribute(
  imageId: string,
  attributeId: string,
  input: UpdateImageAttributeInput,
): Promise<ImageAttribute> {
  return apiClient<ImageAttribute>(
    `/images/${imageId}/attributes/${attributeId}`,
    {
      method: 'PUT',
      body: JSON.stringify(input),
    },
  );
}

export async function deleteImageAttribute(
  imageId: string,
  attributeId: string,
): Promise<void> {
  await apiClient<void>(`/images/${imageId}/attributes/${attributeId}`, {
    method: 'DELETE',
  });
}

// Suggested Attributes API
export interface SuggestedKeyword {
  keyword: string;
  count: number;
}

export interface AttributeSuggestion {
  labelId: string;
  labelName: string;
  score: number;
  suggestedKeywords: SuggestedKeyword[];
}

export interface SuggestedAttributesResponse {
  imageId: string;
  suggestions: AttributeSuggestion[];
}

export async function fetchSuggestedAttributes(
  imageId: string,
  options?: { threshold?: number; limit?: number },
): Promise<SuggestedAttributesResponse> {
  const params = new URLSearchParams();
  if (options?.threshold != null) {
    params.set('threshold', options.threshold.toString());
  }
  if (options?.limit != null) {
    params.set('limit', options.limit.toString());
  }
  const queryString = params.toString();
  const url = `/images/${imageId}/suggested-attributes${queryString !== '' ? `?${queryString}` : ''}`;
  return apiClient<SuggestedAttributesResponse>(url);
}
