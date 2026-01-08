import type { ArchiveEntry } from './archive-handler.js';
import type { Readable } from 'node:stream';

export interface ArchiveSession {
  /** Unique session ID */
  id: string;
  /** Original filename of the archive */
  filename: string;
  /** Path to the temporary archive file */
  archivePath: string;
  /** Archive type (zip, rar) */
  archiveType: 'zip' | 'rar';
  /** List of image entries in the archive */
  imageEntries: ArchiveEntry[];
  /** Creation timestamp */
  createdAt: Date;
}

export interface CreateSessionInput {
  filename: string;
  mimeType: string;
  stream: Readable;
}

export type CreateSessionResult
  = | { success: true; session: ArchiveSession }
    | { success: false; error: 'UNSUPPORTED_FORMAT' | 'EMPTY_ARCHIVE' | 'FILE_TOO_LARGE'; message: string };

export interface ArchiveSessionManager {
  /** Create a new session from an uploaded archive */
  createSession(input: CreateSessionInput): Promise<CreateSessionResult>;

  /** Get a session by ID */
  getSession(sessionId: string): ArchiveSession | undefined;

  /** Extract an image from an archive session */
  extractImage(sessionId: string, entryIndex: number): Promise<Buffer>;

  /** Delete a session and clean up temporary files */
  deleteSession(sessionId: string): Promise<void>;
}
