/* eslint-disable no-console, n/no-process-exit -- CLI command */
/**
 * CLI command for generating embeddings for labels.
 *
 * Usage:
 *   npm run label:embedding:generate     # Generate for all labels without embeddings
 *   npm run label:embedding:regenerate   # Regenerate all label embeddings
 *   npm run label:embedding:status       # Show embedding status
 *
 * Options:
 *   --config <path>                      # Specify config file path
 */

import {
  generateMissingLabelEmbeddings,
  regenerateAllLabelEmbeddings,
  type GenerateLabelEmbeddingDeps,
  type PrismaService,
} from '@picstash/core';
import { initConfig, parseCliArgs } from '@/config.js';
import { type AppContainer, buildAppContainer } from '@/infra/di/index.js';

interface CliDeps extends GenerateLabelEmbeddingDeps {
  prismaService: PrismaService;
}

function getDeps(container: AppContainer): CliDeps {
  return {
    labelRepository: container.getLabelRepository(),
    embeddingService: container.getEmbeddingService(),
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
      case 'regenerate':
        await runRegenerate(deps);
        break;
      case 'status':
        await runStatus(deps);
        break;
      default:
        console.error(`Unknown command: ${command}`);
        console.error('Available commands: generate, regenerate, status');
        process.exit(1);
    }
  }
  finally {
    await deps.prismaService.disconnect();
  }
}

async function runGenerate(deps: GenerateLabelEmbeddingDeps): Promise<void> {
  console.log('Generating embeddings for labels without embeddings...');

  // Warm up the model
  console.log('Loading CLIP model (this may take a moment on first run)...');
  await deps.embeddingService.initialize();
  console.log('Model ready.');

  const result = await generateMissingLabelEmbeddings(deps, {
    onProgress: (current, total, labelName) => {
      process.stdout.write(`\rProgress: ${current}/${total} - ${labelName}`);
    },
  });

  console.log('\n');
  console.log('=== Generation Complete ===');
  console.log(`Total labels: ${result.total}`);
  console.log(`Successful: ${result.success}`);
  console.log(`Failed: ${result.failed}`);

  if (result.errors.length > 0) {
    console.log('\nErrors:');
    for (const error of result.errors) {
      console.log(`  - ${error.labelName} (${error.labelId}): ${error.error}`);
    }
  }
}

async function runRegenerate(deps: GenerateLabelEmbeddingDeps): Promise<void> {
  console.log('Regenerating all label embeddings...');
  console.log('This will clear existing embeddings and regenerate from scratch.');

  // Warm up the model
  console.log('Loading CLIP model (this may take a moment on first run)...');
  await deps.embeddingService.initialize();
  console.log('Model ready.');

  const result = await regenerateAllLabelEmbeddings(deps, {
    onProgress: (current, total, labelName) => {
      process.stdout.write(`\rProgress: ${current}/${total} - ${labelName}`);
    },
  });

  console.log('\n');
  console.log('=== Regeneration Complete ===');
  console.log(`Total labels: ${result.total}`);
  console.log(`Successful: ${result.success}`);
  console.log(`Failed: ${result.failed}`);

  if (result.errors.length > 0) {
    console.log('\nErrors:');
    for (const error of result.errors) {
      console.log(`  - ${error.labelName} (${error.labelId}): ${error.error}`);
    }
  }
}

async function runStatus(deps: GenerateLabelEmbeddingDeps): Promise<void> {
  const labelRepository = deps.labelRepository;

  const allLabels = await labelRepository.findAll();
  const labelsWithEmbedding = await labelRepository.countWithEmbedding();

  console.log('=== Label Embedding Status ===');
  console.log(`Total labels: ${allLabels.length}`);
  console.log(`Labels with embedding: ${labelsWithEmbedding}`);
  console.log(`Labels without embedding: ${allLabels.length - labelsWithEmbedding}`);

  if (labelsWithEmbedding < allLabels.length) {
    console.log('\n[Info] Run "generate" to create embeddings for remaining labels.');
  }
}

main().catch((error: unknown) => {
  console.error('Error:', error);
  process.exit(1);
});
