import type { CrawledImageEntry } from './CrawledImageEntry.js';

/**
 * UrlCrawlSession value object - represents an active URL crawl session
 */
export interface UrlCrawlSession {
  /** Unique session ID */
  id: string;
  /** Original URL that was crawled */
  sourceUrl: string;
  /** Page title if available */
  pageTitle?: string;
  /** List of image entries found on the page */
  imageEntries: CrawledImageEntry[];
  /** Creation timestamp */
  createdAt: Date;
}
