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
  type GenerateEmbeddingDeps,
} from '@/application/embedding/generate-embedding.js';
import { connectDatabase, disconnectDatabase } from '@/infra/database/prisma.js';
import { container } from '@/infra/di/container.js';
import { TYPES } from '@/infra/di/types.js';
import type { EmbeddingRepository } from '@/application/ports/embedding-repository.js';
import type { EmbeddingService } from '@/application/ports/embedding-service.js';
import type { FileStorage } from '@/application/ports/file-storage.js';
import type { ImageRepository } from '@/application/ports/image-repository.js';

function getDeps(): GenerateEmbeddingDeps {
  return {
    imageRepository: container.get<ImageRepository>(TYPES.ImageRepository),
    fileStorage: container.get<FileStorage>(TYPES.FileStorage),
    embeddingService: container.get<EmbeddingService>(TYPES.EmbeddingService),
    embeddingRepository: container.get<EmbeddingRepository>(TYPES.EmbeddingRepository),
  };
}

async function main(): Promise<void> {
  const command = process.argv[2] ?? 'generate';

  console.log('Connecting to database...');
  await connectDatabase();

  const deps = getDeps();

  try {
    switch (command) {
      case 'generate':
        await runGenerate(deps);
        break;
      case 'sync':
        await runSync(deps);
        break;
      case 'regenerate':
        await runRegenerate(deps);
        break;
      case 'status':
        await runStatus(deps);
        break;
      default:
        console.error(`Unknown command: ${command}`);
        console.error('Available commands: generate, sync, regenerate, status');
        process.exit(1);
    }
  }
  finally {
    deps.embeddingRepository.close();
    await disconnectDatabase();
  }
}

async function runGenerate(deps: GenerateEmbeddingDeps): Promise<void> {
  console.log('Generating embeddings for images without embeddings...');

  // Warm up the model
  console.log('Loading CLIP model (this may take a moment on first run)...');
  await deps.embeddingService.initialize();
  console.log('Model ready.');

  const result = await generateMissingEmbeddings(deps, {
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

async function runSync(deps: GenerateEmbeddingDeps): Promise<void> {
  console.log('Syncing embeddings from Prisma to vector database...');

  const result = await syncEmbeddingsToVectorDb({
    imageRepository: deps.imageRepository,
    embeddingRepository: deps.embeddingRepository,
  });

  console.log('=== Sync Complete ===');
  console.log(`Synced: ${result.synced}`);
  console.log(`Skipped: ${result.skipped}`);
}

async function runRegenerate(deps: GenerateEmbeddingDeps): Promise<void> {
  console.log('Regenerating all embeddings...');
  console.log('This will clear existing embeddings and regenerate from scratch.');

  // Clear all embeddings
  await deps.imageRepository.clearAllEmbeddings();

  await runGenerate(deps);
}

async function runStatus(deps: GenerateEmbeddingDeps): Promise<void> {
  const totalImages = await deps.imageRepository.count();
  const imagesWithEmbedding = await deps.imageRepository.countWithEmbedding();
  const vectorDbCount = deps.embeddingRepository.count();

  console.log('=== Embedding Status ===');
  console.log(`Total images: ${totalImages}`);
  console.log(`Images with embedding (Prisma): ${imagesWithEmbedding}`);
  console.log(`Embeddings in vector DB: ${vectorDbCount}`);
  console.log(`Images without embedding: ${totalImages - imagesWithEmbedding}`);

  if (imagesWithEmbedding !== vectorDbCount) {
    console.log('\n[Warning] Prisma and vector DB counts differ. Run "sync" to fix.');
  }
}

main().catch((error: unknown) => {
  console.error('Error:', error);
  process.exit(1);
});
