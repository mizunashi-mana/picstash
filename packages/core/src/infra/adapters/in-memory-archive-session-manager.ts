import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir, unlink } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';
import { Transform } from 'node:stream';
import { pipeline as pipelinePromise } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import { inject, injectable, multiInject } from 'inversify';
import {
  MAX_ARCHIVE_SIZE,
  filterImageEntries,
} from '../../domain/archive/index.js';
import { TYPES } from '../di/types.js';
import type { ArchiveHandler } from '../../application/ports/archive-handler.js';
import type {
  ArchiveSession,
  ArchiveSessionManager,
  CreateSessionInput,
  CreateSessionResult,
} from '../../application/ports/archive-session-manager.js';
import type { CoreConfig } from '../../config.js';

const currentDir = dirname(fileURLToPath(import.meta.url));

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
  private readonly sessions = new Map<string, ArchiveSession>();
  private readonly tempPath: string;

  constructor(
    @inject(TYPES.Config) config: CoreConfig,
    @multiInject(TYPES.ArchiveHandler) private readonly handlers: ArchiveHandler[],
  ) {
    const storagePath = resolve(currentDir, '../../..', config.storage.path);
    this.tempPath = join(storagePath, 'temp');
  }

  private async ensureTempDirectory(): Promise<void> {
    await mkdir(this.tempPath, { recursive: true });
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
    if (handler === undefined) {
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
    const archivePath = join(this.tempPath, `${sessionId}${ext}`);

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
    // Use domain function to filter image entries
    const imageEntries = filterImageEntries(allEntries);

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
    if (session === undefined) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const entry = session.imageEntries.find(e => e.index === entryIndex);
    if (entry === undefined) {
      throw new Error(`Entry ${entryIndex} not found in session ${sessionId}`);
    }

    const handler = this.findHandler(session.archivePath, '');
    if (handler === undefined) {
      throw new Error(`No handler found for session ${sessionId}`);
    }

    return await handler.extractEntry(session.archivePath, entryIndex);
  }

  async deleteSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session === undefined) {
      return;
    }

    await unlink(session.archivePath).catch(() => {});
    this.sessions.delete(sessionId);
  }
}
