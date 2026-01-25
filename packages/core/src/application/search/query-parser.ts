/**
 * Search query parser for multi-condition search.
 *
 * Syntax:
 * - Space-separated terms = AND (e.g., "風景 海" → match both)
 * - `|` separated groups = OR (e.g., "風景 | 山" → match either)
 * - Combined (e.g., "風景 海 | 山 川" → (風景 AND 海) OR (山 AND 川))
 */

/** A group of terms that must all match (AND) */
export type AndGroup = string[];

/** Multiple AND groups combined with OR */
export type SearchQuery = AndGroup[];

/**
 * Parse a search query string into a structured SearchQuery.
 *
 * @param query - The raw search query string
 * @returns Parsed SearchQuery (array of AND groups combined with OR)
 *
 * @example
 * parseSearchQuery("風景 海")
 * // Returns: [["風景", "海"]]
 *
 * @example
 * parseSearchQuery("風景 | 山")
 * // Returns: [["風景"], ["山"]]
 *
 * @example
 * parseSearchQuery("風景 海 | 山 川")
 * // Returns: [["風景", "海"], ["山", "川"]]
 */
export function parseSearchQuery(query: string): SearchQuery {
  // Split by OR operator
  const orGroups = query.split('|');

  // Parse each OR group into AND terms
  const result: SearchQuery = [];

  for (const group of orGroups) {
    // Split by whitespace and filter out empty strings
    const terms = group
      .trim()
      .split(/\s+/)
      .filter(term => term !== '');

    // Only add non-empty groups
    if (terms.length > 0) {
      result.push(terms);
    }
  }

  return result;
}

/**
 * Check if a search query is empty (no valid terms).
 */
export function isEmptyQuery(query: SearchQuery): boolean {
  return query.length === 0;
}
