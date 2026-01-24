import { describe, expect, it } from 'vitest';
import {
  extractImageUrls,
  extractPageTitle,
  filterImageEntries,
} from '@/domain/url-crawl/HtmlImageExtractor.js';
import type { CrawledImageEntry } from '@/domain/url-crawl/CrawledImageEntry.js';

describe('HtmlImageExtractor', () => {
  describe('extractImageUrls', () => {
    const baseUrl = 'https://example.com/page/';

    describe('img tags', () => {
      it('should extract image URL from basic img tag', () => {
        const html = '<img src="image.jpg">';
        const result = extractImageUrls(html, baseUrl);
        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
          index: 0,
          url: 'https://example.com/page/image.jpg',
          filename: 'image.jpg',
        });
      });

      it('should extract alt text from img tag', () => {
        const html = '<img src="image.jpg" alt="A beautiful sunset">';
        const result = extractImageUrls(html, baseUrl);
        expect(result).toHaveLength(1);
        expect(result[0]?.alt).toBe('A beautiful sunset');
      });

      it('should handle img tag with alt before src', () => {
        const html = '<img alt="Description" src="photo.png">';
        const result = extractImageUrls(html, baseUrl);
        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
          url: 'https://example.com/page/photo.png',
          alt: 'Description',
        });
      });

      it('should handle absolute URLs', () => {
        const html = '<img src="https://cdn.example.com/images/logo.png">';
        const result = extractImageUrls(html, baseUrl);
        expect(result).toHaveLength(1);
        expect(result[0]?.url).toBe('https://cdn.example.com/images/logo.png');
      });

      it('should handle root-relative URLs', () => {
        const html = '<img src="/assets/image.jpg">';
        const result = extractImageUrls(html, baseUrl);
        expect(result).toHaveLength(1);
        expect(result[0]?.url).toBe('https://example.com/assets/image.jpg');
      });

      it('should skip img tags without src', () => {
        const html = '<img alt="No source">';
        const result = extractImageUrls(html, baseUrl);
        expect(result).toHaveLength(0);
      });

      it('should skip empty alt text', () => {
        const html = '<img src="image.jpg" alt="">';
        const result = extractImageUrls(html, baseUrl);
        expect(result).toHaveLength(1);
        expect(result[0]?.alt).toBeUndefined();
      });

      it('should deduplicate identical URLs', () => {
        const html = `
          <img src="same.jpg">
          <img src="same.jpg">
          <img src="different.jpg">
        `;
        const result = extractImageUrls(html, baseUrl);
        expect(result).toHaveLength(2);
      });
    });

    describe('link tags', () => {
      it('should extract image URLs from anchor tags', () => {
        const html = '<a href="photo.jpg">View photo</a>';
        const result = extractImageUrls(html, baseUrl);
        expect(result).toHaveLength(1);
        expect(result[0]?.url).toBe('https://example.com/page/photo.jpg');
      });

      it('should only extract links with image extensions', () => {
        const html = `
          <a href="image.png">Image</a>
          <a href="document.pdf">PDF</a>
          <a href="page.html">Page</a>
        `;
        const result = extractImageUrls(html, baseUrl);
        expect(result).toHaveLength(1);
        expect(result[0]?.filename).toBe('image.png');
      });
    });

    describe('background images', () => {
      it('should extract background-image URLs', () => {
        const html = '<div style="background-image: url(\'bg.jpg\')"></div>';
        const result = extractImageUrls(html, baseUrl);
        expect(result).toHaveLength(1);
        expect(result[0]?.filename).toBe('bg.jpg');
      });

      it('should extract background URLs with double quotes', () => {
        const html = '<div style="background: url(\'pattern.png\')"></div>';
        const result = extractImageUrls(html, baseUrl);
        expect(result).toHaveLength(1);
        expect(result[0]?.filename).toBe('pattern.png');
      });

      it('should extract background URLs without quotes', () => {
        const html = '<div style="background-image: url(texture.gif)"></div>';
        const result = extractImageUrls(html, baseUrl);
        expect(result).toHaveLength(1);
        expect(result[0]?.filename).toBe('texture.gif');
      });
    });

    describe('srcset', () => {
      const getFilename = (e: { filename: string }): string => e.filename;

      it('should extract URLs from srcset attribute', () => {
        const html = '<img srcset="small.jpg 1x, large.jpg 2x">';
        const result = extractImageUrls(html, baseUrl);
        expect(result).toHaveLength(2);
        const filenames = result.map(getFilename);
        expect(filenames).toContain('small.jpg');
        expect(filenames).toContain('large.jpg');
      });

      it('should extract URLs from srcset with width descriptors', () => {
        const html = '<img srcset="mobile.jpg 480w, desktop.jpg 1200w">';
        const result = extractImageUrls(html, baseUrl);
        expect(result).toHaveLength(2);
      });
    });

    describe('data-src (lazy loading)', () => {
      it('should extract data-src URLs', () => {
        const html = '<img data-src="lazy.jpg">';
        const result = extractImageUrls(html, baseUrl);
        expect(result).toHaveLength(1);
        expect(result[0]?.filename).toBe('lazy.jpg');
      });

      it('should extract data-original URLs', () => {
        const html = '<img data-original="original.png">';
        const result = extractImageUrls(html, baseUrl);
        expect(result).toHaveLength(1);
        expect(result[0]?.filename).toBe('original.png');
      });

      it('should extract data-lazy URLs', () => {
        const html = '<img data-lazy="lazy-loaded.webp">';
        const result = extractImageUrls(html, baseUrl);
        expect(result).toHaveLength(1);
        expect(result[0]?.filename).toBe('lazy-loaded.webp');
      });
    });

    describe('URL resolution', () => {
      it('should skip fragment-only URLs', () => {
        const html = '<img src="#anchor">';
        const result = extractImageUrls(html, baseUrl);
        expect(result).toHaveLength(0);
      });

      it('should skip non-http protocols', () => {
        const html = `
          <img src="data:image/png;base64,abc123">
          <img src="javascript:void(0)">
          <img src="file:///etc/passwd">
        `;
        const result = extractImageUrls(html, baseUrl);
        expect(result).toHaveLength(0);
      });

      it('should handle truly malformed URLs gracefully', () => {
        // Note: '://invalid-url' gets resolved to 'https://invalid-url' by URL API
        // Test with a URL that actually throws
        const html = '<img src="">';
        const result = extractImageUrls(html, baseUrl);
        expect(result).toHaveLength(0);
      });

      it('should handle URLs that throw during URL parsing', () => {
        // Use an invalid base URL to trigger the catch block in resolveUrl
        const invalidBaseUrl = 'not-a-valid-url';
        const html = '<img src="relative/image.jpg">';
        const result = extractImageUrls(html, invalidBaseUrl);
        expect(result).toHaveLength(0);
      });
    });

    describe('empty URLs in various sources', () => {
      it('should skip links with empty href', () => {
        const html = '<a href="">Link</a>';
        const result = extractImageUrls(html, baseUrl);
        expect(result).toHaveLength(0);
      });

      it('should skip background-image with empty url', () => {
        const html = '<div style="background-image: url(\'\')"></div>';
        const result = extractImageUrls(html, baseUrl);
        expect(result).toHaveLength(0);
      });
    });

    describe('limit', () => {
      it('should limit the number of images to MAX_IMAGES_PER_PAGE (500)', () => {
        const generateImgTag = (_: unknown, i: number): string => `<img src="image${i}.jpg">`;
        const images = Array.from({ length: 600 }, generateImgTag);
        const html = images.join('\n');
        const result = extractImageUrls(html, baseUrl);
        expect(result.length).toBeLessThanOrEqual(500);
        expect(result).toHaveLength(500);
      });
    });

    describe('combined extraction', () => {
      it('should extract images from multiple sources', () => {
        const html = `
          <html>
            <head><title>Gallery</title></head>
            <body>
              <img src="main.jpg" alt="Main image">
              <a href="full.png">Full size</a>
              <div style="background-image: url('bg.gif')"></div>
              <img srcset="thumb.jpg 1x, large.jpg 2x">
              <img data-src="lazy.webp">
            </body>
          </html>
        `;
        const result = extractImageUrls(html, baseUrl);
        // main.jpg, full.png, bg.gif, thumb.jpg, large.jpg, lazy.webp = 6
        expect(result.length).toBeGreaterThanOrEqual(6);
      });
    });
  });

  describe('extractPageTitle', () => {
    it('should extract page title', () => {
      const html = '<html><head><title>My Gallery</title></head></html>';
      const result = extractPageTitle(html);
      expect(result).toBe('My Gallery');
    });

    it('should trim whitespace from title', () => {
      const html = '<title>  Spaced Title  </title>';
      const result = extractPageTitle(html);
      expect(result).toBe('Spaced Title');
    });

    it('should return undefined for missing title', () => {
      const html = '<html><head></head></html>';
      const result = extractPageTitle(html);
      expect(result).toBeUndefined();
    });

    it('should handle title with attributes', () => {
      const html = '<title lang="en">English Title</title>';
      const result = extractPageTitle(html);
      expect(result).toBe('English Title');
    });
  });

  describe('filterImageEntries', () => {
    it('should filter entries to only supported image formats', () => {
      const entries: CrawledImageEntry[] = [
        { index: 0, url: 'https://example.com/image.jpg', filename: 'image.jpg' },
        { index: 1, url: 'https://example.com/photo.png', filename: 'photo.png' },
        { index: 2, url: 'https://example.com/video.mp4', filename: 'video.mp4' },
        { index: 3, url: 'https://example.com/doc.pdf', filename: 'doc.pdf' },
      ];
      const result = filterImageEntries(entries);
      expect(result).toHaveLength(2);
      expect(result.map(e => e.filename)).toEqual(['image.jpg', 'photo.png']);
    });

    it('should re-index entries after filtering', () => {
      const entries: CrawledImageEntry[] = [
        { index: 0, url: 'https://example.com/doc.pdf', filename: 'doc.pdf' },
        { index: 1, url: 'https://example.com/image.jpg', filename: 'image.jpg' },
        { index: 2, url: 'https://example.com/photo.png', filename: 'photo.png' },
      ];
      const result = filterImageEntries(entries);
      expect(result).toHaveLength(2);
      expect(result[0]?.index).toBe(0);
      expect(result[1]?.index).toBe(1);
    });

    it('should support various image extensions', () => {
      // Supported extensions from UrlCrawlConfig: .jpg, .jpeg, .png, .gif, .webp, .bmp
      const extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
      const entries: CrawledImageEntry[] = extensions.map((ext, i) => ({
        index: i,
        url: `https://example.com/image${ext}`,
        filename: `image${ext}`,
      }));
      const result = filterImageEntries(entries);
      expect(result).toHaveLength(extensions.length);
    });

    it('should handle URLs with query parameters', () => {
      const entries: CrawledImageEntry[] = [
        { index: 0, url: 'https://example.com/image.jpg?size=large', filename: 'image.jpg' },
      ];
      const result = filterImageEntries(entries);
      expect(result).toHaveLength(1);
    });

    it('should handle invalid URLs gracefully', () => {
      const entries: CrawledImageEntry[] = [
        { index: 0, url: 'not-a-valid-url', filename: 'invalid' },
        { index: 1, url: 'https://example.com/valid.jpg', filename: 'valid.jpg' },
      ];
      const result = filterImageEntries(entries);
      expect(result).toHaveLength(1);
      expect(result[0]?.filename).toBe('valid.jpg');
    });

    it('should be case-insensitive for extensions', () => {
      const entries: CrawledImageEntry[] = [
        { index: 0, url: 'https://example.com/image.JPG', filename: 'image.JPG' },
        { index: 1, url: 'https://example.com/photo.PNG', filename: 'photo.PNG' },
      ];
      const result = filterImageEntries(entries);
      expect(result).toHaveLength(2);
    });

    it('should return empty array for no valid images', () => {
      const entries: CrawledImageEntry[] = [
        { index: 0, url: 'https://example.com/doc.pdf', filename: 'doc.pdf' },
        { index: 1, url: 'https://example.com/video.mp4', filename: 'video.mp4' },
      ];
      const result = filterImageEntries(entries);
      expect(result).toHaveLength(0);
    });
  });
});
