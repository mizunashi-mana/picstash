import type { UrlCrawlSession } from '@/domain/url-crawl/index.js';

// Re-export domain type for convenience
export type { UrlCrawlSession };

export interface CreateCrawlSessionInput {
  /** URL to crawl */
  url: string;
}

export type CreateCrawlSessionResult
  = | { success: true; session: UrlCrawlSession }
    | {
      success: false;
      error: 'INVALID_URL' | 'FETCH_FAILED' | 'NO_IMAGES_FOUND' | 'TIMEOUT';
      message: string;
    };

export interface FetchImageResult {
  /** Image data */
  data: Buffer;
  /** Content type from response */
  contentType: string;
}

export interface UrlCrawlSessionManager {
  /** Create a new session by crawling a URL */
  createSession: (input: CreateCrawlSessionInput) => Promise<CreateCrawlSessionResult>;

  /** Get a session by ID */
  getSession: (sessionId: string) => UrlCrawlSession | undefined;

  /** Fetch an image from a crawl session (proxied) */
  fetchImage: (sessionId: string, imageIndex: number) => Promise<FetchImageResult>;

  /** Delete a session */
  deleteSession: (sessionId: string) => Promise<void>;
}
