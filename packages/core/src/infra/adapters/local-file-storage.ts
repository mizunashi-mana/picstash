import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { access, mkdir, stat, readFile, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/infra/di/types.js';
import type {
  FileStorage,
  SaveFileOptions,
  SaveFileResult,
} from '@/application/ports/file-storage.js';
import type { CoreConfig } from '@/config.js';
import type { Readable } from 'node:stream';

@injectable()
export class LocalFileStorage implements FileStorage {
  private readonly storagePath: string;

  constructor(@inject(TYPES.Config) config: CoreConfig) {
    // storage.path must be an absolute path (resolved by server package)
    this.storagePath = config.storage.path;
  }

  private getCategoryPath(category: string): string {
    return join(this.storagePath, category);
  }

  private generateFilename(extension: string): string {
    const uuid = randomUUID();
    return `${uuid}${extension}`;
  }

  private async ensureDirectory(dir: string): Promise<void> {
    await mkdir(dir, { recursive: true });
  }

  async saveFile(
    stream: Readable,
    options: SaveFileOptions,
  ): Promise<SaveFileResult> {
    const categoryPath = this.getCategoryPath(options.category);
    await this.ensureDirectory(categoryPath);

    const filename = options.filename ?? this.generateFilename(options.extension);
    const filePath = join(categoryPath, filename);

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
      path: `${options.category}/${filename}`,
    };
  }

  async saveFileFromBuffer(
    buffer: Buffer,
    options: SaveFileOptions,
  ): Promise<SaveFileResult> {
    const categoryPath = this.getCategoryPath(options.category);
    await this.ensureDirectory(categoryPath);

    const filename = options.filename ?? this.generateFilename(options.extension);
    const filePath = join(categoryPath, filename);

    await writeFile(filePath, buffer);

    return {
      filename,
      path: `${options.category}/${filename}`,
    };
  }

  /** @deprecated saveFile を使用してください */
  async saveOriginalFromStream(
    stream: Readable,
    extension: string,
  ): Promise<SaveFileResult> {
    return await this.saveFile(stream, { category: 'originals', extension });
  }

  async readFile(relativePath: string): Promise<Buffer> {
    const filePath = join(this.storagePath, relativePath);
    return await readFile(filePath);
  }

  async readFileAsStream(relativePath: string): Promise<Readable> {
    const filePath = join(this.storagePath, relativePath);
    return await Promise.resolve(createReadStream(filePath));
  }

  async getFileSize(relativePath: string): Promise<number> {
    const filePath = join(this.storagePath, relativePath);
    const fileStat = await stat(filePath);
    return fileStat.size;
  }

  async fileExists(relativePath: string): Promise<boolean> {
    const filePath = join(this.storagePath, relativePath);
    try {
      await access(filePath);
      return true;
    }
    catch {
      return false;
    }
  }

  async deleteFile(relativePath: string): Promise<void> {
    const filePath = join(this.storagePath, relativePath);
    await unlink(filePath);
  }

  /** @deprecated readFile/readFileAsStream を使用してください */
  getAbsolutePath(relativePath: string): string {
    return join(this.storagePath, relativePath);
  }
}
