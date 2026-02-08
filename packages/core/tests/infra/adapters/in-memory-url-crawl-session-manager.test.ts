import 'reflect-metadata';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { InMemoryUrlCrawlSessionManager } from '@/infra/adapters/in-memory-url-crawl-session-manager';

describe('InMemoryUrlCrawlSessionManager', () => {
  let manager: InMemoryUrlCrawlSessionManager;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.useFakeTimers();
    manager = new InMemoryUrlCrawlSessionManager();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    globalThis.fetch = originalFetch;
  });

  describe('createSession', () => {
    describe('URL validation', () => {
      it('should reject invalid URL format', async () => {
        const result = await manager.createSession({ url: 'not-a-url' });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe('INVALID_URL');
          expect(result.message).toBe('Invalid URL format');
        }
      });

      it('should reject non-http/https protocols', async () => {
        const result = await manager.createSession({ url: 'ftp://example.com/image.jpg' });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe('INVALID_URL');
          expect(result.message).toBe('URL must use http or https protocol');
        }
      });

      it('should reject private hostname (localhost)', async () => {
        const result = await manager.createSession({ url: 'http://localhost/image.jpg' });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe('INVALID_URL');
          expect(result.message).toBe('URL points to a private or internal address');
        }
      });

      it('should reject private IP address (192.168.x.x)', async () => {
        const result = await manager.createSession({ url: 'http://192.168.1.1/image.jpg' });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe('INVALID_URL');
        }
      });
    });

    describe('fetch errors', () => {
      it('should return FETCH_FAILED on HTTP error', async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status: 404,
        });

        const result = await manager.createSession({ url: 'https://example.com/page' });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe('FETCH_FAILED');
          expect(result.message).toContain('HTTP 404');
        }
      });

      it('should return TIMEOUT on abort', async () => {
        const abortError = new Error('Aborted');
        abortError.name = 'AbortError';
        globalThis.fetch = vi.fn().mockRejectedValue(abortError);

        const result = await manager.createSession({ url: 'https://example.com/page' });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe('TIMEOUT');
          expect(result.message).toBe('Request timed out');
        }
      });

      it('should return FETCH_FAILED on network error', async () => {
        globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

        const result = await manager.createSession({ url: 'https://example.com/page' });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe('FETCH_FAILED');
          expect(result.message).toBe('Failed to fetch URL due to a network error');
        }
      });
    });

    describe('direct image URL', () => {
      it('should create session with single image entry for direct image URL', async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: true,
          headers: new Map([['content-type', 'image/jpeg']]),
        });

        const result = await manager.createSession({ url: 'https://example.com/photo.jpg' });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.session.imageEntries).toHaveLength(1);
          expect(result.session.imageEntries[0]?.url).toBe('https://example.com/photo.jpg');
          expect(result.session.imageEntries[0]?.filename).toBe('photo.jpg');
        }
      });

      it('should normalize extension based on content-type', async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: true,
          headers: new Map([['content-type', 'image/webp']]),
        });

        const result = await manager.createSession({ url: 'https://example.com/photo.jpg' });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.session.imageEntries[0]?.filename).toBe('photo.webp');
        }
      });

      it('should append extension when filename has none', async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: true,
          headers: new Map([['content-type', 'image/png']]),
        });

        const result = await manager.createSession({ url: 'https://example.com/photo' });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.session.imageEntries[0]?.filename).toBe('photo.png');
        }
      });
    });

    describe('HTML page', () => {
      it('should extract images from HTML page', async () => {
        const html = `
          <!DOCTYPE html>
          <html>
            <head><title>Test Gallery</title></head>
            <body>
              <img src="https://example.com/image1.jpg" alt="Image 1">
              <img src="/image2.png" alt="Image 2">
            </body>
          </html>
        `;
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: true,
          headers: new Map([['content-type', 'text/html']]),
          text: async () => await Promise.resolve(html),
        });

        const result = await manager.createSession({ url: 'https://example.com/gallery' });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.session.pageTitle).toBe('Test Gallery');
          expect(result.session.imageEntries.length).toBeGreaterThan(0);
        }
      });

      it('should return NO_IMAGES_FOUND when page has no images', async () => {
        const html = `
          <!DOCTYPE html>
          <html>
            <head><title>Empty Page</title></head>
            <body><p>No images here</p></body>
          </html>
        `;
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: true,
          headers: new Map([['content-type', 'text/html']]),
          text: async () => await Promise.resolve(html),
        });

        const result = await manager.createSession({ url: 'https://example.com/empty' });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe('NO_IMAGES_FOUND');
        }
      });
    });
  });

  describe('getSession', () => {
    it('should return undefined for non-existent session', () => {
      const result = manager.getSession('non-existent-id');
      expect(result).toBeUndefined();
    });

    it('should return session after creation', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Map([['content-type', 'image/jpeg']]),
      });

      const createResult = await manager.createSession({ url: 'https://example.com/photo.jpg' });
      expect(createResult.success).toBe(true);
      if (!createResult.success) return;

      const session = manager.getSession(createResult.session.id);
      expect(session).toBeDefined();
      expect(session?.id).toBe(createResult.session.id);
    });

    it('should return undefined for expired session', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Map([['content-type', 'image/jpeg']]),
      });

      const createResult = await manager.createSession({ url: 'https://example.com/photo.jpg' });
      expect(createResult.success).toBe(true);
      if (!createResult.success) return;

      // Advance time past expiration (1 hour + 1ms)
      vi.advanceTimersByTime(60 * 60 * 1000 + 1);

      const session = manager.getSession(createResult.session.id);
      expect(session).toBeUndefined();
    });
  });

  describe('fetchImage', () => {
    it('should throw error for non-existent session', async () => {
      await expect(manager.fetchImage('non-existent', 0)).rejects.toThrow(
        'Session non-existent not found',
      );
    });

    it('should throw error for non-existent image index', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Map([['content-type', 'image/jpeg']]),
      });

      const createResult = await manager.createSession({ url: 'https://example.com/photo.jpg' });
      expect(createResult.success).toBe(true);
      if (!createResult.success) return;

      await expect(manager.fetchImage(createResult.session.id, 999)).rejects.toThrow(
        'Image 999 not found in session',
      );
    });

    it('should fetch and return image data', async () => {
      // First call for createSession
      const createFetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Map([['content-type', 'image/jpeg']]),
      });
      globalThis.fetch = createFetch;

      const createResult = await manager.createSession({ url: 'https://example.com/photo.jpg' });
      expect(createResult.success).toBe(true);
      if (!createResult.success) return;

      // Second call for fetchImage
      const imageBuffer = new ArrayBuffer(100);
      const fetchFetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Map([['content-type', 'image/jpeg']]),
        arrayBuffer: async () => await Promise.resolve(imageBuffer),
      });
      globalThis.fetch = fetchFetch;

      const result = await manager.fetchImage(createResult.session.id, 0);

      expect(result.data).toBeInstanceOf(Buffer);
      expect(result.contentType).toBe('image/jpeg');
    });

    it('should throw error on HTTP error', async () => {
      const createFetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Map([['content-type', 'image/jpeg']]),
      });
      globalThis.fetch = createFetch;

      const createResult = await manager.createSession({ url: 'https://example.com/photo.jpg' });
      expect(createResult.success).toBe(true);
      if (!createResult.success) return;

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(manager.fetchImage(createResult.session.id, 0)).rejects.toThrow(
        'Failed to fetch image: HTTP 404',
      );
    });

    it('should throw error when content-type is not image', async () => {
      const createFetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Map([['content-type', 'image/jpeg']]),
      });
      globalThis.fetch = createFetch;

      const createResult = await manager.createSession({ url: 'https://example.com/photo.jpg' });
      expect(createResult.success).toBe(true);
      if (!createResult.success) return;

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Map([['content-type', 'text/html']]),
      });

      await expect(manager.fetchImage(createResult.session.id, 0)).rejects.toThrow(
        'Fetched resource is not an image',
      );
    });

    it('should throw error on timeout', async () => {
      const createFetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Map([['content-type', 'image/jpeg']]),
      });
      globalThis.fetch = createFetch;

      const createResult = await manager.createSession({ url: 'https://example.com/photo.jpg' });
      expect(createResult.success).toBe(true);
      if (!createResult.success) return;

      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      globalThis.fetch = vi.fn().mockRejectedValue(abortError);

      await expect(manager.fetchImage(createResult.session.id, 0)).rejects.toThrow(
        'Image fetch timed out',
      );
    });
  });

  describe('deleteSession', () => {
    it('should delete an existing session', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Map([['content-type', 'image/jpeg']]),
      });

      const createResult = await manager.createSession({ url: 'https://example.com/photo.jpg' });
      expect(createResult.success).toBe(true);
      if (!createResult.success) return;

      await manager.deleteSession(createResult.session.id);

      const session = manager.getSession(createResult.session.id);
      expect(session).toBeUndefined();
    });

    it('should not throw when deleting non-existent session', async () => {
      await expect(manager.deleteSession('non-existent')).resolves.toBeUndefined();
    });
  });

  describe('session cleanup', () => {
    it('should clean up expired sessions periodically', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Map([['content-type', 'image/jpeg']]),
      });

      const createResult = await manager.createSession({ url: 'https://example.com/photo.jpg' });
      expect(createResult.success).toBe(true);
      if (!createResult.success) return;

      // Advance time past session expiration but trigger cleanup interval
      vi.advanceTimersByTime(60 * 60 * 1000 + 5 * 60 * 1000);

      const session = manager.getSession(createResult.session.id);
      expect(session).toBeUndefined();
    });
  });
});
