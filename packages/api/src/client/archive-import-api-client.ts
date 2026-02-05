/**
 * Archive Import API Client Interface
 */

import type {
  ArchiveSession,
  ArchiveSessionDetail,
  ImportJobStartResponse,
  ImportJobStatus,
} from '@/archives.js';

export interface ArchiveImportApiClient {
  /** アーカイブアップロード */
  upload: (file: Blob) => Promise<ArchiveSession>;

  /** セッション詳細取得 */
  getSession: (sessionId: string) => Promise<ArchiveSessionDetail>;

  /** セッション削除 */
  deleteSession: (sessionId: string) => Promise<void>;

  /** ファイルサムネイル URL 取得 */
  getThumbnailUrl: (sessionId: string, fileIndex: number) => string;

  /** ファイル画像 URL 取得 */
  getImageUrl: (sessionId: string, fileIndex: number) => string;

  /** インポート実行 */
  importImages: (sessionId: string, indices: number[]) => Promise<ImportJobStartResponse>;

  /** インポートジョブステータス取得 */
  getImportJobStatus: (jobId: string) => Promise<ImportJobStatus>;
}
