/**
 * URL Crawl API Client Implementation
 */

import {
  urlCrawlEndpoints,
  type UrlCrawlImportResult,
  type UrlCrawlSession,
  type UrlCrawlSessionDetail,
} from '@/url-crawl.js';
import type { HttpClient } from '@/client/http-client.js';
import type { UrlCrawlApiClient } from '@/client/url-crawl-api-client.js';

export function createUrlCrawlApiClient(http: HttpClient): UrlCrawlApiClient {
  return {
    crawl: async (url: string) =>
      await http.post<UrlCrawlSession>(urlCrawlEndpoints.crawl, { url }),

    getSession: async (sessionId: string) =>
      await http.get<UrlCrawlSessionDetail>(
        urlCrawlEndpoints.session(sessionId),
      ),

    deleteSession: async (sessionId: string) => {
      await http.delete(urlCrawlEndpoints.session(sessionId));
    },

    getThumbnailUrl: (sessionId: string, imageIndex: number) =>
      urlCrawlEndpoints.imageThumbnail(sessionId, imageIndex),

    getImageUrl: (sessionId: string, imageIndex: number) =>
      urlCrawlEndpoints.imageFile(sessionId, imageIndex),

    importImages: async (sessionId: string, indices: number[]) =>
      await http.post<UrlCrawlImportResult>(
        urlCrawlEndpoints.import(sessionId),
        { indices },
      ),
  };
}
