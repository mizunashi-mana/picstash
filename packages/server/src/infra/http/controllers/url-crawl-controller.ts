import { inject, injectable } from 'inversify';
import { importFromUrlCrawl } from '@/application/url-crawl/index.js';
import { TYPES } from '@/infra/di/types.js';
import type { FileStorage } from '@/application/ports/file-storage.js';
import type { ImageProcessor } from '@/application/ports/image-processor.js';
import type { ImageRepository } from '@/application/ports/image-repository.js';
import type { UrlCrawlSessionManager } from '@/application/ports/url-crawl-session-manager.js';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

/** Rate limit window in milliseconds (1 minute) */
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

/** Maximum requests per window for crawl creation */
const CRAWL_RATE_LIMIT = 10;

/** Maximum requests per window for import */
const IMPORT_RATE_LIMIT = 20;

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

/**
 * Simple in-memory rate limiter
 */
class RateLimiter {
  private readonly limits = new Map<string, RateLimitEntry>();

  /**
   * Check if request should be rate limited
   * @returns true if the request is allowed, false if rate limited
   */
  check(key: string, maxRequests: number): boolean {
    const now = Date.now();
    const entry = this.limits.get(key);

    if (entry === undefined || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
      // New window
      this.limits.set(key, { count: 1, windowStart: now });
      return true;
    }

    if (entry.count >= maxRequests) {
      return false;
    }

    entry.count++;
    return true;
  }

  /**
   * Get remaining requests for a key
   */
  getRemaining(key: string, maxRequests: number): number {
    const now = Date.now();
    const entry = this.limits.get(key);

    if (entry === undefined || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
      return maxRequests;
    }

    return Math.max(0, maxRequests - entry.count);
  }
}

@injectable()
export class UrlCrawlController {
  private readonly rateLimiter = new RateLimiter();

  constructor(
    @inject(TYPES.UrlCrawlSessionManager)
    private readonly sessionManager: UrlCrawlSessionManager,
    @inject(TYPES.ImageProcessor) private readonly imageProcessor: ImageProcessor,
    @inject(TYPES.ImageRepository) private readonly imageRepository: ImageRepository,
    @inject(TYPES.FileStorage) private readonly fileStorage: FileStorage,
  ) {}

  /**
   * Get rate limit key from request (IP-based)
   */
  private getRateLimitKey(request: FastifyRequest, endpoint: string): string {
    return `${endpoint}:${request.ip}`;
  }

  /**
   * Check rate limit and send 429 if exceeded
   */
  private checkRateLimit(
    request: FastifyRequest,
    reply: FastifyReply,
    endpoint: string,
    maxRequests: number,
  ): boolean {
    const key = this.getRateLimitKey(request, endpoint);
    if (!this.rateLimiter.check(key, maxRequests)) {
      const remaining = this.rateLimiter.getRemaining(key, maxRequests);
      void reply
        .status(429)
        .header('X-RateLimit-Limit', maxRequests.toString())
        .header('X-RateLimit-Remaining', remaining.toString())
        .send({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
        });
      return false;
    }
    return true;
  }

  registerRoutes(app: FastifyInstance): void {
    // Create crawl session from URL
    app.post<{ Body: { url: string } }>('/api/url-crawl', async (request, reply) => {
      // Rate limiting for crawl creation
      if (!this.checkRateLimit(request, reply, 'crawl', CRAWL_RATE_LIMIT)) {
        return;
      }

      const { url } = request.body;

      if (typeof url !== 'string' || url.trim() === '') {
        return await reply.status(400).send({
          error: 'Bad Request',
          message: 'URL is required',
        });
      }

      const result = await this.sessionManager.createSession({ url: url.trim() });

      if (!result.success) {
        let statusCode: number;
        let errorType: string;
        switch (result.error) {
          case 'INVALID_URL':
            statusCode = 400;
            errorType = 'Bad Request';
            break;
          case 'FETCH_FAILED':
            statusCode = 502;
            errorType = 'Bad Gateway';
            break;
          case 'NO_IMAGES_FOUND':
            statusCode = 404;
            errorType = 'Not Found';
            break;
          case 'TIMEOUT':
            statusCode = 504;
            errorType = 'Gateway Timeout';
            break;
        }
        return await reply.status(statusCode).send({
          error: errorType,
          message: result.message,
        });
      }

      return await reply.status(201).send({
        sessionId: result.session.id,
        sourceUrl: result.session.sourceUrl,
        pageTitle: result.session.pageTitle,
        imageCount: result.session.imageEntries.length,
      });
    });

    // Get session info and image entries
    app.get<{ Params: { sessionId: string } }>(
      '/api/url-crawl/:sessionId',
      async (request, reply) => {
        const { sessionId } = request.params;
        const session = this.sessionManager.getSession(sessionId);

        if (session === undefined) {
          return await reply.status(404).send({
            error: 'Not Found',
            message: 'Crawl session not found',
          });
        }

        return await reply.send({
          sessionId: session.id,
          sourceUrl: session.sourceUrl,
          pageTitle: session.pageTitle,
          imageCount: session.imageEntries.length,
          images: session.imageEntries.map(entry => ({
            index: entry.index,
            url: entry.url,
            filename: entry.filename,
            alt: entry.alt,
          })),
        });
      },
    );

    // Get thumbnail for an image (proxied)
    app.get<{ Params: { sessionId: string; imageIndex: string } }>(
      '/api/url-crawl/:sessionId/images/:imageIndex/thumbnail',
      async (request, reply) => {
        const { sessionId, imageIndex } = request.params;
        const index = parseInt(imageIndex, 10);

        if (Number.isNaN(index)) {
          return await reply.status(400).send({
            error: 'Bad Request',
            message: 'Invalid image index',
          });
        }

        const session = this.sessionManager.getSession(sessionId);
        if (session === undefined) {
          return await reply.status(404).send({
            error: 'Not Found',
            message: 'Crawl session not found',
          });
        }

        const entry = session.imageEntries.find(e => e.index === index);
        if (entry === undefined) {
          return await reply.status(404).send({
            error: 'Not Found',
            message: 'Image not found in session',
          });
        }

        try {
          const { data: imageBuffer } = await this.sessionManager.fetchImage(sessionId, index);

          const thumbnail = await this.imageProcessor.generateThumbnailFromBuffer(imageBuffer);

          return await reply
            .header('Content-Type', 'image/jpeg')
            .header('Cache-Control', 'private, max-age=3600')
            .send(thumbnail);
        }
        catch (error) {
          request.log.error(error, 'Failed to fetch thumbnail');
          return await reply.status(502).send({
            error: 'Bad Gateway',
            message: 'Failed to fetch image from source',
          });
        }
      },
    );

    // Get full-size image (proxied)
    app.get<{ Params: { sessionId: string; imageIndex: string } }>(
      '/api/url-crawl/:sessionId/images/:imageIndex/file',
      async (request, reply) => {
        const { sessionId, imageIndex } = request.params;
        const index = parseInt(imageIndex, 10);

        if (Number.isNaN(index)) {
          return await reply.status(400).send({
            error: 'Bad Request',
            message: 'Invalid image index',
          });
        }

        const session = this.sessionManager.getSession(sessionId);
        if (session === undefined) {
          return await reply.status(404).send({
            error: 'Not Found',
            message: 'Crawl session not found',
          });
        }

        const entry = session.imageEntries.find(e => e.index === index);
        if (entry === undefined) {
          return await reply.status(404).send({
            error: 'Not Found',
            message: 'Image not found in session',
          });
        }

        try {
          const { data: imageBuffer, contentType } = await this.sessionManager.fetchImage(
            sessionId,
            index,
          );

          return await reply
            .header('Content-Type', contentType)
            .header('Cache-Control', 'private, max-age=3600')
            .send(imageBuffer);
        }
        catch (error) {
          request.log.error(error, 'Failed to fetch image');
          return await reply.status(502).send({
            error: 'Bad Gateway',
            message: 'Failed to fetch image from source',
          });
        }
      },
    );

    // Import selected images from crawl session to library
    app.post<{
      Params: { sessionId: string };
      Body: { indices: number[] };
    }>('/api/url-crawl/:sessionId/import', async (request, reply) => {
      // Rate limiting for import
      if (!this.checkRateLimit(request, reply, 'import', IMPORT_RATE_LIMIT)) {
        return;
      }

      const { sessionId } = request.params;
      const { indices } = request.body;

      if (!Array.isArray(indices) || indices.length === 0) {
        return await reply.status(400).send({
          error: 'Bad Request',
          message: 'indices must be a non-empty array of numbers',
        });
      }

      // Validate all indices are non-negative integers
      if (!indices.every(i => typeof i === 'number' && Number.isInteger(i) && i >= 0)) {
        return await reply.status(400).send({
          error: 'Bad Request',
          message: 'All indices must be non-negative integers',
        });
      }

      const session = this.sessionManager.getSession(sessionId);
      if (session === undefined) {
        return await reply.status(404).send({
          error: 'Not Found',
          message: 'Crawl session not found',
        });
      }

      try {
        const result = await importFromUrlCrawl(
          { sessionId, indices },
          {
            urlCrawlSessionManager: this.sessionManager,
            imageRepository: this.imageRepository,
            fileStorage: this.fileStorage,
            imageProcessor: this.imageProcessor,
          },
        );

        return await reply.send({
          totalRequested: result.totalRequested,
          successCount: result.successCount,
          failedCount: result.failedCount,
          results: result.results.map(r => ({
            index: r.index,
            success: r.success,
            imageId: r.image?.id,
            error: r.error,
          })),
        });
      }
      catch (error) {
        request.log.error(error, 'Failed to import images from URL crawl');
        return await reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to import images',
        });
      }
    });

    // Delete session
    app.delete<{ Params: { sessionId: string } }>(
      '/api/url-crawl/:sessionId',
      async (request, reply) => {
        const { sessionId } = request.params;

        await this.sessionManager.deleteSession(sessionId);

        return await reply.status(204).send();
      },
    );
  }
}
