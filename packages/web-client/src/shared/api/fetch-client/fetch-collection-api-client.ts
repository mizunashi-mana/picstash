/**
 * Fetch Collection API Client
 *
 * Implements CollectionApiClient interface using fetch.
 */

import {
  collectionsEndpoints,
  imageEndpoints,
  type AddImageInput,
  type Collection,
  type CollectionApiClient,
  type CollectionWithCount,
  type CollectionWithImages,
  type CreateCollectionInput,
  type UpdateCollectionInput,
  type UpdateOrderInput,
} from '@picstash/api';
import { type BaseHttpClient } from './base-client';

export class FetchCollectionApiClient implements CollectionApiClient {
  private readonly http: BaseHttpClient;

  constructor(http: BaseHttpClient) {
    this.http = http;
  }

  async list(): Promise<CollectionWithCount[]> {
    return await this.http.get<CollectionWithCount[]>(collectionsEndpoints.list);
  }

  async detail(collectionId: string): Promise<CollectionWithImages> {
    return await this.http.get<CollectionWithImages>(
      collectionsEndpoints.detail(collectionId),
    );
  }

  async create(input: CreateCollectionInput): Promise<Collection> {
    return await this.http.post<Collection>(collectionsEndpoints.list, input);
  }

  async update(
    collectionId: string,
    input: UpdateCollectionInput,
  ): Promise<Collection> {
    return await this.http.put<Collection>(
      collectionsEndpoints.detail(collectionId),
      input,
    );
  }

  async delete(collectionId: string): Promise<void> {
    await this.http.delete(collectionsEndpoints.detail(collectionId));
  }

  async addImage(collectionId: string, input: AddImageInput): Promise<void> {
    await this.http.post<undefined>(
      collectionsEndpoints.images.list(collectionId),
      input,
    );
  }

  async removeImage(collectionId: string, imageId: string): Promise<void> {
    await this.http.delete(
      collectionsEndpoints.images.detail(collectionId, imageId),
    );
  }

  async updateImageOrder(
    collectionId: string,
    input: UpdateOrderInput,
  ): Promise<void> {
    await this.http.put<undefined>(
      collectionsEndpoints.images.order(collectionId),
      input,
    );
  }

  async fetchImageCollections(imageId: string): Promise<Collection[]> {
    return await this.http.get<Collection[]>(imageEndpoints.collections(imageId));
  }
}
