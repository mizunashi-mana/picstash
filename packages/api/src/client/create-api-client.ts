/**
 * Create API Client
 *
 * HttpClient を受け取り、全リソースの API Client を統合した ApiClient を生成する
 */

import {
  createArchiveImportApiClient,
  createCollectionApiClient,
  createDescriptionApiClient,
  createImageApiClient,
  createImageAttributeApiClient,
  createJobsApiClient,
  createLabelApiClient,
  createRecommendationsApiClient,
  createSearchApiClient,
  createStatsApiClient,
  createUrlCrawlApiClient,
  createViewHistoryApiClient,
} from '@/client/impl/index.js';
import type { ApiClient } from '@/client/api-client.js';
import type { HttpClient } from '@/client/http-client.js';

/**
 * ApiClient を生成する
 *
 * @param http HttpClient 実装
 * @returns 全リソースの API Client を含む ApiClient
 *
 * @example
 * ```typescript
 * const httpClient = new FetchHttpClient();
 * const apiClient = createApiClient(httpClient);
 *
 * // 画像一覧を取得
 * const images = await apiClient.images.list();
 *
 * // コレクションを作成
 * const collection = await apiClient.collections.create({ name: 'My Collection' });
 * ```
 */
export function createApiClient(http: HttpClient): ApiClient {
  return {
    images: createImageApiClient(http),
    imageAttributes: createImageAttributeApiClient(http),
    collections: createCollectionApiClient(http),
    labels: createLabelApiClient(http),
    search: createSearchApiClient(http),
    stats: createStatsApiClient(http),
    viewHistory: createViewHistoryApiClient(http),
    recommendations: createRecommendationsApiClient(http),
    archiveImport: createArchiveImportApiClient(http),
    urlCrawl: createUrlCrawlApiClient(http),
    description: createDescriptionApiClient(http),
    jobs: createJobsApiClient(http),
  };
}
