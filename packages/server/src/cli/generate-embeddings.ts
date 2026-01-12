/* eslint-disable no-console, n/no-process-exit -- CLI command */
/**
 * CLI command for generating embeddings for existing images.
 *
 * Usage:
 *   npm run embedding:generate        # Generate for all images without embeddings
 *   npm run embedding:sync            # Sync embeddings from Prisma to vector DB
 *   npm run embedding:regenerate      # Regenerate all embeddings
 */

import {
  generateMissingEmbeddings,
  syncEmbeddingsToVectorDb,
} from '@/application/embedding/generate-embedding.js';
import { connectDatabase, disconnectDatabase, prisma } from '@/infra/database/prisma.js';
import { closeVectorDb, getEmbeddingCount } from '@/infra/database/sqlite-vec.js';
import { container } from '@/infra/di/container.js';
import { TYPES } from '@/infra/di/types.js';
import type { EmbeddingService } from '@/application/ports/embedding-service.js';

async function main(): Promise<void> {
  const command = process.argv[2] ?? 'generate';

  console.log('Connecting to database...');
  await connectDatabase();

  try {
    switch (command) {
      case 'generate':
        await runGenerate();
        break;
      case 'sync':
        await runSync();
        break;
      case 'regenerate':
        await runRegenerate();
        break;
      case 'status':
        await runStatus();
        break;
      default:
        console.error(`Unknown command: ${command}`);
        console.error('Available commands: generate, sync, regenerate, status');
        process.exit(1);
    }
  }
  finally {
    closeVectorDb();
    await disconnectDatabase();
  }
}

async function runGenerate(): Promise<void> {
  console.log('Generating embeddings for images without embeddings...');

  // Warm up the model
  const embeddingService = container.get<EmbeddingService>(TYPES.EmbeddingService);
  console.log('Loading CLIP model (this may take a moment on first run)...');
  await embeddingService.initialize();
  console.log('Model ready.');

  const result = await generateMissingEmbeddings({
    onProgress: (current, total) => {
      process.stdout.write(`\rProgress: ${current}/${total}`);
    },
  });

  console.log('\n');
  console.log('=== Generation Complete ===');
  console.log(`Total images: ${result.total}`);
  console.log(`Successful: ${result.success}`);
  console.log(`Failed: ${result.failed}`);

  if (result.errors.length > 0) {
    console.log('\nErrors:');
    for (const error of result.errors) {
      console.log(`  - ${error.imageId}: ${error.error}`);
    }
  }
}

async function runSync(): Promise<void> {
  console.log('Syncing embeddings from Prisma to vector database...');

  const result = await syncEmbeddingsToVectorDb();

  console.log('=== Sync Complete ===');
  console.log(`Synced: ${result.synced}`);
  console.log(`Skipped: ${result.skipped}`);
}

async function runRegenerate(): Promise<void> {
  console.log('Regenerating all embeddings...');
  console.log('This will clear existing embeddings and regenerate from scratch.');

  // Clear all embeddedAt to force regeneration
  await prisma.image.updateMany({
    data: {
      embedding: null,
      embeddedAt: null,
    },
  });

  await runGenerate();
}

async function runStatus(): Promise<void> {
  const totalImages = await prisma.image.count();
  const imagesWithEmbedding = await prisma.image.count({
    where: { embedding: { not: null } },
  });
  const vectorDbCount = getEmbeddingCount();

  console.log('=== Embedding Status ===');
  console.log(`Total images: ${totalImages}`);
  console.log(`Images with embedding (Prisma): ${imagesWithEmbedding}`);
  console.log(`Embeddings in vector DB: ${vectorDbCount}`);
  console.log(`Images without embedding: ${totalImages - imagesWithEmbedding}`);

  if (imagesWithEmbedding !== vectorDbCount) {
    console.log('\n[Warning] Prisma and vector DB counts differ. Run "sync" to fix.');
  }
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
