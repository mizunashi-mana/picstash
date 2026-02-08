import { describe, expect, it } from 'vitest';
import { parseSearchQuery, isEmptyQuery } from '@/application/search/query-parser';

describe('parseSearchQuery', () => {
  describe('single term', () => {
    it('should parse a single term', () => {
      const result = parseSearchQuery('風景');
      expect(result).toEqual([['風景']]);
    });

    it('should trim whitespace', () => {
      const result = parseSearchQuery('  風景  ');
      expect(result).toEqual([['風景']]);
    });
  });

  describe('AND (space-separated)', () => {
    it('should parse space-separated terms as AND group', () => {
      const result = parseSearchQuery('風景 海');
      expect(result).toEqual([['風景', '海']]);
    });

    it('should handle multiple spaces between terms', () => {
      const result = parseSearchQuery('風景   海   山');
      expect(result).toEqual([['風景', '海', '山']]);
    });
  });

  describe('OR (pipe-separated)', () => {
    it('should parse pipe-separated terms as OR groups', () => {
      const result = parseSearchQuery('風景 | 山');
      expect(result).toEqual([['風景'], ['山']]);
    });

    it('should handle multiple OR groups', () => {
      const result = parseSearchQuery('風景 | 山 | 海');
      expect(result).toEqual([['風景'], ['山'], ['海']]);
    });
  });

  describe('combined AND and OR', () => {
    it('should parse combined AND and OR correctly', () => {
      const result = parseSearchQuery('風景 海 | 山 川');
      expect(result).toEqual([['風景', '海'], ['山', '川']]);
    });

    it('should handle complex queries', () => {
      const result = parseSearchQuery('青空 雲 | 夕焼け | 星空 月');
      expect(result).toEqual([['青空', '雲'], ['夕焼け'], ['星空', '月']]);
    });
  });

  describe('edge cases', () => {
    it('should return empty array for empty string', () => {
      const result = parseSearchQuery('');
      expect(result).toEqual([]);
    });

    it('should return empty array for whitespace only', () => {
      const result = parseSearchQuery('   ');
      expect(result).toEqual([]);
    });

    it('should skip empty OR groups', () => {
      const result = parseSearchQuery('風景 | | 山');
      expect(result).toEqual([['風景'], ['山']]);
    });

    it('should handle leading/trailing pipes', () => {
      const result = parseSearchQuery('| 風景 |');
      expect(result).toEqual([['風景']]);
    });
  });
});

describe('isEmptyQuery', () => {
  it('should return true for empty query', () => {
    expect(isEmptyQuery([])).toBe(true);
  });

  it('should return false for non-empty query', () => {
    expect(isEmptyQuery([['風景']])).toBe(false);
  });

  it('should return false for multi-group query', () => {
    expect(isEmptyQuery([['風景'], ['山']])).toBe(false);
  });
});
