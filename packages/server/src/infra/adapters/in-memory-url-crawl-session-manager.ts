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

/** Session expiration time in milliseconds (1 hour) */
const SESSION_EXPIRATION_MS = 60 * 60 * 1000;

/** Cleanup interval in milliseconds (5 minutes) */
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Check if a hostname is a private/internal address (SSRF protection)
 */
function isPrivateHostname(hostname: string): boolean {
  // localhost
  if (hostname === 'localhost' || hostname === 'localhost.localdomain') {
    return true;
  }

  // IPv4 loopback (127.x.x.x)
  if (hostname.startsWith('127.')) {
    return true;
  }

  // IPv6 loopback
  if (hostname === '::1' || hostname === '[::1]') {
    return true;
  }

  // Private IPv4 ranges
  const ipv4Match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(hostname);
  if (ipv4Match !== null) {
    const [, a, b] = ipv4Match.map(Number);
    if (a === undefined || b === undefined) {
      return false;
    }
    // 10.0.0.0/8
    if (a === 10) {
      return true;
    }
    // 172.16.0.0/12
    if (a === 172 && b >= 16 && b <= 31) {
      return true;
    }
    // 192.168.0.0/16
    if (a === 192 && b === 168) {
      return true;
    }
    // 169.254.0.0/16 (link-local)
    if (a === 169 && b === 254) {
      return true;
    }
  }

  return false;
}

@injectable()
export class InMemoryUrlCrawlSessionManager implements UrlCrawlSessionManager {
  private readonly sessions = new Map<string, UrlCrawlSession>();
  private readonly cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Start periodic cleanup
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredSessions();
    }, CLEANUP_INTERVAL_MS);
  }

  /**
   * Remove expired sessions
   */
  private cleanupExpiredSessions(): void {
    const now = Date.now();
    for (const [sessionId, session] of this.sessions) {
      if (now - session.createdAt.getTime() > SESSION_EXPIRATION_MS) {
        this.sessions.delete(sessionId);
      }
    }
  }

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

    // SSRF protection: block private/internal addresses
    if (isPrivateHostname(parsedUrl.hostname)) {
      return {
        success: false,
        error: 'INVALID_URL',
        message: 'URL points to a private or internal address',
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
        message: 'Failed to fetch URL due to a network error',
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
    const session = this.sessions.get(sessionId);
    if (session === undefined) {
      return undefined;
    }

    // Check if session has expired
    if (Date.now() - session.createdAt.getTime() > SESSION_EXPIRATION_MS) {
      this.sessions.delete(sessionId);
      return undefined;
    }

    return session;
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

      const rawContentType = response.headers.get('content-type');
      const contentType = rawContentType?.toLowerCase() ?? '';

      // Validate content-type is an image
      if (!contentType.startsWith('image/')) {
        throw new Error(
          `Fetched resource is not an image (content-type: ${rawContentType ?? 'unknown'})`,
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      const data = Buffer.from(arrayBuffer);

      return { data, contentType: rawContentType ?? 'application/octet-stream' };
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
