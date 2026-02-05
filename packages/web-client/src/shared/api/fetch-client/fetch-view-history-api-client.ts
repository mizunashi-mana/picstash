/**
 * Fetch View History API Client
 *
 * Implements ViewHistoryApiClient interface using fetch.
 */

import {
  viewHistoryEndpoints,
  type ImageViewStats,
  type ViewHistory,
  type ViewHistoryApiClient,
  type ViewHistoryListQuery,
  type ViewHistoryWithImage,
} from '@picstash/api';
import { type BaseHttpClient } from './base-client';

export class FetchViewHistoryApiClient implements ViewHistoryApiClient {
  private readonly http: BaseHttpClient;

  constructor(http: BaseHttpClient) {
    this.http = http;
  }

  async recordStart(imageId: string): Promise<ViewHistory> {
    return await this.http.post<ViewHistory>(viewHistoryEndpoints.list(), {
      imageId,
    });
  }

  async recordEnd(viewHistoryId: string, duration: number): Promise<ViewHistory> {
    return await this.http.patch<ViewHistory>(
      viewHistoryEndpoints.detail(viewHistoryId),
      { duration },
    );
  }

  async list(options?: ViewHistoryListQuery): Promise<ViewHistoryWithImage[]> {
    return await this.http.get<ViewHistoryWithImage[]>(
      viewHistoryEndpoints.list(options),
    );
  }

  async imageStats(imageId: string): Promise<ImageViewStats> {
    return await this.http.get<ImageViewStats>(
      viewHistoryEndpoints.imageStats(imageId),
    );
  }
}
