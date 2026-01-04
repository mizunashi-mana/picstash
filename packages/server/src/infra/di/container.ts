import 'reflect-metadata';
import { Container } from 'inversify';
import {
  LocalFileStorage,
  PrismaImageAttributeRepository,
  PrismaImageRepository,
  PrismaLabelRepository,
  SharpImageProcessor,
} from '@/infra/adapters/index.js';
import { TYPES } from './types.js';
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

export { container };
