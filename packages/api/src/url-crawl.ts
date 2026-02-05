/**
 * URL Crawl API - エンドポイント定義と型
 *
 * client と server で共有する URL クロール関連の API 定義
 */

// ============================================================
// レスポンス型
// ============================================================

/** URL クロールセッション */
export interface UrlCrawlSession {
  sessionId: string;
  sourceUrl: string;
  pageTitle?: string;
  imageCount: number;
}

/** クロール画像 */
export interface CrawledImage {
  index: number;
  url: string;
  filename: string;
  alt?: string;
}

/** URL クロールセッション詳細 */
export interface UrlCrawlSessionDetail extends UrlCrawlSession {
  images: CrawledImage[];
}

/** URL クロールインポート結果項目 */
export interface UrlCrawlImportResultItem {
  index: number;
  success: boolean;
  imageId?: string;
  error?: string;
}

/** URL クロールインポート結果 */
export interface UrlCrawlImportResult {
  totalRequested: number;
  successCount: number;
  failedCount: number;
  results: UrlCrawlImportResultItem[];
}

// ============================================================
// エンドポイント定義
// ============================================================

/**
 * URL クロールエンドポイント定義
 */
export const urlCrawlEndpoints = {
  /** クロール開始 (POST) */
  crawl: '/api/url-crawl' as const,

  /** セッション詳細取得 (GET) / セッション削除 (DELETE) */
  session: (sessionId: string) => `/api/url-crawl/${sessionId}` as const,

  /** 画像サムネイル取得 */
  imageThumbnail: (sessionId: string, imageIndex: number) =>
    `/api/url-crawl/${sessionId}/images/${imageIndex}/thumbnail` as const,

  /** 画像ファイル取得 */
  imageFile: (sessionId: string, imageIndex: number) =>
    `/api/url-crawl/${sessionId}/images/${imageIndex}/file` as const,

  /** インポート実行 (POST) */
  import: (sessionId: string) =>
    `/api/url-crawl/${sessionId}/import` as const,

  /**
   * server 側のルート登録用パターン
   */
  routes: {
    crawl: '/api/url-crawl',
    session: '/api/url-crawl/:sessionId',
    imageThumbnail: '/api/url-crawl/:sessionId/images/:imageIndex/thumbnail',
    imageFile: '/api/url-crawl/:sessionId/images/:imageIndex/file',
    import: '/api/url-crawl/:sessionId/import',
  },
} as const;
