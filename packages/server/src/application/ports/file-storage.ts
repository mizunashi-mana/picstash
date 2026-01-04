export interface SaveFileResult {
  filename: string;
  path: string;
}

export interface FileStorage {
  saveOriginal(buffer: Buffer, extension: string): Promise<SaveFileResult>;
  deleteFile(relativePath: string): Promise<void>;
  getAbsolutePath(relativePath: string): string;
}
