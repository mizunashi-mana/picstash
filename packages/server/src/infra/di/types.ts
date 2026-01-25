export const TYPES = {
  // Config
  Config: Symbol.for('Config'),

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

  // Controllers
  ImageController: Symbol.for('ImageController'),
  ImageAttributeController: Symbol.for('ImageAttributeController'),
  LabelController: Symbol.for('LabelController'),
  CollectionController: Symbol.for('CollectionController'),
  ArchiveController: Symbol.for('ArchiveController'),
  ViewHistoryController: Symbol.for('ViewHistoryController'),
  RecommendationController: Symbol.for('RecommendationController'),
  RecommendationConversionController: Symbol.for('RecommendationConversionController'),
  StatsController: Symbol.for('StatsController'),
  SearchController: Symbol.for('SearchController'),
  UrlCrawlController: Symbol.for('UrlCrawlController'),
  JobController: Symbol.for('JobController'),
} as const;
