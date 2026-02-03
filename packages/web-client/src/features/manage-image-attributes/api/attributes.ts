import {
  imageEndpoints,
  type CreateImageAttributeInput,
  type ImageAttribute,
  type UpdateImageAttributeInput,
} from '@picstash/api';
import { apiClient } from '@/shared/api/client';

export type { CreateImageAttributeInput, ImageAttribute, UpdateImageAttributeInput } from '@picstash/api';

// Image Attribute APIs
export async function fetchImageAttributes(
  imageId: string,
): Promise<ImageAttribute[]> {
  return await apiClient<ImageAttribute[]>(imageEndpoints.attributes.list(imageId));
}

export async function createImageAttribute(
  imageId: string,
  input: CreateImageAttributeInput,
): Promise<ImageAttribute> {
  return await apiClient<ImageAttribute>(imageEndpoints.attributes.list(imageId), {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateImageAttribute(
  imageId: string,
  attributeId: string,
  input: UpdateImageAttributeInput,
): Promise<ImageAttribute> {
  return await apiClient<ImageAttribute>(
    imageEndpoints.attributes.detail(imageId, attributeId),
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
  await apiClient<undefined>(imageEndpoints.attributes.detail(imageId, attributeId), {
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
  return await apiClient<SuggestedAttributesResponse>(
    imageEndpoints.suggestedAttributes(imageId, options),
  );
}
