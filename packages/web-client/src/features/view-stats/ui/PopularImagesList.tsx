import { Card, Group, Image, Stack, Text } from '@mantine/core';
import type { PopularImage } from '@picstash/api';

interface PopularImagesListProps {
  images: PopularImage[];
  getThumbnailUrl: (imageId: string) => string;
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function formatDate(dateStr: string | null): string {
  if (dateStr === null) {
    return '-';
  }
  const date = new Date(dateStr);
  return date.toLocaleDateString('ja-JP');
}

export function PopularImagesList({ images, getThumbnailUrl }: PopularImagesListProps) {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Text fw={500} mb="md">
        よく閲覧された画像
      </Text>
      {images.length === 0
        ? (
            <Text c="dimmed" ta="center" py="xl">
              閲覧データがありません
            </Text>
          )
        : (
            <Stack gap="sm">
              {images.map((image, index) => (
                <Group
                  key={image.id}
                  gap="md"
                  wrap="nowrap"
                  style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}
                  pb="sm"
                >
                  <Text fw={600} w={24} ta="center" c="dimmed">
                    {index + 1}
                  </Text>
                  <Image
                    src={getThumbnailUrl(image.id)}
                    alt={image.title}
                    w={60}
                    h={60}
                    fit="cover"
                    radius="sm"
                    fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Crect fill='%23ddd' width='60' height='60'/%3E%3C/svg%3E"
                  />
                  <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                    <Group gap="md">
                      <Text size="xs" c="dimmed">
                        {image.viewCount}
                        回閲覧
                      </Text>
                      <Text size="xs" c="dimmed">
                        合計:
                        {' '}
                        {formatDuration(image.totalDuration)}
                      </Text>
                      <Text size="xs" c="dimmed">
                        最終:
                        {' '}
                        {formatDate(image.lastViewedAt)}
                      </Text>
                    </Group>
                  </Stack>
                </Group>
              ))}
            </Stack>
          )}
    </Card>
  );
}
