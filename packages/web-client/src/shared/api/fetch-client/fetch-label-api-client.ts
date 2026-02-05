/**
 * Fetch Label API Client
 *
 * Implements LabelApiClient interface using fetch.
 */

import {
  labelsEndpoints,
  type CreateLabelInput,
  type Label,
  type LabelApiClient,
  type UpdateLabelInput,
} from '@picstash/api';
import { type BaseHttpClient } from './base-client';

export class FetchLabelApiClient implements LabelApiClient {
  private readonly http: BaseHttpClient;

  constructor(http: BaseHttpClient) {
    this.http = http;
  }

  async list(): Promise<Label[]> {
    return await this.http.get<Label[]>(labelsEndpoints.list);
  }

  async detail(labelId: string): Promise<Label> {
    return await this.http.get<Label>(labelsEndpoints.detail(labelId));
  }

  async create(input: CreateLabelInput): Promise<Label> {
    return await this.http.post<Label>(labelsEndpoints.create, input);
  }

  async update(labelId: string, input: UpdateLabelInput): Promise<Label> {
    return await this.http.put<Label>(labelsEndpoints.update(labelId), input);
  }

  async delete(labelId: string): Promise<void> {
    await this.http.delete(labelsEndpoints.delete(labelId));
  }
}
