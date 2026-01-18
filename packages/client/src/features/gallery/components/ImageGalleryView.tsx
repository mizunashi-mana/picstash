import {
  Alert,
  AspectRatio,
  Box,
  Card,
  Group,
  Image,
  Loader,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core';
import { Link } from 'react-router';
import { getThumbnailUrl } from '@/features/gallery/api';
import { SearchBar } from './SearchBar';
import type { Image as ImageType } from '@/features/gallery/api';

export interface ImageGalleryViewProps {
  images: ImageType[] | undefined;
  isLoading: boolean;
  error: Error | null;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
}

export function ImageGalleryView({
  images,
  isLoading,
  error,
  searchQuery = '',
  onSearchChange,
}: ImageGalleryViewProps) {
  const hasSearch = searchQuery !== '';

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
            style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
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
    );
  };

  return (
    <Stack gap="md">
      {onSearchChange !== undefined && (
        <Group justify="space-between" align="center">
          <Box style={{ flex: 1, maxWidth: 400 }}>
            <SearchBar
              value={searchQuery}
              onChange={onSearchChange}
            />
          </Box>
          {images !== undefined && images.length > 0 && (
            <Text size="sm" c="dimmed">
              {images.length}
              件
            </Text>
          )}
        </Group>
      )}
      {renderContent()}
    </Stack>
  );
}
