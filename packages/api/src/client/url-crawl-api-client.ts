/**
 * URL Crawl API Client Interface
 */

import type {
  UrlCrawlImportResult,
  UrlCrawlSession,
  UrlCrawlSessionDetail,
} from '../url-crawl.js';

export interface UrlCrawlApiClient {
  /** URL クロール開始 */
  crawl: (url: string) => Promise<UrlCrawlSession>;

  /** セッション詳細取得 */
  getSession: (sessionId: string) => Promise<UrlCrawlSessionDetail>;

  /** セッション削除 */
  deleteSession: (sessionId: string) => Promise<void>;

  /** 画像サムネイル URL 取得 */
  getThumbnailUrl: (sessionId: string, imageIndex: number) => string;

  /** 画像ファイル URL 取得 */
  getImageUrl: (sessionId: string, imageIndex: number) => string;

  /** インポート実行 */
  importImages: (sessionId: string, indices: number[]) => Promise<UrlCrawlImportResult>;
}
