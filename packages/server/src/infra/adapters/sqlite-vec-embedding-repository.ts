/**
 * sqlite-vec based implementation of EmbeddingRepository.
 */

import 'reflect-metadata';
import { EMBEDDING_DIMENSION, TYPES } from '@picstash/core';
import Database from 'better-sqlite3';
import { inject, injectable } from 'inversify';
import * as sqliteVec from 'sqlite-vec';
import type { EmbeddingRepository, SimilarityResult, CoreConfig } from '@picstash/core';

@injectable()
export class SqliteVecEmbeddingRepository implements EmbeddingRepository {
  private readonly db: Database.Database;

  constructor(@inject(TYPES.Config) config: CoreConfig) {
    this.db = new Database(config.database.path);

    // Load sqlite-vec extension
    sqliteVec.load(this.db);

    // Improve concurrent access with Prisma connection:
    // - Use WAL mode for better read/write concurrency
    // - Set a busy timeout so we wait briefly instead of failing with "database is locked"
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('busy_timeout = 5000');

    // Initialize the vector search virtual table if it doesn't exist
    this.initializeVectorTable();
  }

  /**
   * Initialize the virtual table for vector search.
   * This table mirrors the Image table's embeddings for fast k-NN search.
   */
  private initializeVectorTable(): void {
    const tableExists = this.db
      .prepare(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='vec_images'`,
      )
      .get();

    if (tableExists === undefined) {
      this.db.exec(`
        CREATE VIRTUAL TABLE vec_images USING vec0(
          image_id TEXT PRIMARY KEY,
          embedding FLOAT[${EMBEDDING_DIMENSION}]
        )
      `);
    }
  }

  upsert(imageId: string, embedding: Float32Array): void {
    if (embedding.length !== EMBEDDING_DIMENSION) {
      throw new Error(
        `Embedding dimension mismatch: expected ${EMBEDDING_DIMENSION}, got ${embedding.length}`,
      );
    }

    // Delete existing entry if any (vec0 doesn't support UPSERT)
    this.db.prepare('DELETE FROM vec_images WHERE image_id = ?').run(imageId);

    // Insert new embedding
    // sqlite-vec expects embedding as a Buffer (raw bytes of Float32Array)
    // Use byteOffset and byteLength to handle views into larger ArrayBuffers
    const embeddingBuffer = Buffer.from(
      embedding.buffer,
      embedding.byteOffset,
      embedding.byteLength,
    );
    this.db
      .prepare('INSERT INTO vec_images (image_id, embedding) VALUES (?, ?)')
      .run(imageId, embeddingBuffer);
  }

  remove(imageId: string): void {
    this.db.prepare('DELETE FROM vec_images WHERE image_id = ?').run(imageId);
  }

  findSimilar(
    queryEmbedding: Float32Array,
    limit = 10,
    excludeImageIds: string[] = [],
  ): SimilarityResult[] {
    if (queryEmbedding.length !== EMBEDDING_DIMENSION) {
      throw new Error(
        `Embedding dimension mismatch: expected ${EMBEDDING_DIMENSION}, got ${queryEmbedding.length}`,
      );
    }

    // Use byteOffset and byteLength to handle views into larger ArrayBuffers
    const embeddingBuffer = Buffer.from(
      queryEmbedding.buffer,
      queryEmbedding.byteOffset,
      queryEmbedding.byteLength,
    );

    // sqlite-vec uses MATCH for k-NN search with ORDER BY distance
    // We fetch extra results to account for exclusions
    const fetchLimit = limit + excludeImageIds.length;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- better-sqlite3 returns unknown type
    const results = this.db
      .prepare(
        `
        SELECT image_id, distance
        FROM vec_images
        WHERE embedding MATCH ?
        ORDER BY distance
        LIMIT ?
      `,
      )
      .all(embeddingBuffer, fetchLimit) as Array<{
      image_id: string;
      distance: number;
    }>;

    // Filter out excluded images and limit results
    const excludeSet = new Set(excludeImageIds);
    return results
      .filter(r => !excludeSet.has(r.image_id))
      .slice(0, limit)
      .map(r => ({
        imageId: r.image_id,
        distance: r.distance,
      }));
  }

  count(): number {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- better-sqlite3 returns unknown type
    const result = this.db
      .prepare('SELECT COUNT(*) as count FROM vec_images')
      .get() as { count: number };
    return result.count;
  }

  getAllImageIds(): string[] {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- better-sqlite3 returns unknown type
    const results = this.db
      .prepare('SELECT image_id FROM vec_images')
      .all() as Array<{ image_id: string }>;
    return results.map(r => r.image_id);
  }

  /**
   * Check if an image has an embedding in the vector table.
   */
  hasEmbedding(imageId: string): boolean {
    const result = this.db
      .prepare('SELECT 1 FROM vec_images WHERE image_id = ? LIMIT 1')
      .get(imageId);
    return result !== undefined;
  }

  close(): void {
    this.db.close();
  }
}
