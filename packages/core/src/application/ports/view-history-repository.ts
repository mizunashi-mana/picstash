import type {
  ViewHistory,
  ViewHistoryWithImage,
  CreateViewHistoryInput,
  UpdateViewHistoryDurationInput,
  ImageViewStats,
} from '../../domain/view-history/index.js';

// Re-export domain types for convenience
export type {
  ViewHistory,
  ViewHistoryWithImage,
  CreateViewHistoryInput,
  UpdateViewHistoryDurationInput,
  ImageViewStats,
};

/** Pagination options for view history list */
export interface ViewHistoryListOptions {
  limit?: number;
  offset?: number;
}

export interface ViewHistoryRepository {
  /** Create a new view history record (marks view start) */
  create: (input: CreateViewHistoryInput) => Promise<ViewHistory>;

  /** Find view history by ID */
  findById: (id: string) => Promise<ViewHistory | null>;

  /** Update view history duration (marks view end) */
  updateDuration: (
    id: string,
    input: UpdateViewHistoryDurationInput,
  ) => Promise<ViewHistory>;

  /** Get recent view history with image info */
  findRecentWithImages: (
    options?: ViewHistoryListOptions,
  ) => Promise<ViewHistoryWithImage[]>;

  /** Get view statistics for a specific image */
  getImageStats: (imageId: string) => Promise<ImageViewStats>;

  /** Delete view history by ID */
  deleteById: (id: string) => Promise<void>;
}
