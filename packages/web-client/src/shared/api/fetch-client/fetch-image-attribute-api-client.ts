/**
 * Fetch Image Attribute API Client
 *
 * Implements ImageAttributeApiClient interface using fetch.
 */

import {
  imageEndpoints,
  type CreateImageAttributeInput,
  type ImageAttribute,
  type ImageAttributeApiClient,
  type UpdateImageAttributeInput,
} from '@picstash/api';
import { type BaseHttpClient } from './base-client';

export class FetchImageAttributeApiClient implements ImageAttributeApiClient {
  private readonly http: BaseHttpClient;

  constructor(http: BaseHttpClient) {
    this.http = http;
  }

  async list(imageId: string): Promise<ImageAttribute[]> {
    return await this.http.get<ImageAttribute[]>(
      imageEndpoints.attributes.list(imageId),
    );
  }

  async create(
    imageId: string,
    input: CreateImageAttributeInput,
  ): Promise<ImageAttribute> {
    return await this.http.post<ImageAttribute>(
      imageEndpoints.attributes.list(imageId),
      input,
    );
  }

  async update(
    imageId: string,
    attributeId: string,
    input: UpdateImageAttributeInput,
  ): Promise<ImageAttribute> {
    return await this.http.put<ImageAttribute>(
      imageEndpoints.attributes.detail(imageId, attributeId),
      input,
    );
  }

  async delete(imageId: string, attributeId: string): Promise<void> {
    await this.http.delete(
      imageEndpoints.attributes.detail(imageId, attributeId),
    );
  }
}
