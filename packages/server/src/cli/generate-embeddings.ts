/* eslint-disable no-console, n/no-process-exit -- CLI command */
/**
 * CLI command for generating embeddings for existing images.
 *
 * Usage:
 *   npm run embedding:generate        # Generate for all images without embeddings
 *   npm run embedding:sync            # Sync embeddings from Prisma to vector DB
 *   npm run embedding:regenerate      # Regenerate all embeddings
 *   npm run embedding:status          # Show embedding status
 *
 * Options:
 *   --config <path>                   # Specify config file path
 */

import {
  generateMissingEmbeddings,
  syncEmbeddingsToVectorDb,
  type GenerateEmbeddingDeps,
  type PrismaService,
} from '@picstash/core';
import { initConfig, parseCliArgs } from '@/config.js';
import { type AppContainer, buildAppContainer } from '@/infra/di/index.js';

interface CliDeps extends GenerateEmbeddingDeps {
  prismaService: PrismaService;
}

function getDeps(container: AppContainer): CliDeps {
  return {
    imageRepository: container.getImageRepository(),
    fileStorage: container.getFileStorage(),
    embeddingService: container.getEmbeddingService(),
    embeddingRepository: container.getEmbeddingRepository(),
    prismaService: container.getPrismaService(),
  };
}

async function main(): Promise<void> {
  const { command, configPath } = parseCliArgs(process.argv);

  // Initialize configuration
  const config = initConfig(configPath);
  const container = await buildAppContainer(config);
  const deps = getDeps(container);

  console.log('Connecting to database...');
  await deps.prismaService.connect();

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
    await deps.prismaService.disconnect();
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
