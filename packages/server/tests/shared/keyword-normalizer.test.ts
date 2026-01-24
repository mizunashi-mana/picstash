import { describe, expect, it } from 'vitest';
import { normalizeKeywords } from '@/shared/normalizers/keyword-normalizer.js';

describe('normalizeKeywords', () => {
  it('should return undefined for undefined input', () => {
    expect(normalizeKeywords(undefined)).toBeUndefined();
  });

  it('should return undefined for empty string', () => {
    expect(normalizeKeywords('')).toBeUndefined();
  });

  it('should return undefined for whitespace-only string', () => {
    expect(normalizeKeywords('   ')).toBeUndefined();
  });

  it('should return undefined for comma-only string', () => {
    expect(normalizeKeywords(',,')).toBeUndefined();
  });

  it('should trim single keyword', () => {
    expect(normalizeKeywords('  hello  ')).toBe('hello');
  });

  it('should trim each keyword in comma-separated list', () => {
    expect(normalizeKeywords('  foo  ,  bar  ,  baz  ')).toBe('foo,bar,baz');
  });

  it('should remove empty keywords from list', () => {
    expect(normalizeKeywords('foo,,bar')).toBe('foo,bar');
    expect(normalizeKeywords(',foo,bar,')).toBe('foo,bar');
  });

  it('should handle keywords with only whitespace between commas', () => {
    expect(normalizeKeywords('foo,   ,bar')).toBe('foo,bar');
  });

  it('should preserve single valid keyword', () => {
    expect(normalizeKeywords('keyword')).toBe('keyword');
  });

  it('should handle multiple commas', () => {
    expect(normalizeKeywords('a,,,b,,,c')).toBe('a,b,c');
  });

  it('should return undefined when all keywords are empty after trim', () => {
    expect(normalizeKeywords(',  ,  ,')).toBeUndefined();
  });
});
