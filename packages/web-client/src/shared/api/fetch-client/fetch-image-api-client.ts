/**
 * Fetch Image API Client
 *
 * Implements ImageApiClient interface using fetch.
 */

import {
  imageEndpoints,
  type Collection,
  type DuplicatesQuery,
  type DuplicatesResponse,
  type GenerateDescriptionJobResponse,
  type Image,
  type ImageApiClient,
  type ImageListQuery,
  type PaginatedResult,
  type PaginationOptions,
  type SimilarImagesQuery,
  type SimilarImagesResponse,
  type SuggestedAttributesQuery,
  type SuggestedAttributesResponse,
  type UpdateImageInput,
} from '@picstash/api';
import { type BaseHttpClient } from './base-client';

export class FetchImageApiClient implements ImageApiClient {
  private readonly http: BaseHttpClient;

  constructor(http: BaseHttpClient) {
    this.http = http;
  }

  async list(query?: ImageListQuery): Promise<Image[]> {
    return await this.http.get<Image[]>(imageEndpoints.list(query));
  }

  async listPaginated(
    query?: string,
    options?: PaginationOptions,
  ): Promise<PaginatedResult<Image>> {
    const trimmed = query?.trim();
    const q = trimmed !== '' ? trimmed : undefined;
    return await this.http.get<PaginatedResult<Image>>(
      imageEndpoints.list({
        q,
        limit: options?.limit ?? 50,
        offset: options?.offset ?? 0,
      }),
    );
  }

  async detail(imageId: string): Promise<Image> {
    return await this.http.get<Image>(imageEndpoints.detail(imageId));
  }

  async update(imageId: string, input: UpdateImageInput): Promise<Image> {
    return await this.http.patch<Image>(imageEndpoints.detail(imageId), input);
  }

  async delete(imageId: string): Promise<void> {
    await this.http.delete(imageEndpoints.detail(imageId));
  }

  getImageUrl(imageId: string): string {
    return imageEndpoints.file(imageId);
  }

  getThumbnailUrl(imageId: string): string {
    return imageEndpoints.thumbnail(imageId);
  }

  async fetchSimilar(
    imageId: string,
    query?: SimilarImagesQuery,
  ): Promise<SimilarImagesResponse> {
    return await this.http.get<SimilarImagesResponse>(
      imageEndpoints.similar(imageId, query),
    );
  }

  async fetchDuplicates(query?: DuplicatesQuery): Promise<DuplicatesResponse> {
    return await this.http.get<DuplicatesResponse>(imageEndpoints.duplicates(query));
  }

  async fetchSuggestedAttributes(
    imageId: string,
    query?: SuggestedAttributesQuery,
  ): Promise<SuggestedAttributesResponse> {
    return await this.http.get<SuggestedAttributesResponse>(
      imageEndpoints.suggestedAttributes(imageId, query),
    );
  }

  async generateDescription(
    imageId: string,
  ): Promise<GenerateDescriptionJobResponse> {
    return await this.http.post<GenerateDescriptionJobResponse>(
      imageEndpoints.generateDescription(imageId),
    );
  }

  async fetchCollections(imageId: string): Promise<Collection[]> {
    return await this.http.get<Collection[]>(imageEndpoints.collections(imageId));
  }

  async upload(file: Blob): Promise<Image> {
    const formData = new FormData();
    formData.append('image', file);
    return await this.http.postFormData<Image>(imageEndpoints.list(), formData);
  }
}
