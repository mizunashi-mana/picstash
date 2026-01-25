import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir, unlink } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/infra/di/types.js';
import type {
  FileStorage,
  SaveFileResult,
} from '@/application/ports/file-storage.js';
import type { Config } from '@/config.js';
import type { Readable } from 'node:stream';

const currentDir = dirname(fileURLToPath(import.meta.url));

@injectable()
export class LocalFileStorage implements FileStorage {
  private readonly storagePath: string;

  constructor(@inject(TYPES.Config) config: Config) {
    this.storagePath = resolve(currentDir, '../../..', config.storage.path);
  }

  private getOriginalsPath(): string {
    return join(this.storagePath, 'originals');
  }

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
    await this.ensureDirectory(this.getOriginalsPath());

    const filename = this.generateFilename(extension);
    const filePath = join(this.getOriginalsPath(), filename);

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
    const filePath = join(this.storagePath, relativePath);
    await unlink(filePath);
  }

  getAbsolutePath(relativePath: string): string {
    return join(this.storagePath, relativePath);
  }
}
