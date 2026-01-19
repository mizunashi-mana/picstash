import 'reflect-metadata';
import { basename } from 'node:path';
import { injectable } from 'inversify';
import { open } from 'yauzl-promise';
import type {
  ArchiveEntry,
  ArchiveHandler,
} from '@/application/ports/archive-handler.js';

const ZIP_EXTENSIONS = ['.zip'];
const ZIP_MIME_TYPES = ['application/zip', 'application/x-zip-compressed'];

/**
 * Read all data from a stream into a Buffer
 */
async function streamToBuffer(
  stream: NodeJS.ReadableStream,
): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

@injectable()
export class ZipArchiveHandler implements ArchiveHandler {
  readonly archiveType = 'zip' as const;

  canHandle(filePath: string, mimeType: string): boolean {
    const extension = filePath.toLowerCase().slice(filePath.lastIndexOf('.'));
    return (
      ZIP_EXTENSIONS.includes(extension) || ZIP_MIME_TYPES.includes(mimeType)
    );
  }

  async listEntries(archivePath: string): Promise<ArchiveEntry[]> {
    const zipFile = await open(archivePath);

    try {
      const entries = await zipFile.readEntries();

      return entries.map((entry, index) => ({
        index,
        filename: basename(entry.filename),
        path: entry.filename,
        size: entry.uncompressedSize,
        isDirectory: entry.filename.endsWith('/'),
      }));
    }
    finally {
      await zipFile.close();
    }
  }

  async extractEntry(archivePath: string, entryIndex: number): Promise<Buffer> {
    if (entryIndex < 0) {
      throw new Error(`Entry index ${entryIndex} out of range`);
    }

    const zipFile = await open(archivePath);

    try {
      const entries = await zipFile.readEntries();

      if (entryIndex >= entries.length) {
        await zipFile.close();
        throw new Error(`Entry index ${entryIndex} out of range`);
      }

      const entry = entries[entryIndex];
      if (entry === undefined) {
        await zipFile.close();
        throw new Error(`Entry at index ${entryIndex} not found`);
      }

      if (entry.filename.endsWith('/')) {
        await zipFile.close();
        throw new Error('Cannot extract a directory entry');
      }

      // Open a read stream for this specific entry
      const readStream = await zipFile.openReadStream(entry);
      // Must consume the stream completely before closing the zip file
      const buffer = await streamToBuffer(readStream);
      await zipFile.close();
      return buffer;
    }
    catch (error) {
      // Ensure we close on any unexpected error during entry read
      try {
        await zipFile.close();
      }
      catch {
        // Ignore close errors if already closed or in invalid state
      }
      throw error;
    }
  }
}
