import {
  Alert,
  AspectRatio,
  Box,
  Card,
  Group,
  Image,
  Loader,
  Paper,
  ScrollArea,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconSparkles } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { getThumbnailUrl } from '@/features/gallery/api';
import { fetchRecommendations } from '@/features/recommendations/api';

export function RecommendationSection() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['recommendations'],
    queryFn: async () => await fetchRecommendations({ limit: 12 }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Don't show section while loading initially
  if (isLoading) {
    return (
      <Paper p="md" withBorder>
        <Stack gap="md">
          <Group gap="xs">
            <IconSparkles size={20} />
            <Title order={4}>おすすめ</Title>
          </Group>
          <Stack align="center" py="md">
            <Loader size="sm" />
            <Text c="dimmed" size="sm">
              おすすめを読み込み中...
            </Text>
          </Stack>
        </Stack>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper p="md" withBorder>
        <Stack gap="md">
          <Group gap="xs">
            <IconSparkles size={20} />
            <Title order={4}>おすすめ</Title>
          </Group>
          <Alert color="red" variant="light">
            おすすめの読み込みに失敗しました
          </Alert>
        </Stack>
      </Paper>
    );
  }

  // Don't show section if no recommendations
  if (
    data === undefined
    || data.recommendations.length === 0
  ) {
    const message = getEmptyMessage(data?.reason);
    return (
      <Paper p="md" withBorder>
        <Stack gap="md">
          <Group gap="xs">
            <IconSparkles size={20} />
            <Title order={4}>おすすめ</Title>
          </Group>
          <Text c="dimmed" size="sm" ta="center" py="md">
            {message}
          </Text>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper p="md" withBorder>
      <Stack gap="md">
        <Group gap="xs">
          <IconSparkles size={20} />
          <Title order={4}>おすすめ</Title>
        </Group>
        <ScrollArea type="auto" offsetScrollbars>
          <Group gap="sm" wrap="nowrap">
            {data.recommendations.map(image => (
              <Box
                key={image.id}
                component={Link}
                to={`/images/${image.id}`}
                style={{ textDecoration: 'none', flexShrink: 0 }}
              >
                <Card
                  shadow="sm"
                  padding={0}
                  radius="md"
                  w={160}
                  withBorder
                  style={{ overflow: 'hidden' }}
                >
                  <AspectRatio ratio={1}>
                    <Image
                      src={getThumbnailUrl(image.id)}
                      alt={image.filename}
                      fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3C/svg%3E"
                    />
                  </AspectRatio>
                </Card>
              </Box>
            ))}
          </Group>
        </ScrollArea>
      </Stack>
    </Paper>
  );
}

function getEmptyMessage(
  reason?: 'no_history' | 'no_embeddings' | 'no_similar',
): string {
  switch (reason) {
    case 'no_history':
      return 'もっと画像を見てみましょう。閲覧履歴に基づいておすすめが表示されます。';
    case 'no_embeddings':
      return '画像の解析中です。しばらくお待ちください。';
    case 'no_similar':
      return '類似画像が見つかりませんでした。';
    default:
      return 'おすすめ画像がありません。';
  }
}
