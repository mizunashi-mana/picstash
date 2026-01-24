import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Container,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import {
  deleteArchiveSession,
  getArchiveSession,
  importFromArchive,
  uploadArchive,
} from '@/features/archive-import/api';
import { ArchiveDropzone } from '@/features/archive-import/components/ArchiveDropzone';
import { ArchivePreviewGallery } from '@/features/archive-import/components/ArchivePreviewGallery';
import type { ImportResult } from '@/features/archive-import/api';

export function ArchiveImportPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  // Keep ref in sync with state for cleanup
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  // Cleanup session on unmount
  useEffect(() => {
    return () => {
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
    },
  });

  const importMutation = useMutation({
    mutationFn: async (indices: number[]) => {
      if (sessionId === null) {
        throw new Error('No session');
      }
      return await importFromArchive(sessionId, indices);
    },
    onSuccess: (result) => {
      setImportResult(result);
      // Clear selection after successful import
      if (result.successCount > 0) {
        // Remove successfully imported indices from selection
        const failedIndices = new Set(
          result.results.filter(r => !r.success).map(r => r.index),
        );
        setSelectedIndices(failedIndices);
      }
    },
  });

  const handleDrop = (files: File[]) => {
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

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Stack align="center" gap="md">
          <Title order={1}>アーカイブインポート</Title>
          <Text c="dimmed">ZIP/RAR ファイルから画像をインポート</Text>
        </Stack>

        {sessionId === null
          ? (
              <ArchiveDropzone
                onDrop={handleDrop}
                isPending={uploadMutation.isPending}
                isError={uploadMutation.isError}
                errorMessage={uploadMutation.error?.message}
              />
            )
          : (
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
                            {/* Header with file info and close button */}
                            <Group justify="space-between" align="center">
                              <Group gap="sm">
                                <Text fw={500}>{session.filename}</Text>
                                <Badge variant="light">
                                  {session.archiveType.toUpperCase()}
                                </Badge>
                                <Text size="sm" c="dimmed">
                                  {session.imageCount}
                                  件の画像
                                </Text>
                              </Group>
                              <Button
                                variant="outline"
                                color="red"
                                onClick={handleClose}
                                loading={deleteMutation.isPending}
                              >
                                閉じる
                              </Button>
                            </Group>

                            {/* Import result alert */}
                            {importResult !== null && (
                              <Alert
                                color={importResult.failedCount === 0 ? 'green' : 'yellow'}
                                title="インポート完了"
                                withCloseButton
                                onClose={() => { setImportResult(null); }}
                              >
                                <Stack gap="xs">
                                  <Text>
                                    {importResult.successCount}
                                    {' '}
                                    件インポート成功
                                    {importResult.failedCount > 0 && (
                                      <>
                                        、
                                        {importResult.failedCount}
                                        {' '}
                                        件失敗
                                      </>
                                    )}
                                  </Text>
                                  {importResult.successCount > 0 && (
                                    <Button
                                      variant="light"
                                      size="sm"
                                      component={Link}
                                      to="/"
                                    >
                                      ギャラリーを見る
                                    </Button>
                                  )}
                                </Stack>
                              </Alert>
                            )}

                            {/* Selection controls */}
                            <Group justify="space-between" align="center">
                              <Group gap="sm">
                                <Button
                                  variant="light"
                                  size="sm"
                                  onClick={handleSelectAll}
                                >
                                  全選択
                                </Button>
                                <Button
                                  variant="light"
                                  size="sm"
                                  onClick={handleDeselectAll}
                                  disabled={selectedIndices.size === 0}
                                >
                                  全解除
                                </Button>
                                <Text size="sm" c="dimmed">
                                  {selectedIndices.size}
                                  {' '}
                                  件選択中
                                </Text>
                              </Group>
                              <Button
                                onClick={handleImport}
                                disabled={selectedIndices.size === 0}
                                loading={importMutation.isPending}
                              >
                                インポート (
                                {selectedIndices.size}
                                )
                              </Button>
                            </Group>

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
            )}
      </Stack>
    </Container>
  );
}
