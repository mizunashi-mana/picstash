import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Anchor,
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
  crawlUrl,
  deleteCrawlSession,
  getCrawlSession,
  importFromCrawl,
} from '@/features/url-crawl/api';
import { CrawlPreviewGallery } from '@/features/url-crawl/components/CrawlPreviewGallery';
import { UrlInputForm } from '@/features/url-crawl/components/UrlInputForm';
import type { ImportResult } from '@/features/url-crawl/api';

export function UrlCrawlPage() {
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
        deleteCrawlSession(sessionIdRef.current).catch(() => {
          // Ignore errors during cleanup
        });
      }
    };
  }, []);

  const crawlMutation = useMutation({
    mutationFn: crawlUrl,
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      setSelectedIndices(new Set());
      setImportResult(null);
    },
  });

  const sessionQuery = useQuery({
    queryKey: ['url-crawl-session', sessionId],
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- enabled ensures sessionId is not null
    queryFn: async () => await getCrawlSession(sessionId!),
    enabled: sessionId !== null,
  });

  const session = sessionQuery.data;

  const deleteMutation = useMutation({
    mutationFn: deleteCrawlSession,
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
      return await importFromCrawl(sessionId, indices);
    },
    onSuccess: (result) => {
      setImportResult(result);
      // Clear selection after successful import
      if (result.successCount > 0) {
        // Remove successfully imported indices from selection
        const failedIndices = new Set(result.results.filter(r => !r.success).map(r => r.index));
        setSelectedIndices(failedIndices);
      }
    },
  });

  const handleSubmit = (url: string) => {
    crawlMutation.mutate(url);
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
          <Title order={1}>URLから画像を取り込み</Title>
          <Text c="dimmed">ウェブページから画像をクロールしてインポート</Text>
        </Stack>

        {sessionId === null
          ? (
              <UrlInputForm
                onSubmit={handleSubmit}
                isPending={crawlMutation.isPending}
                isError={crawlMutation.isError}
                errorMessage={crawlMutation.error?.message}
              />
            )
          : (
              <Stack gap="md">
                {sessionQuery.isLoading
                  ? (
                      <Stack align="center" py="xl">
                        <Loader size="lg" />
                        <Text c="dimmed">ページを読み込み中...</Text>
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
                            {/* Header with page info and close button */}
                            <Group justify="space-between" align="center">
                              <Stack gap={4}>
                                <Text fw={500}>{session.pageTitle ?? 'タイトルなし'}</Text>
                                <Anchor
                                  href={session.sourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  size="sm"
                                  c="dimmed"
                                  lineClamp={1}
                                  style={{ maxWidth: 400 }}
                                >
                                  {session.sourceUrl}
                                </Anchor>
                                <Text size="sm" c="dimmed">
                                  {session.imageCount}
                                  {' '}
                                  件の画像
                                </Text>
                              </Stack>
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
                                onClose={() => {
                                  setImportResult(null);
                                }}
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
                                    <Button variant="light" size="sm" component={Link} to="/">
                                      ギャラリーを見る
                                    </Button>
                                  )}
                                </Stack>
                              </Alert>
                            )}

                            {/* Selection controls */}
                            <Group justify="space-between" align="center">
                              <Group gap="sm">
                                <Button variant="light" size="sm" onClick={handleSelectAll}>
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
                            <CrawlPreviewGallery
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
