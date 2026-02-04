import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  deleteArchiveSession,
  getArchiveSession,
  getImportJobStatus,
  importFromArchive,
  uploadArchive,
} from '@/features/import-archive';
import type { ArchiveImportTabViewProps } from '@/features/import/ui/ArchiveImportTabView';
import type { ImportJobStatus, ImportResult } from '@/features/import-archive';
import type { FileWithPath } from '@mantine/dropzone';

/** ジョブが完了したかどうかを判定 */
function isJobFinished(status: string | undefined): boolean {
  return status === 'completed' || status === 'failed';
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

export function useArchiveImportTabViewProps(): ArchiveImportTabViewProps {
  // === State ===
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

  // === Mutations ===
  const uploadMutation = useMutation({
    mutationFn: uploadArchive,
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      setSelectedIndices(new Set());
      setImportResult(null);
      setImportJobId(null);
    },
  });

  // === Queries ===
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

  // === Handlers ===
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

  return {
    // Session state
    sessionId,
    session,
    isSessionLoading: sessionQuery.isLoading,
    sessionError: sessionQuery.error,

    // Upload state
    isUploading: uploadMutation.isPending,
    uploadError: uploadMutation.error,

    // Selection
    selectedIndices,

    // Import state
    isImporting,
    importError: importMutation.error,
    importResult,

    // Job state
    jobStatus,
    jobProgress: jobStatusQuery.data?.progress ?? 0,
    isJobFailed: jobStatusQuery.data?.status === 'failed',
    jobFailedError: jobStatusQuery.data?.error ?? null,
    jobStatusError: jobStatusQuery.error,

    // Delete state
    isClosing: deleteMutation.isPending,

    // Handlers
    onDrop: handleDrop,
    onClose: handleClose,
    onSelectAll: handleSelectAll,
    onDeselectAll: handleDeselectAll,
    onImport: handleImport,
    onSelectionChange: setSelectedIndices,
    onClearImportResult: () => { setImportResult(null); },
    onRetryJobStatus: () => { void jobStatusQuery.refetch(); },
    onAbortJob: () => { setImportJobId(null); },
  };
}
