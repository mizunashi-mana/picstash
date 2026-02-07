import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { access, mkdir, stat, readFile, unlink, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
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

  /**
   * Sanitize filename to prevent path traversal attacks.
   * Extracts only the base filename, removing any directory components.
   */
  private sanitizeFilename(filename: string): string {
    // Use basename to strip any directory components (including ../)
    return basename(filename);
  }

  /**
   * Resolve and validate a relative path to ensure it stays within storagePath.
   * Throws an error if the path would escape the storage directory.
   */
  private resolveAndValidatePath(relativePath: string): string {
    const absolutePath = resolve(this.storagePath, relativePath);
    const normalizedStoragePath = resolve(this.storagePath);

    // Ensure the resolved path starts with the storage path
    if (!absolutePath.startsWith(normalizedStoragePath + '/') && absolutePath !== normalizedStoragePath) {
      throw new Error('Path traversal detected: path escapes storage directory');
    }

    return absolutePath;
  }

  async saveFile(
    stream: Readable,
    options: SaveFileOptions,
  ): Promise<SaveFileResult> {
    const categoryPath = this.getCategoryPath(options.category);
    await this.ensureDirectory(categoryPath);

    // Sanitize filename to prevent path traversal
    const filename = options.filename !== undefined
      ? this.sanitizeFilename(options.filename)
      : this.generateFilename(options.extension);
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

    // Sanitize filename to prevent path traversal
    const filename = options.filename !== undefined
      ? this.sanitizeFilename(options.filename)
      : this.generateFilename(options.extension);
    const filePath = join(categoryPath, filename);

    try {
      await writeFile(filePath, buffer);
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

  async readFile(relativePath: string): Promise<Buffer> {
    const filePath = this.resolveAndValidatePath(relativePath);
    return await readFile(filePath);
  }

  async readFileAsStream(relativePath: string): Promise<Readable> {
    const filePath = this.resolveAndValidatePath(relativePath);
    return await Promise.resolve(createReadStream(filePath));
  }

  async getFileSize(relativePath: string): Promise<number> {
    const filePath = this.resolveAndValidatePath(relativePath);
    const fileStat = await stat(filePath);
    return fileStat.size;
  }

  async fileExists(relativePath: string): Promise<boolean> {
    const filePath = this.resolveAndValidatePath(relativePath);
    try {
      await access(filePath);
      return true;
    }
    catch {
      return false;
    }
  }

  async deleteFile(relativePath: string): Promise<void> {
    const filePath = this.resolveAndValidatePath(relativePath);
    await unlink(filePath);
  }
}
