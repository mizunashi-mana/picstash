import { apiClient } from '@/api/client';

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
  return await apiClient<CollectionWithCount[]>('/collections');
}

export async function fetchCollection(id: string): Promise<CollectionWithImages> {
  return await apiClient<CollectionWithImages>(`/collections/${id}`);
}

export async function createCollection(input: CreateCollectionInput): Promise<Collection> {
  return await apiClient<Collection>('/collections', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateCollection(
  id: string,
  input: UpdateCollectionInput,
): Promise<Collection> {
  return await apiClient<Collection>(`/collections/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function deleteCollection(id: string): Promise<void> {
  await apiClient<undefined>(`/collections/${id}`, { method: 'DELETE' });
}

export async function addImageToCollection(
  collectionId: string,
  input: AddImageInput,
): Promise<void> {
  await apiClient<undefined>(`/collections/${collectionId}/images`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function removeImageFromCollection(
  collectionId: string,
  imageId: string,
): Promise<void> {
  await apiClient<undefined>(`/collections/${collectionId}/images/${imageId}`, {
    method: 'DELETE',
  });
}

export async function updateImageOrder(
  collectionId: string,
  input: UpdateOrderInput,
): Promise<void> {
  await apiClient<undefined>(`/collections/${collectionId}/images/order`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function fetchImageCollections(imageId: string): Promise<Collection[]> {
  return await apiClient<Collection[]>(`/images/${imageId}/collections`);
}
