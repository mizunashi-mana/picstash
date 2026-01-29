import { useEffect, useRef, useState } from 'react';
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
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import type { ImportJobStatus, ImportResult } from '@/features/archive-import';
import type { FileWithPath } from '@mantine/dropzone';
import {
  ArchiveDropzone,
  ArchivePreviewGallery,
  deleteArchiveSession,
  getArchiveSession,
  getImportJobStatus,
  importFromArchive,
  uploadArchive,
} from '@/features/archive-import';

/** ジョブが完了したかどうかを判定 */
function isJobFinished(status: string | undefined): boolean {
  return status === 'completed' || status === 'failed';
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

/** ジョブステータスから完了結果を抽出 */
function extractCompletedResult(data: ImportJobStatus): ImportResult | null {
  if (data.status !== 'completed') {
    return null;
  }
  if (
    data.successCount === undefined
    || data.failedCount === undefined
    || data.results === undefined
  ) {
    return null;
  }
  return {
    totalRequested: data.totalRequested,
    successCount: data.successCount,
    failedCount: data.failedCount,
    results: data.results,
  };
}

export function ArchiveImportTab() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importJobId, setImportJobId] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const importJobIdRef = useRef<string | null>(null);

  // Keep refs in sync with state for cleanup
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    importJobIdRef.current = importJobId;
  }, [importJobId]);

  // Cleanup session on unmount
  // ジョブ実行中はセッションを削除しない（ワーカーがセッションを使用中の可能性があるため）
  useEffect(() => {
    return () => {
      // ジョブが実行中の場合はセッション削除をスキップ
      // （サーバー側の TTL やクリーンアップに任せる）
      if (importJobIdRef.current !== null) {
        return;
      }
      if (sessionIdRef.current !== null) {
        deleteArchiveSession(sessionIdRef.current).catch(() => {
          // Ignore errors during cleanup
        });
      }
    };
  }, []);

  const uploadMutation = useMutation({
    mutationFn: uploadArchive,
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      setSelectedIndices(new Set());
      setImportResult(null);
      setImportJobId(null);
    },
  });

  const sessionQuery = useQuery({
    queryKey: ['archive-session', sessionId],
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- enabled ensures sessionId is not null
    queryFn: async () => await getArchiveSession(sessionId!),
    enabled: sessionId !== null,
  });

  const session = sessionQuery.data;

  const deleteMutation = useMutation({
    mutationFn: deleteArchiveSession,
    onSuccess: () => {
      setSessionId(null);
      setSelectedIndices(new Set());
      setImportResult(null);
      setImportJobId(null);
    },
  });

  // ジョブステータスのポーリング
  const jobStatusQuery = useQuery({
    queryKey: ['import-job-status', importJobId],
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- enabled ensures importJobId is not null
    queryFn: async () => await getImportJobStatus(importJobId!),
    enabled: importJobId !== null,
    refetchInterval: (query) => {
      const data = query.state.data;
      // 完了または失敗したらポーリング停止
      if (isJobFinished(data?.status)) {
        return false;
      }
      return 1000; // 1秒間隔でポーリング
    },
  });

  const jobData = jobStatusQuery.data;
  const jobStatus = jobData?.status;

  // ジョブ完了時の処理
  // This effect synchronizes external async job state with component state
  /* eslint-disable react-hooks/set-state-in-effect -- Intentionally updating state based on async job completion */
  useEffect(() => {
    if (jobData === undefined || !isJobFinished(jobStatus)) {
      return;
    }

    if (jobStatus === 'completed') {
      const completedResult = extractCompletedResult(jobData);
      if (completedResult !== null) {
        setImportResult(completedResult);
        const failedIndices = new Set(
          completedResult.results.filter(r => !r.success).map(r => r.index),
        );
        setSelectedIndices(failedIndices);
      }
    }
    // importJobId は保持したまま（jobStatusQuery.data を維持するため）
    // ポーリングは refetchInterval の isJobFinished チェックで自動停止
  }, [jobData, jobStatus]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const importMutation = useMutation({
    mutationFn: async (indices: number[]) => {
      if (sessionId === null) {
        throw new Error('No session');
      }
      return await importFromArchive(sessionId, indices);
    },
    onSuccess: (result) => {
      // ジョブIDを設定してポーリング開始
      setImportJobId(result.jobId);
    },
  });

  const handleDrop = (files: FileWithPath[]) => {
    const file = files[0];
    if (file !== undefined) {
      uploadMutation.mutate(file);
    }
  };

  const handleClose = () => {
    if (sessionId !== null) {
      deleteMutation.mutate(sessionId);
    }
  };

  const handleSelectAll = () => {
    if (session !== undefined) {
      setSelectedIndices(new Set(session.images.map(img => img.index)));
    }
  };

  const handleDeselectAll = () => {
    setSelectedIndices(new Set());
  };

  const handleImport = () => {
    if (selectedIndices.size > 0) {
      importMutation.mutate(Array.from(selectedIndices));
    }
  };

  // ジョブがアクティブ（waiting または active）かどうか
  const isJobActive = importJobId !== null && (jobStatus === 'waiting' || jobStatus === 'active');
  const isImporting = importMutation.isPending || isJobActive;
  const jobProgress = jobStatusQuery.data?.progress ?? 0;

  if (sessionId === null) {
    return (
      <Stack gap="md">
        <Text size="sm" c="dimmed" ta="center">
          ZIP/RAR ファイルをドラッグ＆ドロップまたはクリックして選択
        </Text>
        <ArchiveDropzone
          onDrop={handleDrop}
          isPending={uploadMutation.isPending}
          isError={uploadMutation.isError}
          errorMessage={uploadMutation.error?.message}
        />
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      {sessionQuery.isLoading
        ? (
            <Stack align="center" py="xl">
              <Loader size="lg" />
              <Text c="dimmed">アーカイブを読み込み中...</Text>
            </Stack>
          )
        : sessionQuery.error !== null
          ? (
              <Alert color="red" title="エラー">
                {sessionQuery.error.message}
              </Alert>
            )
          : session !== undefined
            ? (
                <>
                  <SessionHeader
                    filename={session.filename}
                    archiveType={session.archiveType}
                    imageCount={session.imageCount}
                    onClose={handleClose}
                    isClosing={deleteMutation.isPending}
                    isImporting={isImporting}
                  />

                  {/* Import progress */}
                  {isImporting && (
                    <ImportProgress progress={jobProgress} status={jobStatus} />
                  )}

                  {/* Import error */}
                  {importMutation.isError && (
                    <Alert color="red" title="エラー">
                      {importMutation.error.message}
                    </Alert>
                  )}

                  {/* Job failed error */}
                  {jobStatusQuery.data?.status === 'failed' && (
                    <Alert color="red" title="インポート失敗">
                      {jobStatusQuery.data.error ?? 'ジョブの処理中にエラーが発生しました'}
                    </Alert>
                  )}

                  {/* Job status query error (network/server error) */}
                  {jobStatusQuery.isError && (
                    <JobStatusErrorAlert
                      error={jobStatusQuery.error}
                      onRetry={() => { void jobStatusQuery.refetch(); }}
                      onAbort={() => { setImportJobId(null); }}
                    />
                  )}

                  {/* Import result alert */}
                  {importResult !== null && (
                    <ImportResultAlert
                      result={importResult}
                      onClose={() => { setImportResult(null); }}
                    />
                  )}

                  {/* Selection controls */}
                  <SelectionControls
                    selectedCount={selectedIndices.size}
                    onSelectAll={handleSelectAll}
                    onDeselectAll={handleDeselectAll}
                    onImport={handleImport}
                    isImporting={isImporting}
                  />

                  {/* Gallery */}
                  <ArchivePreviewGallery
                    sessionId={session.sessionId}
                    images={session.images}
                    selectedIndices={selectedIndices}
                    onSelectionChange={setSelectedIndices}
                  />
                </>
              )
            : null}
    </Stack>
  );
}
