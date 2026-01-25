/**
 * Normalize a comma-separated keywords string.
 * - Trims each keyword
 * - Removes empty keywords
 * - Returns undefined if result is empty
 */
export function normalizeKeywords(
  keywords: string | undefined,
): string | undefined {
  if (keywords === undefined) {
    return undefined;
  }

  const trimmed = keywords
    .split(',')
    .map(k => k.trim())
    .filter(k => k.length > 0)
    .join(',');

  return trimmed.length > 0 ? trimmed : undefined;
}
