import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '@/config.js';

const currentDir = dirname(fileURLToPath(import.meta.url));
const storagePath = resolve(currentDir, '../../..', config.storage.path);
const originalsPath = join(storagePath, 'originals');

export interface SaveFileResult {
  filename: string;
  path: string;
}

/**
 * Generate a unique filename with the given extension
 */
function generateFilename(extension: string): string {
  const uuid = randomUUID();
  return `${uuid}${extension}`;
}

/**
 * Ensure the storage directory exists
 */
async function ensureDirectory(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}

/**
 * Save a file to the originals directory
 */
export async function saveOriginal(
  buffer: Buffer,
  extension: string,
): Promise<SaveFileResult> {
  await ensureDirectory(originalsPath);

  const filename = generateFilename(extension);
  const filePath = join(originalsPath, filename);

  await writeFile(filePath, buffer);

  return {
    filename,
    path: `originals/${filename}`,
  };
}

/**
 * Delete a file from storage
 */
export async function deleteFile(relativePath: string): Promise<void> {
  const filePath = join(storagePath, relativePath);
  await unlink(filePath);
}

/**
 * Get the absolute path for a relative storage path
 */
export function getAbsolutePath(relativePath: string): string {
  return join(storagePath, relativePath);
}

/**
 * Get the storage base path
 */
export function getStoragePath(): string {
  return storagePath;
}
