export type { FileStorage, SaveFileResult } from './file-storage.js';
export type {
  ImageAttribute,
  ImageAttributeRepository,
  CreateImageAttributeInput,
  UpdateImageAttributeInput,
} from './image-attribute-repository.js';
export type {
  ImageMetadata,
  ImageProcessor,
  ThumbnailResult,
} from './image-processor.js';
export type {
  Image,
  ImageRepository,
  CreateImageInput,
} from './image-repository.js';
export type {
  Label,
  LabelRepository,
  CreateLabelInput,
  UpdateLabelInput,
} from './label-repository.js';
export type { ArchiveEntry, ArchiveHandler } from './archive-handler.js';
export type {
  ArchiveSession,
  ArchiveSessionManager,
  CreateSessionInput,
  CreateSessionResult,
} from './archive-session-manager.js';
export type {
  EmbeddingResult,
  EmbeddingService,
} from './embedding-service.js';
export type {
  EmbeddingRepository,
  SimilarityResult,
} from './embedding-repository.js';
export { EMBEDDING_DIMENSION } from './embedding-repository.js';
export type {
  CaptionResult,
  CaptionService,
} from './caption-service.js';
