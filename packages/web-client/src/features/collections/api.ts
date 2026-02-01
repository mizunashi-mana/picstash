import { collectionsEndpoints, imageEndpoints } from '@picstash/api';
import { apiClient } from '@/shared/api/client';

export interface Collection {
  id: string;
  name: string;
  description: string | null;
  coverImageId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionWithCount extends Collection {
  imageCount: number;
}

export interface CollectionImage {
  id: string;
  imageId: string;
  order: number;
  title: string;
  thumbnailPath: string | null;
}

export interface CollectionWithImages extends Collection {
  images: CollectionImage[];
}

export interface CreateCollectionInput {
  name: string;
  description?: string;
  coverImageId?: string;
}

export interface UpdateCollectionInput {
  name?: string;
  description?: string | null;
  coverImageId?: string | null;
}

export interface AddImageInput {
  imageId: string;
  order?: number;
}

export interface UpdateOrderInput {
  orders: Array<{
    imageId: string;
    order: number;
  }>;
}

export async function fetchCollections(): Promise<CollectionWithCount[]> {
  return await apiClient<CollectionWithCount[]>(collectionsEndpoints.list);
}

export async function fetchCollection(id: string): Promise<CollectionWithImages> {
  return await apiClient<CollectionWithImages>(collectionsEndpoints.detail(id));
}

export async function createCollection(input: CreateCollectionInput): Promise<Collection> {
  return await apiClient<Collection>(collectionsEndpoints.list, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateCollection(
  id: string,
  input: UpdateCollectionInput,
): Promise<Collection> {
  return await apiClient<Collection>(collectionsEndpoints.detail(id), {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function deleteCollection(id: string): Promise<void> {
  await apiClient<undefined>(collectionsEndpoints.detail(id), { method: 'DELETE' });
}

export async function addImageToCollection(
  collectionId: string,
  input: AddImageInput,
): Promise<void> {
  await apiClient<undefined>(collectionsEndpoints.images.list(collectionId), {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function removeImageFromCollection(
  collectionId: string,
  imageId: string,
): Promise<void> {
  await apiClient<undefined>(collectionsEndpoints.images.detail(collectionId, imageId), {
    method: 'DELETE',
  });
}

export async function updateImageOrder(
  collectionId: string,
  input: UpdateOrderInput,
): Promise<void> {
  await apiClient<undefined>(collectionsEndpoints.images.order(collectionId), {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function fetchImageCollections(imageId: string): Promise<Collection[]> {
  return await apiClient<Collection[]>(imageEndpoints.collections(imageId));
}
