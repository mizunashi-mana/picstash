/** View history record */
export interface ViewHistory {
  id: string;
  imageId: string;
  viewedAt: Date;
  /** Viewing duration in milliseconds */
  duration: number | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Input for creating a view history record */
export interface CreateViewHistoryInput {
  imageId: string;
}

/** Input for updating view history duration */
export interface UpdateViewHistoryDurationInput {
  /** Duration in milliseconds */
  duration: number;
}

/** View history with image info for display */
export interface ViewHistoryWithImage extends ViewHistory {
  image: {
    id: string;
    filename: string;
    thumbnailPath: string | null;
  };
}

/** Image view statistics */
export interface ImageViewStats {
  viewCount: number;
  totalDuration: number;
  lastViewedAt: Date | null;
}
