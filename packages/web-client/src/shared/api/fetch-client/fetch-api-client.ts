/**
 * Fetch API Client
 *
 * Unified ApiClient implementation that composes all resource-specific clients.
 */

import { BaseHttpClient } from './base-client';
import { FetchArchiveImportApiClient } from './fetch-archive-import-api-client';
import { FetchCollectionApiClient } from './fetch-collection-api-client';
import { FetchDescriptionApiClient } from './fetch-description-api-client';
import { FetchImageApiClient } from './fetch-image-api-client';
import { FetchImageAttributeApiClient } from './fetch-image-attribute-api-client';
import { FetchJobsApiClient } from './fetch-jobs-api-client';
import { FetchLabelApiClient } from './fetch-label-api-client';
import { FetchRecommendationsApiClient } from './fetch-recommendations-api-client';
import { FetchSearchApiClient } from './fetch-search-api-client';
import { FetchStatsApiClient } from './fetch-stats-api-client';
import { FetchUrlCrawlApiClient } from './fetch-url-crawl-api-client';
import { FetchViewHistoryApiClient } from './fetch-view-history-api-client';
import type {
  ApiClient,
  ArchiveImportApiClient,
  CollectionApiClient,
  DescriptionApiClient,
  ImageApiClient,
  ImageAttributeApiClient,
  JobsApiClient,
  LabelApiClient,
  RecommendationsApiClient,
  SearchApiClient,
  StatsApiClient,
  UrlCrawlApiClient,
  ViewHistoryApiClient,
} from '@picstash/api';

export class FetchApiClient implements ApiClient {
  readonly images: ImageApiClient;
  readonly imageAttributes: ImageAttributeApiClient;
  readonly collections: CollectionApiClient;
  readonly labels: LabelApiClient;
  readonly search: SearchApiClient;
  readonly stats: StatsApiClient;
  readonly viewHistory: ViewHistoryApiClient;
  readonly recommendations: RecommendationsApiClient;
  readonly archiveImport: ArchiveImportApiClient;
  readonly urlCrawl: UrlCrawlApiClient;
  readonly description: DescriptionApiClient;
  readonly jobs: JobsApiClient;

  constructor() {
    const http = new BaseHttpClient();

    this.images = new FetchImageApiClient(http);
    this.imageAttributes = new FetchImageAttributeApiClient(http);
    this.collections = new FetchCollectionApiClient(http);
    this.labels = new FetchLabelApiClient(http);
    this.search = new FetchSearchApiClient(http);
    this.stats = new FetchStatsApiClient(http);
    this.viewHistory = new FetchViewHistoryApiClient(http);
    this.recommendations = new FetchRecommendationsApiClient(http);
    this.archiveImport = new FetchArchiveImportApiClient(http);
    this.urlCrawl = new FetchUrlCrawlApiClient(http);
    this.description = new FetchDescriptionApiClient(http);
    this.jobs = new FetchJobsApiClient(http);
  }
}

/**
 * Creates a new FetchApiClient instance.
 */
export function createFetchApiClient(): ApiClient {
  return new FetchApiClient();
}
