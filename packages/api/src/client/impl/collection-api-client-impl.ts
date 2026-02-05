/**
 * Collection API Client Implementation
 */

import {
  collectionsEndpoints,
  type AddImageInput,
  type Collection,
  type CollectionWithCount,
  type CollectionWithImages,
  type CreateCollectionInput,
  type UpdateCollectionInput,
  type UpdateOrderInput,
} from '@/collections.js';
import { imageEndpoints } from '@/images.js';
import type { CollectionApiClient } from '@/client/collection-api-client.js';
import type { HttpClient } from '@/client/http-client.js';

export function createCollectionApiClient(
  http: HttpClient,
): CollectionApiClient {
  return {
    list: async () =>
      await http.get<CollectionWithCount[]>(collectionsEndpoints.list),

    detail: async (collectionId: string) =>
      await http.get<CollectionWithImages>(
        collectionsEndpoints.detail(collectionId),
      ),

    create: async (input: CreateCollectionInput) =>
      await http.post<Collection>(collectionsEndpoints.list, input),

    update: async (collectionId: string, input: UpdateCollectionInput) =>
      await http.put<Collection>(
        collectionsEndpoints.detail(collectionId),
        input,
      ),

    delete: async (collectionId: string) => {
      await http.delete(collectionsEndpoints.detail(collectionId));
    },

    addImage: async (collectionId: string, input: AddImageInput) => {
      await http.post<unknown>(
        collectionsEndpoints.images.list(collectionId),
        input,
      );
    },

    removeImage: async (collectionId: string, imageId: string) => {
      await http.delete(
        collectionsEndpoints.images.detail(collectionId, imageId),
      );
    },

    updateImageOrder: async (collectionId: string, input: UpdateOrderInput) => {
      await http.put<unknown>(
        collectionsEndpoints.images.order(collectionId),
        input,
      );
    },

    fetchImageCollections: async (imageId: string) =>
      await http.get<Collection[]>(imageEndpoints.collections(imageId)),
  };
}
