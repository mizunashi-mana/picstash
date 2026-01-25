import 'reflect-metadata';
import { createReadStream } from 'node:fs';
import { basename } from 'node:path';
import { injectable } from 'inversify';
import unzipper from 'unzipper';
import { open } from 'yauzl-promise';
import type {
  ArchiveEntry,
  ArchiveHandler,
} from '../../application/ports/archive-handler.js';

const ZIP_EXTENSIONS = ['.zip'];
const ZIP_MIME_TYPES = ['application/zip', 'application/x-zip-compressed'];

/** Error message indicating EOCD is not found (from yauzl) */
const EOCD_NOT_FOUND_ERROR = 'End of Central Directory Record not found';

/** Error message for truncated ZIP files (from unzipper) */
const FILE_ENDED_ERROR = 'FILE_ENDED';

/**
 * Check if an error is an EOCD not found error
 */
function isEocdNotFoundError(error: unknown): boolean {
  return error instanceof Error && error.message === EOCD_NOT_FOUND_ERROR;
}

/**
 * Check if an error is a FILE_ENDED error (expected for truncated ZIPs)
 */
function isFileEndedError(error: unknown): boolean {
  return error instanceof Error && error.message === FILE_ENDED_ERROR;
}

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

/**
 * Get uncompressedSize from entry.vars
 * The @types/unzipper package doesn't include uncompressedSize in vars,
 * but it exists at runtime.
 */
function getUncompressedSize(entry: unzipper.Entry): number {
  const vars: Record<string, unknown> = entry.vars;
  const size = vars.uncompressedSize;
  return typeof size === 'number' ? size : 0;
}

/**
 * List entries using streaming mode (fallback for corrupted ZIPs)
 * This scans local file headers instead of relying on the central directory.
 *
 * Note: Entry indices are assigned sequentially including directory entries,
 * matching the behavior of yauzl's readEntries() to ensure consistency
 * between normal and fallback modes.
 */
async function listEntriesWithStreaming(
  archivePath: string,
): Promise<ArchiveEntry[]> {
  const entries: ArchiveEntry[] = [];
  let index = 0;

  await new Promise<void>((resolve, reject) => {
    const fileStream = createReadStream(archivePath);
    const parser = fileStream.pipe(unzipper.Parse());

    parser
      .on('entry', (entry: unzipper.Entry) => {
        entries.push({
          index: index++,
          filename: basename(entry.path),
          path: entry.path,
          size: getUncompressedSize(entry),
          isDirectory: entry.type === 'Directory',
        });
        // Skip the content for now (we just want the list)
        entry.autodrain();
      })
      .on('close', resolve)
      .on('error', (err: Error) => {
        // Clean up file stream on error
        fileStream.destroy();
        // FILE_ENDED error is expected for truncated ZIPs
        // We still have the entries we found before the error
        if (isFileEndedError(err)) {
          resolve();
        }
        else {
          reject(err);
        }
      });
  });

  return entries;
}

/**
 * Extract entry using streaming mode (fallback for corrupted ZIPs)
 *
 * Note: Entry indices must match those from listEntriesWithStreaming().
 * Both functions assign indices sequentially including directory entries.
 */
async function extractEntryWithStreaming(
  archivePath: string,
  entryIndex: number,
): Promise<Buffer> {
  return await new Promise<Buffer>((resolve, reject) => {
    let currentIndex = 0;
    let entryFound = false;
    let resolved = false;

    const fileStream = createReadStream(archivePath);
    const parser = fileStream.pipe(unzipper.Parse());

    const cleanup = (): void => {
      fileStream.destroy();
    };

    parser
      .on('entry', (entry: unzipper.Entry) => {
        if (currentIndex === entryIndex) {
          entryFound = true;

          // Check for directory entry (consistent with yauzl path)
          if (entry.type === 'Directory') {
            resolved = true;
            cleanup();
            reject(new Error('Cannot extract a directory entry'));
            return;
          }

          // Extract the entry content
          streamToBuffer(entry)
            .then((buffer) => {
              resolved = true;
              cleanup();
              resolve(buffer);
            })
            .catch((err: unknown) => {
              resolved = true;
              cleanup();
              reject(err instanceof Error ? err : new Error(String(err)));
            });
        }
        else {
          entry.autodrain();
        }
        currentIndex++;
      })
      .on('close', () => {
        // Only reject if entry was never found (not if extraction is in progress)
        if (!entryFound && !resolved) {
          reject(new Error(`Entry index ${entryIndex} not found`));
        }
      })
      .on('error', (err: Error) => {
        // If already resolved, ignore errors (especially FILE_ENDED)
        if (resolved) {
          return;
        }
        // FILE_ENDED is expected for truncated ZIPs - ignore if entry was found
        if (isFileEndedError(err) && entryFound) {
          return;
        }
        cleanup();
        // FILE_ENDED with entry not found means entry was not found before truncation
        if (isFileEndedError(err)) {
          reject(new Error(`Entry index ${entryIndex} not found`));
        }
        else {
          reject(err);
        }
      });
  });
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
    try {
      // Try the normal yauzl approach first (faster and more accurate)
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
    catch (error) {
      // If EOCD not found, fall back to streaming mode
      if (isEocdNotFoundError(error)) {
        return await listEntriesWithStreaming(archivePath);
      }
      throw error;
    }
  }

  async extractEntry(archivePath: string, entryIndex: number): Promise<Buffer> {
    if (entryIndex < 0) {
      throw new Error(`Entry index ${entryIndex} out of range`);
    }

    try {
      const zipFile = await open(archivePath);
      let buffer: Buffer | undefined;

      try {
        const entries = await zipFile.readEntries();

        if (entryIndex >= entries.length) {
          throw new Error(`Entry index ${entryIndex} out of range`);
        }

        const entry = entries[entryIndex];
        if (entry === undefined) {
          throw new Error(`Entry at index ${entryIndex} not found`);
        }

        if (entry.filename.endsWith('/')) {
          throw new Error('Cannot extract a directory entry');
        }

        // Open a read stream for this specific entry
        const readStream = await zipFile.openReadStream(entry);
        // Must consume the stream completely before closing the zip file
        buffer = await streamToBuffer(readStream);
      }
      finally {
        await zipFile.close();
      }

      return buffer;
    }
    catch (error) {
      // If EOCD not found, fall back to streaming mode
      if (isEocdNotFoundError(error)) {
        return await extractEntryWithStreaming(archivePath, entryIndex);
      }
      throw error;
    }
  }
}
