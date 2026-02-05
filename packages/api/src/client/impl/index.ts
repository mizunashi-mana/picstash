/**
 * API Client Implementations
 *
 * HttpClient を受け取り、各リソースの API Client を生成する関数群
 */

export { createImageApiClient } from '@/client/impl/image-api-client-impl.js';
export { createCollectionApiClient } from '@/client/impl/collection-api-client-impl.js';
export { createLabelApiClient } from '@/client/impl/label-api-client-impl.js';
export { createSearchApiClient } from '@/client/impl/search-api-client-impl.js';
export { createStatsApiClient } from '@/client/impl/stats-api-client-impl.js';
export { createViewHistoryApiClient } from '@/client/impl/view-history-api-client-impl.js';
export { createRecommendationsApiClient } from '@/client/impl/recommendations-api-client-impl.js';
export { createArchiveImportApiClient } from '@/client/impl/archive-import-api-client-impl.js';
export { createUrlCrawlApiClient } from '@/client/impl/url-crawl-api-client-impl.js';
export { createDescriptionApiClient } from '@/client/impl/description-api-client-impl.js';
export { createJobsApiClient } from '@/client/impl/jobs-api-client-impl.js';
export { createImageAttributeApiClient } from '@/client/impl/image-attribute-api-client-impl.js';
