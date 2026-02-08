import { describe, expect, it } from 'vitest';
import { buildSearchWhere, buildTermCondition } from '@/application/search/build-search-where';

describe('buildTermCondition', () => {
  it('should build OR condition for single term', () => {
    const result = buildTermCondition('風景');

    expect(result).toEqual({
      OR: [
        { description: { contains: '風景' } },
        {
          attributes: {
            some: {
              OR: [
                { keywords: { contains: '風景' } },
                { label: { name: { contains: '風景' } } },
              ],
            },
          },
        },
      ],
    });
  });

  it('should handle English term', () => {
    const result = buildTermCondition('landscape');

    expect(result.OR).toHaveLength(2);
    expect(result.OR?.[0]).toEqual({ description: { contains: 'landscape' } });
  });
});

describe('buildSearchWhere', () => {
  describe('single term', () => {
    it('should return term condition directly for single term', () => {
      const result = buildSearchWhere([['風景']]);

      expect(result.OR).toHaveLength(2);
      expect(result.OR?.[0]).toEqual({ description: { contains: '風景' } });
    });
  });

  describe('AND groups', () => {
    it('should wrap multiple terms in AND', () => {
      const result = buildSearchWhere([['風景', '海']]);

      expect(result.AND).toHaveLength(2);
      expect(result.AND?.[0]?.OR?.[0]).toEqual({ description: { contains: '風景' } });
      expect(result.AND?.[1]?.OR?.[0]).toEqual({ description: { contains: '海' } });
    });

    it('should handle three terms in AND group', () => {
      const result = buildSearchWhere([['風景', '海', '山']]);

      expect(result.AND).toHaveLength(3);
    });
  });

  describe('OR groups', () => {
    it('should wrap multiple groups in OR', () => {
      const result = buildSearchWhere([['風景'], ['山']]);

      expect(result.OR).toHaveLength(2);
    });

    it('should handle three OR groups', () => {
      const result = buildSearchWhere([['風景'], ['山'], ['海']]);

      expect(result.OR).toHaveLength(3);
    });
  });

  describe('combined AND and OR', () => {
    it('should handle AND within OR groups', () => {
      const result = buildSearchWhere([['風景', '海'], ['山', '川']]);

      expect(result.OR).toHaveLength(2);
      expect(result.OR?.[0]?.AND).toHaveLength(2);
      expect(result.OR?.[1]?.AND).toHaveLength(2);
    });

    it('should handle mixed single and multiple term groups', () => {
      const result = buildSearchWhere([['風景'], ['山', '川']]);

      expect(result.OR).toHaveLength(2);
      // First group is single term (no AND wrapper)
      expect(result.OR?.[0]?.OR).toHaveLength(2);
      // Second group has multiple terms (wrapped in AND)
      expect(result.OR?.[1]?.AND).toHaveLength(2);
    });
  });

  describe('edge cases', () => {
    it('should handle empty query', () => {
      const result = buildSearchWhere([]);

      expect(result).toEqual({ OR: [] });
    });
  });
});
