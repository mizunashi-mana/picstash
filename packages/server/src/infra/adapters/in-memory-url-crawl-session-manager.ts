/* eslint-disable n/no-unsupported-features/node-builtins -- fetch is available in Node.js 18+ */
import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { injectable } from 'inversify';
import {
  extractImageUrls,
  extractPageTitle,
  filterImageEntries,
  FETCH_TIMEOUT_MS,
  USER_AGENT,
} from '@/domain/url-crawl/index.js';
import type {
  CreateCrawlSessionInput,
  CreateCrawlSessionResult,
  FetchImageResult,
  UrlCrawlSessionManager,
} from '@/application/ports/url-crawl-session-manager.js';
import type { UrlCrawlSession } from '@/domain/url-crawl/index.js';

@injectable()
export class InMemoryUrlCrawlSessionManager implements UrlCrawlSessionManager {
  private readonly sessions = new Map<string, UrlCrawlSession>();

  async createSession(input: CreateCrawlSessionInput): Promise<CreateCrawlSessionResult> {
    const { url } = input;

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        return {
          success: false,
          error: 'INVALID_URL',
          message: 'URL must use http or https protocol',
        };
      }
    }
    catch {
      return {
        success: false,
        error: 'INVALID_URL',
        message: 'Invalid URL format',
      };
    }

    // Fetch the page
    let html: string;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => {
        controller.abort();
      }, FETCH_TIMEOUT_MS);

      const response = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        return {
          success: false,
          error: 'FETCH_FAILED',
          message: `Failed to fetch URL: HTTP ${response.status}`,
        };
      }

      html = await response.text();
    }
    catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: 'TIMEOUT',
          message: 'Request timed out',
        };
      }
      return {
        success: false,
        error: 'FETCH_FAILED',
        message: `Failed to fetch URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }

    // Extract image URLs from HTML
    const rawEntries = extractImageUrls(html, url);
    const imageEntries = filterImageEntries(rawEntries);

    if (imageEntries.length === 0) {
      return {
        success: false,
        error: 'NO_IMAGES_FOUND',
        message: 'No images found on the page',
      };
    }

    // Extract page title
    const pageTitle = extractPageTitle(html);

    // Create session
    const sessionId = randomUUID();
    const session: UrlCrawlSession = {
      id: sessionId,
      sourceUrl: url,
      pageTitle,
      imageEntries,
      createdAt: new Date(),
    };

    this.sessions.set(sessionId, session);

    return { success: true, session };
  }

  getSession(sessionId: string): UrlCrawlSession | undefined {
    return this.sessions.get(sessionId);
  }

  async fetchImage(sessionId: string, imageIndex: number): Promise<FetchImageResult> {
    const session = this.sessions.get(sessionId);
    if (session === undefined) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const entry = session.imageEntries.find(e => e.index === imageIndex);
    if (entry === undefined) {
      throw new Error(`Image ${imageIndex} not found in session ${sessionId}`);
    }

    // Fetch the image
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(entry.url, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'image/*',
          'Referer': session.sourceUrl,
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Failed to fetch image: HTTP ${response.status}`);
      }

      const contentType = response.headers.get('content-type') ?? 'application/octet-stream';
      const arrayBuffer = await response.arrayBuffer();
      const data = Buffer.from(arrayBuffer);

      return { data, contentType };
    }
    catch (error) {
      clearTimeout(timeout);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Image fetch timed out');
      }
      throw error;
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }
}
