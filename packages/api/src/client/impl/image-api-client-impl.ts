/**
 * Image API Client Implementation
 */

import {
  imageEndpoints,
  type DuplicatesQuery,
  type DuplicatesResponse,
  type GenerateDescriptionJobResponse,
  type Image,
  type ImageListQuery,
  type PaginatedResult,
  type PaginationOptions,
  type SimilarImagesQuery,
  type SimilarImagesResponse,
  type SuggestedAttributesQuery,
  type SuggestedAttributesResponse,
  type UpdateImageInput,
} from '@/images.js';
import type { HttpClient } from '@/client/http-client.js';
import type { ImageApiClient } from '@/client/image-api-client.js';
import type { Collection } from '@/collections.js';

export function createImageApiClient(http: HttpClient): ImageApiClient {
  return {
    list: async (query?: ImageListQuery) =>
      await http.get<Image[]>(imageEndpoints.list(query)),

    listPaginated: async (query?: string, options?: PaginationOptions) =>
      await http.get<PaginatedResult<Image>>(
        imageEndpoints.list({ q: query, ...options }),
      ),

    detail: async (imageId: string) =>
      await http.get<Image>(imageEndpoints.detail(imageId)),

    update: async (imageId: string, input: UpdateImageInput) =>
      await http.patch<Image>(imageEndpoints.detail(imageId), input),

    delete: async (imageId: string) => {
      await http.delete(imageEndpoints.detail(imageId));
    },

    getImageUrl: (imageId: string) => imageEndpoints.file(imageId),

    getThumbnailUrl: (imageId: string) => imageEndpoints.thumbnail(imageId),

    fetchSimilar: async (imageId: string, query?: SimilarImagesQuery) =>
      await http.get<SimilarImagesResponse>(
        imageEndpoints.similar(imageId, query),
      ),

    fetchDuplicates: async (query?: DuplicatesQuery) =>
      await http.get<DuplicatesResponse>(imageEndpoints.duplicates(query)),

    fetchSuggestedAttributes: async (
      imageId: string,
      query?: SuggestedAttributesQuery,
    ) =>
      await http.get<SuggestedAttributesResponse>(
        imageEndpoints.suggestedAttributes(imageId, query),
      ),

    generateDescription: async (imageId: string) =>
      await http.post<GenerateDescriptionJobResponse>(
        imageEndpoints.generateDescription(imageId),
      ),

    fetchCollections: async (imageId: string) =>
      await http.get<Collection[]>(imageEndpoints.collections(imageId)),

    upload: async (file: Blob) => {
      const formData = new FormData();
      formData.append('image', file);
      return await http.postFormData<Image>(imageEndpoints.list(), formData);
    },
  };
}
