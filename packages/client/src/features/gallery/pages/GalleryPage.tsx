import { useCallback, useEffect, useRef } from 'react';
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
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconHistory, IconPhoto, IconTrash } from '@tabler/icons-react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router';
import {
  deleteAllSearchHistory,
  fetchImagesPaginated,
  getThumbnailUrl,
  saveSearchHistory,
} from '@/features/gallery/api';
import { SearchBar } from '@/features/gallery/components/SearchBar';

const PAGE_SIZE = 50;

export function GalleryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const queryClient = useQueryClient();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['images-paginated', query],
    queryFn: async ({ pageParam = 0 }) => {
      return await fetchImagesPaginated(query, {
        limit: PAGE_SIZE,
        offset: pageParam,
      });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const nextOffset = lastPage.offset + lastPage.items.length;
      return nextOffset < lastPage.total ? nextOffset : undefined;
    },
  });

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const currentRef = loadMoreRef.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting === true && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { threshold: 0, rootMargin: '100px' },
    );

    observer.observe(currentRef);

    return () => {
      observer.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Save search history mutation
  const saveHistoryMutation = useMutation({
    mutationFn: saveSearchHistory,
  });

  // Delete all history mutation
  const deleteAllHistoryMutation = useMutation({
    mutationFn: deleteAllSearchHistory,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['search-suggestions'] });
    },
  });

  const handleSearchChange = useCallback(
    (value: string) => {
      if (value === '') {
        setSearchParams({});
      }
      else {
        setSearchParams({ q: value });
        saveHistoryMutation.mutate(value);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mutate is stable
    [setSearchParams],
  );

  const handleDeleteAllHistory = useCallback(() => {
    deleteAllHistoryMutation.mutate();
  }, [deleteAllHistoryMutation]);

  const allImages = data?.pages.flatMap(page => page.items) ?? [];
  const total = data?.pages[0]?.total ?? 0;
  const hasSearch = query !== '';

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

    return (
      <>
        <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing="md">
          {allImages.map(image => (
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
        </SimpleGrid>

        {/* Load more trigger */}
        <div ref={loadMoreRef} style={{ height: 20 }} />

        {isFetchingNextPage && (
          <Center py="md">
            <Loader size="sm" />
          </Center>
        )}
      </>
    );
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
        </Group>

        <Group gap="xs" align="flex-end">
          <Box style={{ maxWidth: 400, flex: 1 }}>
            <SearchBar value={query} onChange={handleSearchChange} />
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
                onClick={handleDeleteAllHistory}
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
