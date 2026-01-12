import type { ArchiveEntry } from './ArchiveEntry.js';

/**
 * Archive type supported by the system
 */
export type ArchiveType = 'zip' | 'rar';

/**
 * ArchiveSession value object - represents an active archive import session
 */
export interface ArchiveSession {
  /** Unique session ID */
  id: string;
  /** Original filename of the archive */
  filename: string;
  /** Path to the temporary archive file */
  archivePath: string;
  /** Archive type (zip, rar) */
  archiveType: ArchiveType;
  /** List of image entries in the archive */
  imageEntries: ArchiveEntry[];
  /** Creation timestamp */
  createdAt: Date;
}
