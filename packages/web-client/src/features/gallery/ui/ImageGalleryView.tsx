import {
  ActionIcon,
  Alert,
  AspectRatio,
  Box,
  Button,
  Card,
  Collapse,
  Group,
  Image,
  Loader,
  Menu,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import {
  IconChevronDown,
  IconChevronUp,
  IconHistory,
  IconPhoto,
  IconTrash,
} from '@tabler/icons-react';
import { Link } from 'react-router';
import { SearchBar } from '@/features/search-images';
import { useApiClient } from '@/shared';
import type { Image as ImageType } from '@/entities/image';

export interface ImageGalleryViewProps {
  images: ImageType[] | undefined;
  isLoading: boolean;
  error: Error | null;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onDeleteAllHistory?: () => void;
}

export function ImageGalleryView({
  images,
  isLoading,
  error,
  searchQuery = '',
  onSearchChange,
  isExpanded = true,
  onToggleExpand,
  onDeleteAllHistory,
}: ImageGalleryViewProps) {
  const hasSearch = searchQuery !== '';
  const apiClient = useApiClient();

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

    if (!images || images.length === 0) {
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
      <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="md">
        {images.map(image => (
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
                  src={apiClient.images.getThumbnailUrl(image.id)}
                  alt={image.title}
                  fit="cover"
                  fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23dee2e6' width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23868e96' font-size='12'%3ENo image%3C/text%3E%3C/svg%3E"
                />
              </AspectRatio>
            </Card.Section>
          </Card>
        ))}
      </SimpleGrid>
    );
  };

  return (
    <Paper p="md" withBorder>
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <IconPhoto size={20} />
            <Title order={4}>ギャラリー</Title>
            {isExpanded && images !== undefined && images.length > 0 && (
              <Text size="sm" c="dimmed">
                {images.length}
                件
              </Text>
            )}
          </Group>
          <Button
            variant="subtle"
            size="compact-sm"
            onClick={onToggleExpand}
            rightSection={
              isExpanded
                ? (
                    <IconChevronUp size={16} />
                  )
                : (
                    <IconChevronDown size={16} />
                  )
            }
            aria-expanded={isExpanded}
          >
            {isExpanded ? '折りたたむ' : '展開する'}
          </Button>
        </Group>
        <Collapse in={isExpanded}>
          <Stack gap="md">
            {onSearchChange !== undefined && (
              <Group gap="xs" align="flex-end">
                <Box style={{ maxWidth: 400, flex: 1 }}>
                  <SearchBar value={searchQuery} onChange={onSearchChange} />
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
            )}
            {renderContent()}
          </Stack>
        </Collapse>
      </Stack>
    </Paper>
  );
}
