import qs from 'qs';

/**
 * Build a URL with query parameters using qs library.
 * Undefined and null values are automatically filtered out.
 *
 * @param path - The base path (e.g., '/images')
 * @param params - Query parameters object
 * @returns URL string with encoded query parameters
 *
 * @example
 * buildUrl('/images', { q: 'search term', limit: 50 })
 * // => '/images?q=search%20term&limit=50'
 *
 * buildUrl('/images', { q: undefined, limit: 50 })
 * // => '/images?limit=50'
 */
export function buildUrl(
  path: string,
  params?: Record<string, string | number | boolean | undefined | null>,
): string {
  if (params === undefined) {
    return path;
  }

  // Filter out undefined and null values using Object.fromEntries
  // Object.entries + filter ensures only safe keys are included
  const filteredEntries = Object.entries(params).filter(
    (entry): entry is [string, string | number | boolean] =>
      entry[1] !== undefined && entry[1] !== null,
  );

  if (filteredEntries.length === 0) {
    return path;
  }

  const filteredParams = Object.fromEntries(filteredEntries);

  const queryString = qs.stringify(filteredParams);
  return `${path}?${queryString}`;
}
