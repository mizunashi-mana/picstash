import 'reflect-metadata';
import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { injectable } from 'inversify';
import { createExtractorFromData } from 'node-unrar-js';
import type {
  ArchiveEntry,
  ArchiveHandler,
} from '../../application/ports/archive-handler.js';

const RAR_EXTENSIONS = ['.rar'];
const RAR_MIME_TYPES = [
  'application/vnd.rar',
  'application/x-rar-compressed',
  'application/x-rar',
];

interface RarFileHeader {
  name: string;
  unpSize: number;
  flags: {
    directory: boolean;
  };
}

@injectable()
export class RarArchiveHandler implements ArchiveHandler {
  readonly archiveType = 'rar' as const;

  canHandle(filePath: string, mimeType: string): boolean {
    const extension = filePath.toLowerCase().slice(filePath.lastIndexOf('.'));
    return (
      RAR_EXTENSIONS.includes(extension) || RAR_MIME_TYPES.includes(mimeType)
    );
  }

  async listEntries(archivePath: string): Promise<ArchiveEntry[]> {
    const fileBuffer = await readFile(archivePath);
    const extractor = await createExtractorFromData({
      data: Uint8Array.from(fileBuffer).buffer,
    });

    const list = extractor.getFileList();
    const fileHeaders = [...list.fileHeaders] as RarFileHeader[];

    return fileHeaders.map((header, index) => ({
      index,
      filename: basename(header.name),
      path: header.name,
      size: header.unpSize,
      isDirectory: header.flags.directory,
    }));
  }

  async extractEntry(archivePath: string, entryIndex: number): Promise<Buffer> {
    const fileBuffer = await readFile(archivePath);
    const extractor = await createExtractorFromData({
      data: Uint8Array.from(fileBuffer).buffer,
    });

    const list = extractor.getFileList();
    const fileHeaders = [...list.fileHeaders] as RarFileHeader[];

    if (entryIndex < 0 || entryIndex >= fileHeaders.length) {
      throw new Error(`Entry index ${entryIndex} out of range`);
    }

    const targetHeader = fileHeaders[entryIndex];
    if (targetHeader === undefined) {
      throw new Error(`Entry at index ${entryIndex} not found`);
    }

    if (targetHeader.flags.directory) {
      throw new Error('Cannot extract a directory entry');
    }

    const extracted = extractor.extract({ files: [targetHeader.name] });
    const files = [...extracted.files];

    const file = files[0];
    if (file?.extraction === undefined) {
      throw new Error(`Failed to extract entry at index ${entryIndex}`);
    }

    return Buffer.from(file.extraction);
  }
}
