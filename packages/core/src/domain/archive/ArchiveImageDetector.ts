import { extname } from 'node:path';
import { SUPPORTED_IMAGE_EXTENSIONS } from './ArchiveConfig.js';
import type { ArchiveEntry } from './ArchiveEntry.js';

/**
 * Check if a filename has a supported image extension
 */
export function isImageFile(filename: string): boolean {
  const ext = extname(filename).toLowerCase();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type guard pattern
  return SUPPORTED_IMAGE_EXTENSIONS.includes(ext as typeof SUPPORTED_IMAGE_EXTENSIONS[number]);
}

/**
 * Check if an archive path is safe (no directory traversal)
 */
export function isSafePath(path: string): boolean {
  const normalizedPath = path.replace(/\\/g, '/');
  return !normalizedPath.includes('../') && !normalizedPath.startsWith('/');
}

/**
 * Filter archive entries to only include safe image files
 */
export function filterImageEntries(entries: ArchiveEntry[]): ArchiveEntry[] {
  return entries.filter(
    entry =>
      !entry.isDirectory && isImageFile(entry.filename) && isSafePath(entry.path),
  );
}
