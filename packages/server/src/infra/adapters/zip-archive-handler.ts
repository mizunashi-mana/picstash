import 'reflect-metadata';
import { basename } from 'node:path';
import AdmZip from 'adm-zip';
import { injectable } from 'inversify';
import type {
  ArchiveEntry,
  ArchiveHandler,
} from '@/application/ports/archive-handler.js';

const ZIP_EXTENSIONS = ['.zip'];
const ZIP_MIME_TYPES = ['application/zip', 'application/x-zip-compressed'];

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
    const zip = new AdmZip(archivePath);
    const zipEntries = zip.getEntries();

    return zipEntries.map((entry, index) => ({
      index,
      filename: basename(entry.entryName),
      path: entry.entryName,
      size: entry.header.size,
      isDirectory: entry.isDirectory,
    }));
  }

  async extractEntry(archivePath: string, entryIndex: number): Promise<Buffer> {
    const zip = new AdmZip(archivePath);
    const zipEntries = zip.getEntries();

    if (entryIndex < 0 || entryIndex >= zipEntries.length) {
      throw new Error(`Entry index ${entryIndex} out of range`);
    }

    const entry = zipEntries[entryIndex];
    if (entry === undefined) {
      throw new Error(`Entry at index ${entryIndex} not found`);
    }

    if (entry.isDirectory) {
      throw new Error('Cannot extract a directory entry');
    }

    return entry.getData();
  }
}
