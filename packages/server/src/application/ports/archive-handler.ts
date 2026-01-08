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

export interface ArchiveHandler {
  /** Check if this handler can process the given file */
  canHandle(filePath: string, mimeType: string): boolean;

  /** List all entries in the archive */
  listEntries(archivePath: string): Promise<ArchiveEntry[]>;

  /** Extract a specific entry's data as Buffer */
  extractEntry(archivePath: string, entryIndex: number): Promise<Buffer>;
}
