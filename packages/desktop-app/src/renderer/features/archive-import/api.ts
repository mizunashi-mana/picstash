export interface ArchiveSession {
  sessionId: string;
  filename: string;
  archiveType: 'zip' | 'rar';
  imageCount: number;
}

export interface ArchiveImage {
  index: number;
  filename: string;
  path: string;
  size: number;
}

export interface ArchiveSessionDetail extends ArchiveSession {
  images: ArchiveImage[];
}

interface ErrorResponse {
  message?: string;
}

export async function uploadArchive(file: Blob): Promise<ArchiveSession> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/archives', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- API error response
    const error = (await response.json()) as ErrorResponse;
    throw new Error(error.message ?? 'Upload failed');
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- API response
  return (await response.json()) as ArchiveSession;
}

export async function getArchiveSession(
  sessionId: string,
): Promise<ArchiveSessionDetail> {
  const response = await fetch(`/api/archives/${sessionId}`);

  if (!response.ok) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- API error response
    const error = (await response.json()) as ErrorResponse;
    throw new Error(error.message ?? 'Failed to get archive session');
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- API response
  return (await response.json()) as ArchiveSessionDetail;
}

export async function deleteArchiveSession(sessionId: string): Promise<void> {
  const response = await fetch(`/api/archives/${sessionId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    // Only try to parse JSON if there's content
    const text = await response.text();
    if (text !== '') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- API error response
      const error = JSON.parse(text) as ErrorResponse;
      throw new Error(error.message ?? 'Failed to delete archive session');
    }
    throw new Error('Failed to delete archive session');
  }
}

export function getArchiveThumbnailUrl(
  sessionId: string,
  fileIndex: number,
): string {
  return `/api/archives/${sessionId}/files/${fileIndex}/thumbnail`;
}

export function getArchiveImageUrl(
  sessionId: string,
  fileIndex: number,
): string {
  return `/api/archives/${sessionId}/files/${fileIndex}/file`;
}

export interface ImportResultItem {
  index: number;
  success: boolean;
  imageId?: string;
  error?: string;
}

/** ジョブステータス型 */
export type JobStatus = 'waiting' | 'active' | 'completed' | 'failed';

/** インポートジョブ開始レスポンス */
export interface ImportJobStartResponse {
  jobId: string;
  status: JobStatus;
  totalRequested: number;
  message: string;
}

/** インポートジョブステータスレスポンス */
export interface ImportJobStatus {
  jobId: string;
  status: 'waiting' | 'active' | 'completed' | 'failed';
  progress: number;
  totalRequested: number;
  successCount?: number;
  failedCount?: number;
  results?: ImportResultItem[];
  error?: string;
}

/** 完了したインポートジョブの結果 */
export interface ImportResult {
  totalRequested: number;
  successCount: number;
  failedCount: number;
  results: ImportResultItem[];
}

/**
 * アーカイブから画像をインポート（ジョブをキューに追加）
 */
export async function importFromArchive(
  sessionId: string,
  indices: number[],
): Promise<ImportJobStartResponse> {
  const response = await fetch(`/api/archives/${sessionId}/import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ indices }),
  });

  if (!response.ok) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- API error response
    const error = (await response.json()) as ErrorResponse;
    throw new Error(error.message ?? 'Failed to queue import job');
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- API response
  return (await response.json()) as ImportJobStartResponse;
}

/**
 * インポートジョブのステータスを取得
 */
export async function getImportJobStatus(jobId: string): Promise<ImportJobStatus> {
  const response = await fetch(`/api/import-jobs/${jobId}`);

  if (!response.ok) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- API error response
    const error = (await response.json()) as ErrorResponse;
    throw new Error(error.message ?? 'Failed to get import job status');
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- API response
  return (await response.json()) as ImportJobStatus;
}
