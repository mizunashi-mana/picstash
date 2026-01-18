import { describe, expect, it } from 'vitest';
import { generateTitle } from '@/domain/image/generate-title';

describe('generateTitle', () => {
  describe('with description', () => {
    it('should return trimmed description when length is 50 characters or less', () => {
      const description = 'A beautiful sunset photo';
      const createdAt = new Date('2026-01-15T10:30:00');

      const result = generateTitle(description, createdAt);

      expect(result).toBe('A beautiful sunset photo');
    });

    it('should return trimmed description for exactly 50 characters', () => {
      const description = 'A'.repeat(50);
      const createdAt = new Date('2026-01-15T10:30:00');

      const result = generateTitle(description, createdAt);

      expect(result).toBe(description);
    });

    it('should truncate and add ellipsis when description exceeds 50 characters', () => {
      const description = 'A'.repeat(60);
      const createdAt = new Date('2026-01-15T10:30:00');

      const result = generateTitle(description, createdAt);

      expect(result).toBe('A'.repeat(49) + '…');
      expect(result.length).toBe(50);
    });

    it('should trim whitespace from description', () => {
      const description = '  Trimmed description  ';
      const createdAt = new Date('2026-01-15T10:30:00');

      const result = generateTitle(description, createdAt);

      expect(result).toBe('Trimmed description');
    });

    it('should truncate after trimming for long descriptions with whitespace', () => {
      const description = '  ' + 'B'.repeat(60) + '  ';
      const createdAt = new Date('2026-01-15T10:30:00');

      const result = generateTitle(description, createdAt);

      expect(result).toBe('B'.repeat(49) + '…');
    });
  });

  describe('without description (null or empty)', () => {
    it('should generate default title with date when description is null', () => {
      const createdAt = new Date('2026-01-15T10:30:00');

      const result = generateTitle(null, createdAt);

      expect(result).toBe('無題の画像 (2026/01/15 10:30)');
    });

    it('should generate default title with date when description is empty string', () => {
      const createdAt = new Date('2026-12-31T23:59:00');

      const result = generateTitle('', createdAt);

      expect(result).toBe('無題の画像 (2026/12/31 23:59)');
    });

    it('should generate default title when description contains only whitespace', () => {
      const createdAt = new Date('2026-06-01T00:00:00');

      const result = generateTitle('   ', createdAt);

      expect(result).toBe('無題の画像 (2026/06/01 00:00)');
    });
  });

  describe('date formatting', () => {
    it('should pad single-digit month with zero', () => {
      const createdAt = new Date('2026-01-15T10:30:00');

      const result = generateTitle(null, createdAt);

      expect(result).toContain('01/15');
    });

    it('should pad single-digit day with zero', () => {
      const createdAt = new Date('2026-12-05T10:30:00');

      const result = generateTitle(null, createdAt);

      expect(result).toContain('12/05');
    });

    it('should pad single-digit hours with zero', () => {
      const createdAt = new Date('2026-01-15T09:30:00');

      const result = generateTitle(null, createdAt);

      expect(result).toContain('09:30');
    });

    it('should pad single-digit minutes with zero', () => {
      const createdAt = new Date('2026-01-15T10:05:00');

      const result = generateTitle(null, createdAt);

      expect(result).toContain('10:05');
    });

    it('should format date correctly at midnight', () => {
      const createdAt = new Date('2026-01-01T00:00:00');

      const result = generateTitle(null, createdAt);

      expect(result).toBe('無題の画像 (2026/01/01 00:00)');
    });

    it('should format date correctly at end of day', () => {
      const createdAt = new Date('2026-12-31T23:59:00');

      const result = generateTitle(null, createdAt);

      expect(result).toBe('無題の画像 (2026/12/31 23:59)');
    });
  });
});
