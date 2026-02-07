// This file is deprecated. Use ApiClient from @/shared instead.
// Types should be imported from @picstash/api.
//
// Migration guide:
//   Before:
//     import { crawlUrl, getCrawlSession } from '@/features/url-crawl/api';
//     const session = await crawlUrl('https://example.com');
//
//   After:
//     import { useApiClient } from '@/shared';
//     import type { UrlCrawlSession } from '@picstash/api';
//     const apiClient = useApiClient();
//     const session = await apiClient.urlCrawl.crawl('https://example.com');

export {};
