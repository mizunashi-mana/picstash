import {
  ActionIcon,
  Alert,
  Box,
  Container,
  Group,
  Image,
  Loader,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router';
import { fetchImage, getImageUrl } from '@/features/gallery/api';

function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return 'N/A';
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ImageDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: image, isLoading, error } = useQuery({
    queryKey: ['image', id],
    queryFn: async () => fetchImage(id!),
    enabled: id != null && id !== '',
  });

  if (isLoading) {
    return (
      <Container size="lg" py="xl">
        <Stack align="center" py="xl">
          <Loader size="lg" />
          <Text c="dimmed">Loading image...</Text>
        </Stack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="lg" py="xl">
        <Alert color="red" title="Error">
          Failed to load image:
          {' '}
          {error.message}
        </Alert>
      </Container>
    );
  }

  if (!image) {
    return (
      <Container size="lg" py="xl">
        <Alert color="yellow" title="Not Found">
          Image not found
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="lg" py="md">
      <Stack gap="md">
        <Group>
          <ActionIcon
            variant="subtle"
            size="lg"
            component={Link}
            to="/"
            aria-label="ギャラリーに戻る"
          >
            <IconArrowLeft size={20} />
          </ActionIcon>
          <Title order={3} lineClamp={1} style={{ flex: 1 }}>
            {image.id}
          </Title>
        </Group>

        <Box>
          <Image
            src={getImageUrl(image.id)}
            alt={image.filename}
            fit="contain"
            mah="70vh"
            radius="md"
          />
        </Box>

        <Paper p="md" withBorder>
          <Stack gap="xs">
            <Group justify="space-between">
              <Text size="sm" c="dimmed">ファイル名</Text>
              <Text size="sm">{image.filename}</Text>
            </Group>
            {image.width != null && image.height != null && (
              <Group justify="space-between">
                <Text size="sm" c="dimmed">サイズ</Text>
                <Text size="sm">
                  {image.width}
                  {' '}
                  x
                  {' '}
                  {image.height}
                  {' '}
                  px
                </Text>
              </Group>
            )}
            <Group justify="space-between">
              <Text size="sm" c="dimmed">ファイルサイズ</Text>
              <Text size="sm">{formatFileSize(image.size)}</Text>
            </Group>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">形式</Text>
              <Text size="sm">{image.mimeType}</Text>
            </Group>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">アップロード日時</Text>
              <Text size="sm">{formatDate(image.createdAt)}</Text>
            </Group>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
