export const TYPES = {
  // Repositories
  ImageRepository: Symbol.for('ImageRepository'),
  LabelRepository: Symbol.for('LabelRepository'),
  ImageAttributeRepository: Symbol.for('ImageAttributeRepository'),
  CollectionRepository: Symbol.for('CollectionRepository'),
  ViewHistoryRepository: Symbol.for('ViewHistoryRepository'),
  RecommendationConversionRepository: Symbol.for(
    'RecommendationConversionRepository',
  ),
  StatsRepository: Symbol.for('StatsRepository'),

  // Storage & Processing
  FileStorage: Symbol.for('FileStorage'),
  ImageProcessor: Symbol.for('ImageProcessor'),

  // Archive
  ArchiveHandler: Symbol.for('ArchiveHandler'),
  ArchiveSessionManager: Symbol.for('ArchiveSessionManager'),

  // AI/Embedding
  EmbeddingService: Symbol.for('EmbeddingService'),
  EmbeddingRepository: Symbol.for('EmbeddingRepository'),
  CaptionService: Symbol.for('CaptionService'),
} as const;
