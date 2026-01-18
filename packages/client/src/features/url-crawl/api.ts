export interface UrlCrawlSession {
  sessionId: string;
  sourceUrl: string;
  pageTitle?: string;
  imageCount: number;
}

export interface CrawledImage {
  index: number;
  url: string;
  filename: string;
  alt?: string;
}

export interface UrlCrawlSessionDetail extends UrlCrawlSession {
  images: CrawledImage[];
}

interface ErrorResponse {
  message?: string;
}

export async function crawlUrl(url: string): Promise<UrlCrawlSession> {
  const response = await fetch('/api/url-crawl', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- API error response
    const error = (await response.json()) as ErrorResponse;
    throw new Error(error.message ?? 'Crawl failed');
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- API response
  return (await response.json()) as UrlCrawlSession;
}

export async function getCrawlSession(sessionId: string): Promise<UrlCrawlSessionDetail> {
  const response = await fetch(`/api/url-crawl/${sessionId}`);

  if (!response.ok) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- API error response
    const error = (await response.json()) as ErrorResponse;
    throw new Error(error.message ?? 'Failed to get crawl session');
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- API response
  return (await response.json()) as UrlCrawlSessionDetail;
}

export async function deleteCrawlSession(sessionId: string): Promise<void> {
  const response = await fetch(`/api/url-crawl/${sessionId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    // Only try to parse JSON if there's content
    const text = await response.text();
    if (text !== '') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- API error response
      const error = JSON.parse(text) as ErrorResponse;
      throw new Error(error.message ?? 'Failed to delete crawl session');
    }
    throw new Error('Failed to delete crawl session');
  }
}

export function getCrawlThumbnailUrl(sessionId: string, imageIndex: number): string {
  return `/api/url-crawl/${sessionId}/images/${imageIndex}/thumbnail`;
}

export function getCrawlImageUrl(sessionId: string, imageIndex: number): string {
  return `/api/url-crawl/${sessionId}/images/${imageIndex}/file`;
}

export interface ImportResultItem {
  index: number;
  success: boolean;
  imageId?: string;
  error?: string;
}

export interface ImportResult {
  totalRequested: number;
  successCount: number;
  failedCount: number;
  results: ImportResultItem[];
}

export async function importFromCrawl(sessionId: string, indices: number[]): Promise<ImportResult> {
  const response = await fetch(`/api/url-crawl/${sessionId}/import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ indices }),
  });

  if (!response.ok) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- API error response
    const error = (await response.json()) as ErrorResponse;
    throw new Error(error.message ?? 'Failed to import images');
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- API response
  return (await response.json()) as ImportResult;
}
