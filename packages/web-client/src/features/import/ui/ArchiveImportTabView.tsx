import {
  Alert,
  Badge,
  Button,
  Group,
  Loader,
  Progress,
  Stack,
  Text,
} from '@mantine/core';
import { Link } from 'react-router';
import {
  ArchiveDropzone,
  ArchivePreviewGallery,
} from '@/features/import-archive';
import type { ImportResult } from '@/features/import-archive';
import type { FileWithPath } from '@mantine/dropzone';

export interface ArchiveImportTabViewProps {
  // Session state
  sessionId: string | null;
  session: { sessionId: string; filename: string; archiveType: string; imageCount: number; images: Array<{ index: number; filename: string; path: string; size: number }> } | undefined;
  isSessionLoading: boolean;
  sessionError: Error | null;

  // Upload state
  isUploading: boolean;
  uploadError: Error | null;

  // Selection
  selectedIndices: Set<number>;

  // Import state
  isImporting: boolean;
  importError: Error | null;
  importResult: ImportResult | null;

  // Job state
  jobStatus: string | undefined;
  jobProgress: number;
  isJobFailed: boolean;
  jobFailedError: string | null;
  jobStatusError: Error | null;

  // Delete state
  isClosing: boolean;

  // Handlers
  onDrop: (files: FileWithPath[]) => void;
  onClose: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onImport: () => void;
  onSelectionChange: (indices: Set<number>) => void;
  onClearImportResult: () => void;
  onRetryJobStatus: () => void;
  onAbortJob: () => void;
}

/** セッション表示コンポーネント */
function SessionHeader({
  filename,
  archiveType,
  imageCount,
  onClose,
  isClosing,
  isImporting,
}: {
  filename: string;
  archiveType: string;
  imageCount: number;
  onClose: () => void;
  isClosing: boolean;
  isImporting: boolean;
}) {
  return (
    <Group justify="space-between" align="center">
      <Group gap="sm">
        <Text fw={500}>{filename}</Text>
        <Badge variant="light">
          {archiveType.toUpperCase()}
        </Badge>
        <Text size="sm" c="dimmed">
          {imageCount}
          件の画像
        </Text>
      </Group>
      <Button
        variant="outline"
        color="red"
        onClick={onClose}
        loading={isClosing}
        disabled={isImporting}
      >
        閉じる
      </Button>
    </Group>
  );
}

/** 進捗表示コンポーネント */
function ImportProgress({ progress, status }: { progress: number; status: string | undefined }) {
  return (
    <Alert color="blue" title="インポート中...">
      <Stack gap="xs">
        <Progress value={progress} size="lg" animated />
        <Text size="sm" c="dimmed">
          {status === 'waiting' && 'キュー待機中...'}
          {status === 'active' && `${progress}% 完了`}
          {status === undefined && 'ジョブを開始中...'}
        </Text>
      </Stack>
    </Alert>
  );
}

/** 結果表示コンポーネント */
function ImportResultAlert({
  result,
  onClose,
}: {
  result: ImportResult;
  onClose: () => void;
}) {
  return (
    <Alert
      color={result.failedCount === 0 ? 'green' : 'yellow'}
      title="インポート完了"
      withCloseButton
      onClose={onClose}
    >
      <Stack gap="xs">
        <Text>
          {result.successCount}
          {' '}
          件インポート成功
          {result.failedCount > 0 && (
            <>
              、
              {result.failedCount}
              {' '}
              件失敗
            </>
          )}
        </Text>
        {result.successCount > 0 && (
          <Button
            variant="light"
            size="sm"
            component={Link}
            to="/gallery"
          >
            ギャラリーを見る
          </Button>
        )}
      </Stack>
    </Alert>
  );
}

/** 選択コントロールコンポーネント */
function SelectionControls({
  selectedCount,
  onSelectAll,
  onDeselectAll,
  onImport,
  isImporting,
}: {
  selectedCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onImport: () => void;
  isImporting: boolean;
}) {
  return (
    <Group justify="space-between" align="center">
      <Group gap="sm">
        <Button variant="light" size="sm" onClick={onSelectAll} disabled={isImporting}>
          全選択
        </Button>
        <Button
          variant="light"
          size="sm"
          onClick={onDeselectAll}
          disabled={selectedCount === 0 || isImporting}
        >
          全解除
        </Button>
        <Text size="sm" c="dimmed">
          {selectedCount}
          {' '}
          件選択中
        </Text>
      </Group>
      <Button
        onClick={onImport}
        disabled={selectedCount === 0 || isImporting}
        loading={isImporting}
      >
        インポート (
        {selectedCount}
        )
      </Button>
    </Group>
  );
}

/** ステータス取得エラー表示コンポーネント */
function JobStatusErrorAlert({
  error,
  onRetry,
  onAbort,
}: {
  error: Error;
  onRetry: () => void;
  onAbort: () => void;
}) {
  return (
    <Alert color="red" title="ステータス取得エラー">
      <Stack gap="xs">
        <Text size="sm">
          インポートジョブの状態取得中にエラーが発生しました。再試行するか、インポートを中止してください。
        </Text>
        <Text size="xs" c="dimmed">
          {error.message}
        </Text>
        <Group gap="xs">
          <Button size="xs" variant="light" onClick={onRetry}>
            再試行
          </Button>
          <Button size="xs" variant="subtle" onClick={onAbort}>
            インポートを中止
          </Button>
        </Group>
      </Stack>
    </Alert>
  );
}

export function ArchiveImportTabView({
  sessionId,
  session,
  isSessionLoading,
  sessionError,
  isUploading,
  uploadError,
  selectedIndices,
  isImporting,
  importError,
  importResult,
  jobStatus,
  jobProgress,
  isJobFailed,
  jobFailedError,
  jobStatusError,
  isClosing,
  onDrop,
  onClose,
  onSelectAll,
  onDeselectAll,
  onImport,
  onSelectionChange,
  onClearImportResult,
  onRetryJobStatus,
  onAbortJob,
}: ArchiveImportTabViewProps) {
  if (sessionId === null) {
    return (
      <Stack gap="md">
        <Text size="sm" c="dimmed" ta="center">
          ZIP/RAR ファイルをドラッグ＆ドロップまたはクリックして選択
        </Text>
        <ArchiveDropzone
          onDrop={onDrop}
          isPending={isUploading}
          isError={uploadError !== null}
          errorMessage={uploadError?.message}
        />
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      {isSessionLoading
        ? (
            <Stack align="center" py="xl">
              <Loader size="lg" />
              <Text c="dimmed">アーカイブを読み込み中...</Text>
            </Stack>
          )
        : sessionError !== null
          ? (
              <Alert color="red" title="エラー">
                {sessionError.message}
              </Alert>
            )
          : session !== undefined
            ? (
                <>
                  <SessionHeader
                    filename={session.filename}
                    archiveType={session.archiveType}
                    imageCount={session.imageCount}
                    onClose={onClose}
                    isClosing={isClosing}
                    isImporting={isImporting}
                  />

                  {/* Import progress */}
                  {isImporting && (
                    <ImportProgress progress={jobProgress} status={jobStatus} />
                  )}

                  {/* Import error */}
                  {importError !== null && (
                    <Alert color="red" title="エラー">
                      {importError.message}
                    </Alert>
                  )}

                  {/* Job failed error */}
                  {isJobFailed && (
                    <Alert color="red" title="インポート失敗">
                      {jobFailedError ?? 'ジョブの処理中にエラーが発生しました'}
                    </Alert>
                  )}

                  {/* Job status query error (network/server error) */}
                  {jobStatusError !== null && (
                    <JobStatusErrorAlert
                      error={jobStatusError}
                      onRetry={onRetryJobStatus}
                      onAbort={onAbortJob}
                    />
                  )}

                  {/* Import result alert */}
                  {importResult !== null && (
                    <ImportResultAlert
                      result={importResult}
                      onClose={onClearImportResult}
                    />
                  )}

                  {/* Selection controls */}
                  <SelectionControls
                    selectedCount={selectedIndices.size}
                    onSelectAll={onSelectAll}
                    onDeselectAll={onDeselectAll}
                    onImport={onImport}
                    isImporting={isImporting}
                  />

                  {/* Gallery */}
                  <ArchivePreviewGallery
                    sessionId={session.sessionId}
                    images={session.images}
                    selectedIndices={selectedIndices}
                    onSelectionChange={onSelectionChange}
                  />
                </>
              )
            : null}
    </Stack>
  );
}
