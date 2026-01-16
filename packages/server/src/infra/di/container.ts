import 'reflect-metadata';
import { Container } from 'inversify';
import {
  InMemoryArchiveSessionManager,
  LocalFileStorage,
  PrismaImageAttributeRepository,
  PrismaImageRepository,
  PrismaLabelRepository,
  RarArchiveHandler,
  SharpImageProcessor,
  SqliteVecEmbeddingRepository,
  ZipArchiveHandler,
} from '@/infra/adapters/index.js';
import { TransformersCaptionService } from '@/infra/caption/index.js';
import { ClipEmbeddingService } from '@/infra/embedding/clip-embedding-service.js';
import { TYPES } from './types.js';
import type { ArchiveHandler } from '@/application/ports/archive-handler.js';
import type { ArchiveSessionManager } from '@/application/ports/archive-session-manager.js';
import type { CaptionService } from '@/application/ports/caption-service.js';
import type { EmbeddingRepository } from '@/application/ports/embedding-repository.js';
import type { EmbeddingService } from '@/application/ports/embedding-service.js';
import type { FileStorage } from '@/application/ports/file-storage.js';
import type { ImageAttributeRepository } from '@/application/ports/image-attribute-repository.js';
import type { ImageProcessor } from '@/application/ports/image-processor.js';
import type { ImageRepository } from '@/application/ports/image-repository.js';
import type { LabelRepository } from '@/application/ports/label-repository.js';

const container = new Container();

// Bind repositories as singletons
container
  .bind<ImageRepository>(TYPES.ImageRepository)
  .to(PrismaImageRepository)
  .inSingletonScope();

container
  .bind<LabelRepository>(TYPES.LabelRepository)
  .to(PrismaLabelRepository)
  .inSingletonScope();

container
  .bind<ImageAttributeRepository>(TYPES.ImageAttributeRepository)
  .to(PrismaImageAttributeRepository)
  .inSingletonScope();

// Bind storage & processing as singletons
container
  .bind<FileStorage>(TYPES.FileStorage)
  .to(LocalFileStorage)
  .inSingletonScope();

container
  .bind<ImageProcessor>(TYPES.ImageProcessor)
  .to(SharpImageProcessor)
  .inSingletonScope();

// Bind archive handlers
container.bind<ArchiveHandler>(TYPES.ArchiveHandler).to(ZipArchiveHandler);
container.bind<ArchiveHandler>(TYPES.ArchiveHandler).to(RarArchiveHandler);

container
  .bind<ArchiveSessionManager>(TYPES.ArchiveSessionManager)
  .to(InMemoryArchiveSessionManager)
  .inSingletonScope();

// Bind AI/Embedding services
container
  .bind<EmbeddingService>(TYPES.EmbeddingService)
  .to(ClipEmbeddingService)
  .inSingletonScope();

container
  .bind<EmbeddingRepository>(TYPES.EmbeddingRepository)
  .to(SqliteVecEmbeddingRepository)
  .inSingletonScope();

container
  .bind<CaptionService>(TYPES.CaptionService)
  .to(TransformersCaptionService)
  .inSingletonScope();

export { container };
