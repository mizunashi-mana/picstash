import {
  isEmptyQuery,
  parseSearchQuery,
} from '@picstash/core';
import { describe, expect, it } from 'vitest';

describe('parseSearchQuery', () => {
  describe('empty and whitespace input', () => {
    it('should return empty array for empty string', () => {
      expect(parseSearchQuery('')).toEqual([]);
    });

    it('should return empty array for whitespace only', () => {
      expect(parseSearchQuery('   ')).toEqual([]);
      expect(parseSearchQuery('\t\n')).toEqual([]);
    });

    it('should return empty array for pipe only', () => {
      expect(parseSearchQuery('|')).toEqual([]);
      expect(parseSearchQuery(' | ')).toEqual([]);
    });
  });

  describe('single term queries', () => {
    it('should parse single term', () => {
      expect(parseSearchQuery('風景')).toEqual([['風景']]);
    });

    it('should trim whitespace around single term', () => {
      expect(parseSearchQuery('  風景  ')).toEqual([['風景']]);
    });
  });

  describe('AND queries (space-separated)', () => {
    it('should parse two space-separated terms as AND', () => {
      expect(parseSearchQuery('風景 海')).toEqual([['風景', '海']]);
    });

    it('should parse multiple space-separated terms as AND', () => {
      expect(parseSearchQuery('風景 海 山')).toEqual([['風景', '海', '山']]);
    });

    it('should handle multiple spaces between terms', () => {
      expect(parseSearchQuery('風景   海')).toEqual([['風景', '海']]);
    });

    it('should handle tabs and mixed whitespace', () => {
      expect(parseSearchQuery('風景\t海')).toEqual([['風景', '海']]);
    });
  });

  describe('OR queries (pipe-separated)', () => {
    it('should parse two pipe-separated terms as OR', () => {
      expect(parseSearchQuery('風景 | 山')).toEqual([['風景'], ['山']]);
    });

    it('should parse multiple pipe-separated terms as OR', () => {
      expect(parseSearchQuery('風景 | 山 | 海')).toEqual([['風景'], ['山'], ['海']]);
    });

    it('should handle pipe without spaces', () => {
      expect(parseSearchQuery('風景|山')).toEqual([['風景'], ['山']]);
    });
  });

  describe('combined AND/OR queries', () => {
    it('should parse combined AND/OR query', () => {
      expect(parseSearchQuery('風景 海 | 山 川')).toEqual([['風景', '海'], ['山', '川']]);
    });

    it('should handle complex combined queries', () => {
      expect(parseSearchQuery('a b c | d e | f')).toEqual([['a', 'b', 'c'], ['d', 'e'], ['f']]);
    });
  });

  describe('edge cases', () => {
    it('should handle multiple consecutive pipes', () => {
      expect(parseSearchQuery('風景 || 山')).toEqual([['風景'], ['山']]);
    });

    it('should handle leading pipe', () => {
      expect(parseSearchQuery('| 風景')).toEqual([['風景']]);
    });

    it('should handle trailing pipe', () => {
      expect(parseSearchQuery('風景 |')).toEqual([['風景']]);
    });

    it('should handle special characters in terms', () => {
      expect(parseSearchQuery('C++ JavaScript')).toEqual([['C++', 'JavaScript']]);
    });

    it('should handle Japanese characters', () => {
      expect(parseSearchQuery('日本語 テスト | 検索')).toEqual([['日本語', 'テスト'], ['検索']]);
    });
  });
});

describe('isEmptyQuery', () => {
  it('should return true for empty array', () => {
    expect(isEmptyQuery([])).toBe(true);
  });

  it('should return false for non-empty array', () => {
    expect(isEmptyQuery([['風景']])).toBe(false);
    expect(isEmptyQuery([['a'], ['b']])).toBe(false);
  });
});
