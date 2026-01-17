import { Card, Group, Image, Stack, Text } from '@mantine/core';
import type { PopularImage } from '@/features/stats/api';

interface PopularImagesListProps {
  images: PopularImage[];
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
  return date.toLocaleDateString();
}

function getThumbnailUrl(thumbnailPath: string | null): string {
  if (thumbnailPath === null) {
    return '';
  }
  return `/api/images/file/${thumbnailPath}`;
}

export function PopularImagesList({ images }: PopularImagesListProps) {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Text fw={500} mb="md">
        Most Viewed Images
      </Text>
      {images.length === 0
        ? (
            <Text c="dimmed" ta="center" py="xl">
              No view data available
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
                    src={getThumbnailUrl(image.thumbnailPath)}
                    alt={image.filename}
                    w={60}
                    h={60}
                    fit="cover"
                    radius="sm"
                    fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Crect fill='%23ddd' width='60' height='60'/%3E%3C/svg%3E"
                  />
                  <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                    <Text size="sm" truncate>
                      {image.filename}
                    </Text>
                    <Group gap="md">
                      <Text size="xs" c="dimmed">
                        {image.viewCount}
                        {' '}
                        views
                      </Text>
                      <Text size="xs" c="dimmed">
                        {formatDuration(image.totalDuration)}
                        {' '}
                        total
                      </Text>
                      <Text size="xs" c="dimmed">
                        Last:
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
