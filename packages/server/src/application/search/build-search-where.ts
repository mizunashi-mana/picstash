/**
 * Build Prisma WHERE clause for image search.
 *
 * This module converts a parsed SearchQuery into a Prisma-compatible
 * WHERE clause structure for searching images.
 */

import type { SearchQuery } from './query-parser.js';

/**
 * Prisma-like WHERE input structure for images.
 * This is a simplified representation that mirrors Prisma.ImageWhereInput.
 */
export interface ImageSearchWhereInput {
  OR?: ImageSearchWhereInput[];
  AND?: ImageSearchWhereInput[];
  description?: { contains: string };
  attributes?: {
    some: {
      OR: Array<
        | { keywords: { contains: string } }
        | { label: { name: { contains: string } } }
      >;
    };
  };
}

/**
 * Build WHERE clause for a single search term.
 * Matches if term is found in description, keywords, or label name.
 */
export function buildTermCondition(term: string): ImageSearchWhereInput {
  return {
    OR: [
      { description: { contains: term } },
      {
        attributes: {
          some: {
            OR: [
              { keywords: { contains: term } },
              { label: { name: { contains: term } } },
            ],
          },
        },
      },
    ],
  };
}

/**
 * Build Prisma WHERE clause from parsed SearchQuery.
 * Structure: OR of AND groups, where each AND group contains multiple terms.
 *
 * @param parsedQuery - Parsed search query from parseSearchQuery()
 * @returns Prisma-compatible WHERE clause
 *
 * @example
 * // Single term: "風景"
 * buildSearchWhere([["風景"]])
 * // Returns condition matching "風景" in any field
 *
 * @example
 * // AND: "風景 海"
 * buildSearchWhere([["風景", "海"]])
 * // Returns { AND: [condition for 風景, condition for 海] }
 *
 * @example
 * // OR: "風景 | 山"
 * buildSearchWhere([["風景"], ["山"]])
 * // Returns { OR: [condition for 風景, condition for 山] }
 *
 * @example
 * // Combined: "風景 海 | 山 川"
 * buildSearchWhere([["風景", "海"], ["山", "川"]])
 * // Returns { OR: [{ AND: [風景, 海] }, { AND: [山, 川] }] }
 */
export function buildSearchWhere(parsedQuery: SearchQuery): ImageSearchWhereInput {
  // Each AND group: all terms must match
  const orConditions = parsedQuery.map((andGroup) => {
    if (andGroup.length === 1) {
      // Single term - no need for AND wrapper
      // Non-null assertion is safe: andGroup.length === 1 guarantees andGroup[0] exists
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Length check guarantees element exists
      return buildTermCondition(andGroup[0]!);
    }
    // Multiple terms - wrap in AND
    return {
      AND: andGroup.map(term => buildTermCondition(term)),
    };
  });

  // If only one OR group, return it directly
  if (orConditions.length === 1) {
    // Non-null assertion is safe: orConditions.length === 1 guarantees orConditions[0] exists
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Length check guarantees element exists
    return orConditions[0]!;
  }

  // Multiple OR groups - wrap in OR
  return { OR: orConditions };
}
