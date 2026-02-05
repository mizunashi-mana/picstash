/**
 * Unified API Client Interface
 *
 * 全リソースの API クライアントを統合するインターフェース
 */

import type { ArchiveImportApiClient } from './archive-import-api-client.js';
import type { CollectionApiClient } from './collection-api-client.js';
import type { DescriptionApiClient } from './description-api-client.js';
import type { ImageApiClient } from './image-api-client.js';
import type { ImageAttributeApiClient } from './image-attribute-api-client.js';
import type { JobsApiClient } from './jobs-api-client.js';
import type { LabelApiClient } from './label-api-client.js';
import type { RecommendationsApiClient } from './recommendations-api-client.js';
import type { SearchApiClient } from './search-api-client.js';
import type { StatsApiClient } from './stats-api-client.js';
import type { UrlCrawlApiClient } from './url-crawl-api-client.js';
import type { ViewHistoryApiClient } from './view-history-api-client.js';

export interface ApiClient {
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
}
