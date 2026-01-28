import type { Readable } from 'node:stream';

export type FileCategory = 'originals' | 'thumbnails';

export interface SaveFileOptions {
  category: FileCategory;
  extension: string;
  /** 明示的なファイル名。省略時は UUID を生成 */
  filename?: string;
}

export interface SaveFileResult {
  filename: string;
  path: string;
}

export interface FileStorage {
  // --- 書き込み ---
  saveFile: (stream: Readable, options: SaveFileOptions) => Promise<SaveFileResult>;
  saveFileFromBuffer: (buffer: Buffer, options: SaveFileOptions) => Promise<SaveFileResult>;

  /** @deprecated saveFile を使用してください */
  saveOriginalFromStream: (stream: Readable, extension: string) => Promise<SaveFileResult>;

  // --- 読み取り ---
  readFile: (relativePath: string) => Promise<Buffer>;
  readFileAsStream: (relativePath: string) => Promise<Readable>;
  getFileSize: (relativePath: string) => Promise<number>;
  fileExists: (relativePath: string) => Promise<boolean>;

  // --- 削除 ---
  deleteFile: (relativePath: string) => Promise<void>;

  // --- レガシー ---
  /** @deprecated readFile/readFileAsStream を使用してください */
  getAbsolutePath: (relativePath: string) => string;
}
