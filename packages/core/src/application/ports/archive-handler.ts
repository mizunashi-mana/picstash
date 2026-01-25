import type { ArchiveEntry, ArchiveType } from '@/domain/archive/index.js';

// Re-export domain types for backward compatibility
export type { ArchiveEntry };

export interface ArchiveHandler {
  /** The type of archive this handler supports */
  readonly archiveType: ArchiveType;

  /** Check if this handler can process the given file */
  canHandle: (filePath: string, mimeType: string) => boolean;

  /** List all entries in the archive */
  listEntries: (archivePath: string) => Promise<ArchiveEntry[]>;

  /** Extract a specific entry's data as Buffer */
  extractEntry: (archivePath: string, entryIndex: number) => Promise<Buffer>;
}
