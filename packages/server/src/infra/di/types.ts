export const TYPES = {
  // Repositories
  ImageRepository: Symbol.for('ImageRepository'),
  LabelRepository: Symbol.for('LabelRepository'),
  ImageAttributeRepository: Symbol.for('ImageAttributeRepository'),

  // Storage & Processing
  FileStorage: Symbol.for('FileStorage'),
  ImageProcessor: Symbol.for('ImageProcessor'),

  // Archive
  ArchiveHandler: Symbol.for('ArchiveHandler'),
  ArchiveSessionManager: Symbol.for('ArchiveSessionManager'),

  // AI/Embedding
  EmbeddingService: Symbol.for('EmbeddingService'),
} as const;
