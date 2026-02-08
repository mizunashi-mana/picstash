/* v8 ignore file -- View: 純粋な描画コンポーネントなので Storybook テストでカバー */
import {
  Alert,
  Anchor,
  Button,
  Group,
  Loader,
  Stack,
  Text,
} from '@mantine/core';
import { Link } from 'react-router';
import {
  CrawlPreviewGallery,
  UrlInputForm,
} from '@/features/import-url';
import type { UrlCrawlImportResult, UrlCrawlSessionDetail } from '@picstash/api';

export interface UrlCrawlTabViewProps {
  sessionId: string | null;
  session: UrlCrawlSessionDetail | undefined;
  isSessionLoading: boolean;
  sessionError: Error | null;
  isCrawling: boolean;
  crawlError: Error | null;
  selectedIndices: Set<number>;
  isImporting: boolean;
  importResult: UrlCrawlImportResult | null;
  isClosing: boolean;
  onSubmit: (url: string) => void;
  onClose: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onImport: () => void;
  onSelectionChange: (indices: Set<number>) => void;
  onClearImportResult: () => void;
}

export function UrlCrawlTabView({
  sessionId,
  session,
  isSessionLoading,
  sessionError,
  isCrawling,
  crawlError,
  selectedIndices,
  isImporting,
  importResult,
  isClosing,
  onSubmit,
  onClose,
  onSelectAll,
  onDeselectAll,
  onImport,
  onSelectionChange,
  onClearImportResult,
}: UrlCrawlTabViewProps) {
  if (sessionId === null) {
    return (
      <Stack gap="md">
        <Text size="sm" c="dimmed" ta="center">
          ウェブページの URL を入力して画像をクロール
        </Text>
        <UrlInputForm
          onSubmit={onSubmit}
          isPending={isCrawling}
          isError={crawlError !== null}
          errorMessage={crawlError?.message}
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
              <Text c="dimmed">ページを読み込み中...</Text>
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
                      onClick={onClose}
                      loading={isClosing}
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
                      onClose={onClearImportResult}
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
                          <Button variant="light" size="sm" component={Link} to="/gallery">
                            ギャラリーを見る
                          </Button>
                        )}
                      </Stack>
                    </Alert>
                  )}

                  {/* Selection controls */}
                  <Group justify="space-between" align="center">
                    <Group gap="sm">
                      <Button variant="light" size="sm" onClick={onSelectAll}>
                        全選択
                      </Button>
                      <Button
                        variant="light"
                        size="sm"
                        onClick={onDeselectAll}
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
                      onClick={onImport}
                      disabled={selectedIndices.size === 0}
                      loading={isImporting}
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
                    onSelectionChange={onSelectionChange}
                  />
                </>
              )
            : null}
    </Stack>
  );
}
