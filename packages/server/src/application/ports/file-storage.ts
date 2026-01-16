import type { Readable } from 'node:stream';

export interface SaveFileResult {
  filename: string;
  path: string;
}

export interface FileStorage {
  saveOriginalFromStream: (
    stream: Readable,
    extension: string,
  ) => Promise<SaveFileResult>;
  deleteFile: (relativePath: string) => Promise<void>;
  getAbsolutePath: (relativePath: string) => string;
}
