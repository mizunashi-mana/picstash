import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { injectable } from 'inversify';
import { config } from '@/config.js';
import type {
  FileStorage,
  SaveFileResult,
} from '@/application/ports/file-storage.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const storagePath = resolve(__dirname, '../../..', config.storage.path);
const originalsPath = join(storagePath, 'originals');

@injectable()
export class LocalFileStorage implements FileStorage {
  private generateFilename(extension: string): string {
    const uuid = randomUUID();
    return `${uuid}${extension}`;
  }

  private async ensureDirectory(dir: string): Promise<void> {
    await mkdir(dir, { recursive: true });
  }

  async saveOriginal(buffer: Buffer, extension: string): Promise<SaveFileResult> {
    await this.ensureDirectory(originalsPath);

    const filename = this.generateFilename(extension);
    const filePath = join(originalsPath, filename);

    await writeFile(filePath, buffer);

    return {
      filename,
      path: `originals/${filename}`,
    };
  }

  async deleteFile(relativePath: string): Promise<void> {
    const filePath = join(storagePath, relativePath);
    await unlink(filePath);
  }

  getAbsolutePath(relativePath: string): string {
    return join(storagePath, relativePath);
  }
}
