import type { Ref } from 'react';
import {
  ActionIcon,
  Alert,
  AspectRatio,
  Box,
  Card,
  Center,
  Container,
  Group,
  Image,
  Loader,
  Menu,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import {
  IconHistory,
  IconLayoutGrid,
  IconPhoto,
  IconSlideshow,
  IconTrash,
} from '@tabler/icons-react';
import { Link } from 'react-router';
import { ImageCarousel } from '@/features/gallery';
import { SearchBar } from '@/features/search-images';
import type { Image as ImageType } from '@/entities/image';
import type { VirtualItem } from '@tanstack/react-virtual';

export interface GalleryPageViewProps {
  /** 検索クエリ */
  query: string;
  /** ビューモード */
  viewMode: 'grid' | 'carousel';
  /** 全画像データ（ページネーション済み） */
  allImages: ImageType[];
  /** 画像総数 */
  total: number;
  /** ローディング中 */
  isLoading: boolean;
  /** エラー */
  error: Error | null;
  /** 次ページ読み込み中 */
  isFetchingNextPage: boolean;
  /** グリッド列数 */
  columns: number;
  /** 仮想スクロール行データ */
  virtualRows: VirtualItem[];
  /** 仮想スクロールの合計サイズ */
  virtualTotalSize: number;
  /** スクロールコンテナ ref（size 計測 + scroll 参照を統合済み） */
  parentRef: Ref<HTMLDivElement>;
  /** 画像 URL 取得関数 */
  getImageUrl: (imageId: string) => string;
  /** サムネイル URL 取得関数 */
  getThumbnailUrl: (imageId: string) => string;
  /** 検索変更ハンドラ */
  onSearchChange: (value: string) => void;
  /** 検索履歴全削除ハンドラ */
  onDeleteAllHistory: () => void;
  /** ビューモード変更ハンドラ */
  onViewModeChange: (mode: 'grid' | 'carousel') => void;
  /** カルーセルインデックス変更ハンドラ */
  onCarouselIndexChange: (index: number) => void;
}

/** Grid spacing in pixels (matches Mantine's md spacing) */
const GRID_GAP = 16;

export function GalleryPageView({
  query,
  viewMode,
  allImages,
  total,
  isLoading,
  error,
  isFetchingNextPage,
  columns,
  virtualRows,
  virtualTotalSize,
  parentRef,
  getImageUrl,
  getThumbnailUrl,
  onSearchChange,
  onDeleteAllHistory,
  onViewModeChange,
  onCarouselIndexChange,
}: GalleryPageViewProps) {
  const hasSearch = query !== '';

  const renderGridView = () => {
    return (
      <>
        {/* Virtual scroll container */}
        <div
          ref={parentRef}
          style={{
            height: 'calc(100vh - 250px)', // Leave room for header/search
            overflow: 'auto',
          }}
        >
          <div
            style={{
              height: virtualTotalSize,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualRows.map((virtualRow) => {
              const rowIndex = virtualRow.index;
              const startIndex = rowIndex * columns;
              const rowImages = allImages.slice(startIndex, startIndex + columns);

              return (
                <div
                  key={virtualRow.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: virtualRow.size,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${columns}, 1fr)`,
                      gap: GRID_GAP,
                    }}
                  >
                    {rowImages.map(image => (
                      <Card
                        key={image.id}
                        padding="xs"
                        radius="md"
                        withBorder
                        component={Link}
                        to={`/images/${image.id}`}
                        style={{
                          textDecoration: 'none',
                          color: 'inherit',
                          cursor: 'pointer',
                        }}
                      >
                        <Card.Section>
                          <AspectRatio ratio={1}>
                            <Image
                              src={getThumbnailUrl(image.id)}
                              alt={image.title}
                              fit="cover"
                              fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23dee2e6' width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23868e96' font-size='12'%3ENo image%3C/text%3E%3C/svg%3E"
                            />
                          </AspectRatio>
                        </Card.Section>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {isFetchingNextPage && (
          <Center py="md">
            <Loader size="sm" />
          </Center>
        )}
      </>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <Stack align="center" py="xl">
          <Loader size="lg" />
          <Text c="dimmed">画像を読み込み中...</Text>
        </Stack>
      );
    }

    if (error) {
      return (
        <Alert color="red" title="エラー">
          画像の読み込みに失敗しました:
          {' '}
          {error.message}
        </Alert>
      );
    }

    if (allImages.length === 0) {
      if (hasSearch) {
        return (
          <Stack align="center" py="xl">
            <Text c="dimmed" size="lg">
              検索結果がありません
            </Text>
            <Text c="dimmed" size="sm">
              別のキーワードで検索してください
            </Text>
          </Stack>
        );
      }
      return (
        <Stack align="center" py="xl">
          <Text c="dimmed" size="lg">
            画像がありません
          </Text>
          <Text c="dimmed" size="sm">
            画像をアップロードしてください
          </Text>
        </Stack>
      );
    }

    if (viewMode === 'carousel') {
      return (
        <ImageCarousel
          images={allImages}
          onIndexChange={onCarouselIndexChange}
          getImageUrl={getImageUrl}
          getThumbnailUrl={getThumbnailUrl}
        />
      );
    }

    return renderGridView();
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <IconPhoto size={24} />
            <Title order={2}>ギャラリー</Title>
            {total > 0 && (
              <Text size="sm" c="dimmed">
                {total}
                件
              </Text>
            )}
          </Group>

          {/* View mode toggle - Finder style */}
          <ActionIcon.Group>
            <Tooltip label="グリッド表示" withArrow>
              <ActionIcon
                variant={viewMode === 'grid' ? 'filled' : 'default'}
                size="lg"
                aria-label="グリッド表示"
                onClick={() => { onViewModeChange('grid'); }}
              >
                <IconLayoutGrid size={18} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="カルーセル表示" withArrow>
              <ActionIcon
                variant={viewMode === 'carousel' ? 'filled' : 'default'}
                size="lg"
                aria-label="カルーセル表示"
                onClick={() => { onViewModeChange('carousel'); }}
              >
                <IconSlideshow size={18} />
              </ActionIcon>
            </Tooltip>
          </ActionIcon.Group>
        </Group>

        <Group gap="xs" align="flex-end">
          <Box style={{ maxWidth: 400, flex: 1 }}>
            <SearchBar value={query} onChange={onSearchChange} />
          </Box>
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <ActionIcon
                variant="subtle"
                color="gray"
                aria-label="検索履歴メニュー"
              >
                <IconHistory size={18} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>検索履歴</Menu.Label>
              <Menu.Item
                color="red"
                leftSection={<IconTrash size={14} />}
                onClick={onDeleteAllHistory}
              >
                履歴をすべて削除
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>

        {renderContent()}
      </Stack>
    </Container>
  );
}
