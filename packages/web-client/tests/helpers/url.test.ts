import { describe, expect, it } from 'vitest';
import { buildUrl } from '@/shared/helpers/url';

describe('buildUrl', () => {
  it('should return path as-is when no params provided', () => {
    expect(buildUrl('/images')).toBe('/images');
  });

  it('should return path as-is when params is undefined', () => {
    expect(buildUrl('/images', undefined)).toBe('/images');
  });

  it('should build URL with single parameter', () => {
    const result = buildUrl('/images', { q: 'search' });
    expect(result).toBe('/images?q=search');
  });

  it('should build URL with multiple parameters', () => {
    const result = buildUrl('/images', { q: 'search', limit: 50 });
    expect(result).toBe('/images?q=search&limit=50');
  });

  it('should filter out undefined values', () => {
    const result = buildUrl('/images', { q: 'search', filter: undefined });
    expect(result).toBe('/images?q=search');
  });

  it('should filter out null values', () => {
    const result = buildUrl('/images', { q: 'search', filter: null });
    expect(result).toBe('/images?q=search');
  });

  it('should return path only when all params are undefined or null', () => {
    const result = buildUrl('/images', { q: undefined, filter: null });
    expect(result).toBe('/images');
  });

  it('should handle boolean parameters', () => {
    const result = buildUrl('/images', { featured: true, archived: false });
    expect(result).toBe('/images?featured=true&archived=false');
  });

  it('should handle number parameters', () => {
    const result = buildUrl('/images', { page: 1, limit: 20 });
    expect(result).toBe('/images?page=1&limit=20');
  });

  it('should encode special characters', () => {
    const result = buildUrl('/images', { q: 'hello world' });
    expect(result).toBe('/images?q=hello%20world');
  });

  it('should handle empty string parameter', () => {
    const result = buildUrl('/images', { q: '' });
    expect(result).toBe('/images?q=');
  });

  it('should handle mixed valid and undefined parameters', () => {
    const result = buildUrl('/images', {
      q: 'test',
      page: 1,
      filter: undefined,
      sort: 'date',
      order: null,
    });
    expect(result).toBe('/images?q=test&page=1&sort=date');
  });

  it('should handle path with trailing slash', () => {
    const result = buildUrl('/api/images/', { limit: 10 });
    expect(result).toBe('/api/images/?limit=10');
  });

  it('should handle empty params object', () => {
    const result = buildUrl('/images', {});
    expect(result).toBe('/images');
  });
});
