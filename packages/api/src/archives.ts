/**
 * Archives API - エンドポイント定義と型
 *
 * client と server で共有するアーカイブインポート関連の API 定義
 */

// ============================================================
// レスポンス型
// ============================================================

/** アーカイブセッション */
export interface ArchiveSession {
  sessionId: string;
  filename: string;
  archiveType: 'zip' | 'rar';
  imageCount: number;
}

/** アーカイブ内画像 */
export interface ArchiveImage {
  index: number;
  filename: string;
  path: string;
  size: number;
}

/** アーカイブセッション詳細 */
export interface ArchiveSessionDetail extends ArchiveSession {
  images: ArchiveImage[];
}

/** インポート結果項目 */
export interface ArchiveImportResultItem {
  index: number;
  success: boolean;
  imageId?: string;
  error?: string;
}

/** インポートジョブステータス値 */
export type ImportJobStatusValue = 'waiting' | 'active' | 'completed' | 'failed';

/** インポートジョブ開始レスポンス */
export interface ImportJobStartResponse {
  jobId: string;
  status: ImportJobStatusValue;
  totalRequested: number;
  message: string;
}

/** インポートジョブステータス */
export interface ImportJobStatus {
  jobId: string;
  status: ImportJobStatusValue;
  progress: number;
  totalRequested: number;
  successCount?: number;
  failedCount?: number;
  results?: ArchiveImportResultItem[];
  error?: string;
}

/** インポート結果 */
export interface ArchiveImportResult {
  totalRequested: number;
  successCount: number;
  failedCount: number;
  results: ArchiveImportResultItem[];
}

// ============================================================
// エンドポイント定義
// ============================================================

/**
 * アーカイブエンドポイント定義
 */
export const archivesEndpoints = {
  /** アーカイブアップロード (POST) */
  upload: '/api/archives' as const,

  /** セッション詳細取得 (GET) / セッション削除 (DELETE) */
  session: (sessionId: string) => `/api/archives/${sessionId}` as const,

  /** ファイルサムネイル取得 */
  fileThumbnail: (sessionId: string, fileIndex: number) =>
    `/api/archives/${sessionId}/files/${fileIndex}/thumbnail` as const,

  /** ファイル画像取得 */
  fileImage: (sessionId: string, fileIndex: number) =>
    `/api/archives/${sessionId}/files/${fileIndex}/file` as const,

  /** インポート実行 (POST) */
  import: (sessionId: string) =>
    `/api/archives/${sessionId}/import` as const,

  /** インポートジョブステータス取得 */
  importJobStatus: (jobId: string) =>
    `/api/import-jobs/${jobId}` as const,

  /**
   * server 側のルート登録用パターン
   */
  routes: {
    upload: '/api/archives',
    session: '/api/archives/:sessionId',
    fileThumbnail: '/api/archives/:sessionId/files/:fileIndex/thumbnail',
    fileImage: '/api/archives/:sessionId/files/:fileIndex/file',
    import: '/api/archives/:sessionId/import',
    importJobStatus: '/api/import-jobs/:jobId',
  },
} as const;
