import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir, unlink } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';
import { Transform } from 'node:stream';
import { pipeline as pipelinePromise } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import { injectable, multiInject } from 'inversify';
import { config } from '@/config.js';
import { TYPES } from '@/infra/di/types.js';
import type { ArchiveHandler } from '@/application/ports/archive-handler.js';
import type {
  ArchiveSession,
  ArchiveSessionManager,
  CreateSessionInput,
  CreateSessionResult,
} from '@/application/ports/archive-session-manager.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const storagePath = resolve(__dirname, '../../..', config.storage.path);
const tempPath = join(storagePath, 'temp');

// Maximum archive file size: 500MB
const MAX_ARCHIVE_SIZE = 500 * 1024 * 1024;

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];

function isImageFile(filename: string): boolean {
  const ext = extname(filename).toLowerCase();
  return IMAGE_EXTENSIONS.includes(ext);
}

function isSafePath(path: string): boolean {
  // Reject paths with directory traversal attempts
  const normalizedPath = path.replace(/\\/g, '/');
  return !normalizedPath.includes('../') && !normalizedPath.startsWith('/');
}

function createSizeLimitedStream(maxSize: number): Transform {
  let totalSize = 0;
  return new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      totalSize += chunk.length;
      if (totalSize > maxSize) {
        callback(new Error('FILE_TOO_LARGE'));
        return;
      }
      callback(null, chunk);
    },
  });
}

@injectable()
export class InMemoryArchiveSessionManager implements ArchiveSessionManager {
  private sessions = new Map<string, ArchiveSession>();

  constructor(
    @multiInject(TYPES.ArchiveHandler) private handlers: ArchiveHandler[],
  ) {}

  private async ensureTempDirectory(): Promise<void> {
    await mkdir(tempPath, { recursive: true });
  }

  private findHandler(
    filePath: string,
    mimeType: string,
  ): ArchiveHandler | undefined {
    return this.handlers.find(h => h.canHandle(filePath, mimeType));
  }

  async createSession(input: CreateSessionInput): Promise<CreateSessionResult> {
    const { filename, mimeType, stream } = input;

    const handler = this.findHandler(filename, mimeType);
    if (handler == null) {
      return {
        success: false,
        error: 'UNSUPPORTED_FORMAT',
        message: `Unsupported archive format: ${mimeType}`,
      };
    }

    const archiveType = handler.archiveType;

    await this.ensureTempDirectory();

    const sessionId = randomUUID();
    const ext = extname(filename);
    const archivePath = join(tempPath, `${sessionId}${ext}`);

    const writeStream = createWriteStream(archivePath);
    const sizeLimitedStream = createSizeLimitedStream(MAX_ARCHIVE_SIZE);
    try {
      await pipelinePromise(stream, sizeLimitedStream, writeStream);
    }
    catch (error) {
      await unlink(archivePath).catch(() => {});
      if (error instanceof Error && error.message === 'FILE_TOO_LARGE') {
        return {
          success: false,
          error: 'FILE_TOO_LARGE',
          message: `Archive file exceeds maximum size of ${MAX_ARCHIVE_SIZE / 1024 / 1024}MB`,
        };
      }
      throw error;
    }

    const allEntries = await handler.listEntries(archivePath);
    const imageEntries = allEntries.filter(
      entry =>
        !entry.isDirectory && isImageFile(entry.filename) && isSafePath(entry.path),
    );

    if (imageEntries.length === 0) {
      await unlink(archivePath).catch(() => {});
      return {
        success: false,
        error: 'EMPTY_ARCHIVE',
        message: 'No image files found in the archive',
      };
    }

    const session: ArchiveSession = {
      id: sessionId,
      filename,
      archivePath,
      archiveType,
      imageEntries,
      createdAt: new Date(),
    };

    this.sessions.set(sessionId, session);

    return { success: true, session };
  }

  getSession(sessionId: string): ArchiveSession | undefined {
    return this.sessions.get(sessionId);
  }

  async extractImage(sessionId: string, entryIndex: number): Promise<Buffer> {
    const session = this.sessions.get(sessionId);
    if (session == null) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const entry = session.imageEntries.find(e => e.index === entryIndex);
    if (entry == null) {
      throw new Error(`Entry ${entryIndex} not found in session ${sessionId}`);
    }

    const handler = this.findHandler(session.archivePath, '');
    if (handler == null) {
      throw new Error(`No handler found for session ${sessionId}`);
    }

    return handler.extractEntry(session.archivePath, entryIndex);
  }

  async deleteSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session == null) {
      return;
    }

    await unlink(session.archivePath).catch(() => {});
    this.sessions.delete(sessionId);
  }
}
