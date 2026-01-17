import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir, unlink } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import { injectable } from 'inversify';
import { getConfig } from '@/config.js';
import type {
  FileStorage,
  SaveFileResult,
} from '@/application/ports/file-storage.js';
import type { Readable } from 'node:stream';

const currentDir = dirname(fileURLToPath(import.meta.url));

function getStoragePath(): string {
  return resolve(currentDir, '../../..', getConfig().storage.path);
}

function getOriginalsPath(): string {
  return join(getStoragePath(), 'originals');
}

@injectable()
export class LocalFileStorage implements FileStorage {
  private generateFilename(extension: string): string {
    const uuid = randomUUID();
    return `${uuid}${extension}`;
  }

  private async ensureDirectory(dir: string): Promise<void> {
    await mkdir(dir, { recursive: true });
  }

  async saveOriginalFromStream(
    stream: Readable,
    extension: string,
  ): Promise<SaveFileResult> {
    await this.ensureDirectory(getOriginalsPath());

    const filename = this.generateFilename(extension);
    const filePath = join(getOriginalsPath(), filename);

    const writeStream = createWriteStream(filePath);
    try {
      await pipeline(stream, writeStream);
    }
    catch (error) {
      // Clean up partial file on error (e.g., disk full, permission error)
      await unlink(filePath).catch(() => {
        // Ignore cleanup errors to avoid masking the original failure
      });
      throw error;
    }

    return {
      filename,
      path: `originals/${filename}`,
    };
  }

  async deleteFile(relativePath: string): Promise<void> {
    const filePath = join(getStoragePath(), relativePath);
    await unlink(filePath);
  }

  getAbsolutePath(relativePath: string): string {
    return join(getStoragePath(), relativePath);
  }
}
