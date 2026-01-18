/**
 * Maximum length for generated titles
 */
const MAX_TITLE_LENGTH = 50;

/**
 * Default title for images without description
 */
const DEFAULT_TITLE_PREFIX = '無題の画像';

/**
 * Generates a title from description text.
 *
 * @param description - The description text (can be null)
 * @param createdAt - The creation date for fallback title
 * @returns Generated title string
 */
export function generateTitle(
  description: string | null,
  createdAt: Date,
): string {
  if (description !== null && description.trim() !== '') {
    const trimmed = description.trim();
    if (trimmed.length <= MAX_TITLE_LENGTH) {
      return trimmed;
    }
    // Truncate and add ellipsis
    return trimmed.slice(0, MAX_TITLE_LENGTH - 1) + '…';
  }

  // Generate default title with date
  const dateStr = formatDate(createdAt);
  return `${DEFAULT_TITLE_PREFIX} (${dateStr})`;
}

/**
 * Formats a date for display in title.
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}/${month}/${day} ${hours}:${minutes}`;
}
