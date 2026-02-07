export const TYPES = {
  // Config
  Config: Symbol.for('Config'),

  // Database
  DatabaseService: Symbol.for('DatabaseService'),

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
  SearchHistoryRepository: Symbol.for('SearchHistoryRepository'),

  // Storage & Processing
  FileStorage: Symbol.for('FileStorage'),
  ImageProcessor: Symbol.for('ImageProcessor'),

  // Archive
  ArchiveHandler: Symbol.for('ArchiveHandler'),
  ArchiveSessionManager: Symbol.for('ArchiveSessionManager'),

  // URL Crawl
  UrlCrawlSessionManager: Symbol.for('UrlCrawlSessionManager'),

  // AI/Embedding
  EmbeddingService: Symbol.for('EmbeddingService'),
  EmbeddingRepository: Symbol.for('EmbeddingRepository'),
  CaptionService: Symbol.for('CaptionService'),
  LlmService: Symbol.for('LlmService'),
  OcrService: Symbol.for('OcrService'),

  // Job Queue
  JobQueue: Symbol.for('JobQueue'),
} as const;
