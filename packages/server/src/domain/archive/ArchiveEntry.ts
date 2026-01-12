/**
 * ArchiveEntry value object - represents a file entry within an archive
 */
export interface ArchiveEntry {
  /** Index of the entry in the archive */
  index: number;
  /** File name (without path) */
  filename: string;
  /** Full path within the archive */
  path: string;
  /** File size in bytes */
  size: number;
  /** Whether this entry is a directory */
  isDirectory: boolean;
}
