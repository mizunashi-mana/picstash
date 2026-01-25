/**
 * sqlite-vec integration for vector similarity search
 *
 * This module provides vector search capabilities using the sqlite-vec extension.
 * It creates a virtual table for efficient k-NN search on image embeddings.
 */

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import * as sqliteVec from 'sqlite-vec';

const currentDir = dirname(fileURLToPath(import.meta.url));

/** CLIP embedding dimension (ViT-B/16 model) */
export const EMBEDDING_DIMENSION = 512;

let db: Database.Database | null = null;

/**
 * Get the sqlite-vec enabled database connection.
 * Creates and initializes the connection on first call.
 */
export function getVectorDb(): Database.Database {
  if (db) {
    return db;
  }

  const dbPath = resolve(currentDir, '../../..', 'prisma/data/picstash.db');
  db = new Database(dbPath);

  // Load sqlite-vec extension
  sqliteVec.load(db);

  // Improve concurrent access with Prisma connection:
  // - Use WAL mode for better read/write concurrency
  // - Set a busy timeout so we wait briefly instead of failing with "database is locked"
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('busy_timeout = 5000');

  // Initialize the vector search virtual table if it doesn't exist
  initializeVectorTable(db);

  return db;
}

/**
 * Initialize the virtual table for vector search.
 * This table mirrors the Image table's embeddings for fast k-NN search.
 */
function initializeVectorTable(database: Database.Database): void {
  // Check if virtual table exists
  const tableExists = database
    .prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='vec_images'`,
    )
    .get();

  if (tableExists === undefined) {
    // Create virtual table for vector search
    // vec0 is the virtual table module provided by sqlite-vec
    database.exec(`
      CREATE VIRTUAL TABLE vec_images USING vec0(
        image_id TEXT PRIMARY KEY,
        embedding FLOAT[${EMBEDDING_DIMENSION}]
      )
    `);
  }
}

/**
 * Insert or update an embedding in the vector search table.
 */
export function upsertEmbedding(
  imageId: string,
  embedding: Float32Array,
): void {
  const database = getVectorDb();

  if (embedding.length !== EMBEDDING_DIMENSION) {
    throw new Error(
      `Embedding dimension mismatch: expected ${EMBEDDING_DIMENSION}, got ${embedding.length}`,
    );
  }

  // Delete existing entry if any (vec0 doesn't support UPSERT)
  database.prepare('DELETE FROM vec_images WHERE image_id = ?').run(imageId);

  // Insert new embedding
  // sqlite-vec expects embedding as a Buffer (raw bytes of Float32Array)
  // Use byteOffset and byteLength to handle views into larger ArrayBuffers
  const embeddingBuffer = Buffer.from(
    embedding.buffer,
    embedding.byteOffset,
    embedding.byteLength,
  );
  database
    .prepare('INSERT INTO vec_images (image_id, embedding) VALUES (?, ?)')
    .run(imageId, embeddingBuffer);
}

/**
 * Remove an embedding from the vector search table.
 */
export function deleteEmbedding(imageId: string): void {
  const database = getVectorDb();
  database.prepare('DELETE FROM vec_images WHERE image_id = ?').run(imageId);
}

/**
 * Result of a similarity search
 */
export interface SimilarityResult {
  imageId: string;
  distance: number;
}

/**
 * Find similar images using k-NN search.
 *
 * @param queryEmbedding - The embedding to search for
 * @param limit - Maximum number of results to return
 * @param excludeImageIds - Image IDs to exclude from results (e.g., the query image itself)
 * @returns Array of similar images sorted by distance (ascending)
 */
export function findSimilarImages(
  queryEmbedding: Float32Array,
  limit: number = 10,
  excludeImageIds: string[] = [],
): SimilarityResult[] {
  const database = getVectorDb();

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
  const results = database
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

/**
 * Close the database connection.
 * Should be called during application shutdown.
 */
export function closeVectorDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * Get the count of embeddings in the vector table.
 */
export function getEmbeddingCount(): number {
  const database = getVectorDb();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- better-sqlite3 returns unknown type
  const result = database
    .prepare('SELECT COUNT(*) as count FROM vec_images')
    .get() as { count: number };
  return result.count;
}

/**
 * Check if an image has an embedding in the vector table.
 */
export function hasEmbedding(imageId: string): boolean {
  const database = getVectorDb();
  const result = database
    .prepare('SELECT 1 FROM vec_images WHERE image_id = ? LIMIT 1')
    .get(imageId);
  return result !== undefined;
}

/**
 * Get all image IDs that have embeddings.
 */
export function getAllImageIds(): string[] {
  const database = getVectorDb();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- better-sqlite3 returns unknown type
  const results = database
    .prepare('SELECT image_id FROM vec_images')
    .all() as Array<{ image_id: string }>;
  return results.map(r => r.image_id);
}
