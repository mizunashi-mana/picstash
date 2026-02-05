/**
 * Fetch URL Crawl API Client
 *
 * Implements UrlCrawlApiClient interface using fetch.
 */

import {
  urlCrawlEndpoints,
  type UrlCrawlApiClient,
  type UrlCrawlImportResult,
  type UrlCrawlSession,
  type UrlCrawlSessionDetail,
} from '@picstash/api';
import { type BaseHttpClient } from './base-client';

export class FetchUrlCrawlApiClient implements UrlCrawlApiClient {
  private readonly http: BaseHttpClient;

  constructor(http: BaseHttpClient) {
    this.http = http;
  }

  async crawl(url: string): Promise<UrlCrawlSession> {
    return await this.http.post<UrlCrawlSession>(urlCrawlEndpoints.crawl, { url });
  }

  async getSession(sessionId: string): Promise<UrlCrawlSessionDetail> {
    return await this.http.get<UrlCrawlSessionDetail>(
      urlCrawlEndpoints.session(sessionId),
    );
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.http.delete(urlCrawlEndpoints.session(sessionId));
  }

  getThumbnailUrl(sessionId: string, imageIndex: number): string {
    return urlCrawlEndpoints.imageThumbnail(sessionId, imageIndex);
  }

  getImageUrl(sessionId: string, imageIndex: number): string {
    return urlCrawlEndpoints.imageFile(sessionId, imageIndex);
  }

  async importImages(
    sessionId: string,
    indices: number[],
  ): Promise<UrlCrawlImportResult> {
    return await this.http.post<UrlCrawlImportResult>(
      urlCrawlEndpoints.import(sessionId),
      { indices },
    );
  }
}
