import {
  buildSearchWhere,
  buildTermCondition,
} from '@picstash/core';
import { describe, expect, it } from 'vitest';

describe('buildTermCondition', () => {
  it('should build condition for a single term', () => {
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

  it('should handle special characters in term', () => {
    const result = buildTermCondition('C++');

    expect(result.OR).toBeDefined();
    expect(result.OR?.[0]).toEqual({ description: { contains: 'C++' } });
  });
});

describe('buildSearchWhere', () => {
  describe('single term queries', () => {
    it('should build WHERE for single term', () => {
      const result = buildSearchWhere([['風景']]);

      // Single term returns the term condition directly (no AND wrapper)
      expect(result.OR).toBeDefined();
      expect(result.OR).toHaveLength(2);
    });
  });

  describe('AND queries', () => {
    it('should build AND condition for multiple terms in one group', () => {
      const result = buildSearchWhere([['風景', '海']]);

      // Multiple terms in one group are wrapped in AND
      expect(result.AND).toBeDefined();
      expect(result.AND).toHaveLength(2);

      // Each AND element should be a term condition
      expect(result.AND?.[0]?.OR).toBeDefined();
      expect(result.AND?.[1]?.OR).toBeDefined();
    });

    it('should build AND condition for three terms', () => {
      const result = buildSearchWhere([['a', 'b', 'c']]);

      expect(result.AND).toBeDefined();
      expect(result.AND).toHaveLength(3);
    });
  });

  describe('OR queries', () => {
    it('should build OR condition for multiple groups', () => {
      const result = buildSearchWhere([['風景'], ['山']]);

      // Multiple groups are wrapped in OR
      expect(result.OR).toBeDefined();
      expect(result.OR).toHaveLength(2);

      // Each OR element should be a term condition (single term groups)
      expect(result.OR?.[0]?.OR).toBeDefined(); // nested OR from term condition
      expect(result.OR?.[1]?.OR).toBeDefined();
    });

    it('should build OR condition for three groups', () => {
      const result = buildSearchWhere([['a'], ['b'], ['c']]);

      expect(result.OR).toBeDefined();
      expect(result.OR).toHaveLength(3);
    });
  });

  describe('combined AND/OR queries', () => {
    it('should build combined AND/OR condition', () => {
      // "風景 海 | 山 川" → (風景 AND 海) OR (山 AND 川)
      const result = buildSearchWhere([['風景', '海'], ['山', '川']]);

      // Top level is OR
      expect(result.OR).toBeDefined();
      expect(result.OR).toHaveLength(2);

      // Each OR element is an AND group
      expect(result.OR?.[0]?.AND).toBeDefined();
      expect(result.OR?.[0]?.AND).toHaveLength(2);
      expect(result.OR?.[1]?.AND).toBeDefined();
      expect(result.OR?.[1]?.AND).toHaveLength(2);
    });

    it('should handle mixed single and multi-term groups', () => {
      // "a | b c | d" → a OR (b AND c) OR d
      const result = buildSearchWhere([['a'], ['b', 'c'], ['d']]);

      expect(result.OR).toBeDefined();
      expect(result.OR).toHaveLength(3);

      // First group: single term (no AND wrapper, just term condition)
      expect(result.OR?.[0]?.OR).toBeDefined(); // term condition has OR
      expect(result.OR?.[0]?.AND).toBeUndefined();

      // Second group: AND
      expect(result.OR?.[1]?.AND).toBeDefined();
      expect(result.OR?.[1]?.AND).toHaveLength(2);

      // Third group: single term
      expect(result.OR?.[2]?.OR).toBeDefined();
      expect(result.OR?.[2]?.AND).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('should handle empty query (should not be called, but handle gracefully)', () => {
      // In practice, isEmptyQuery should prevent this from being called
      // But if called with empty array, it should return empty OR
      const result = buildSearchWhere([]);

      expect(result).toEqual({ OR: [] });
    });
  });
});
