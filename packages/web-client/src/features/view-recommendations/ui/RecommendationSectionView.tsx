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
import { Link } from 'react-router';
import { buildUrl } from '@/shared/lib';
import type { RecommendedImage } from '@/features/view-recommendations/api/recommendations';

export interface RecommendationSectionViewProps {
  recommendations: RecommendedImage[];
  conversionMap: Map<string, string>;
  isLoading: boolean;
  error: Error | null;
  emptyReason: 'no_history' | 'no_embeddings' | 'no_similar' | undefined;
  getThumbnailUrl: (imageId: string) => string;
}

export function RecommendationSectionView({
  recommendations,
  conversionMap,
  isLoading,
  error,
  emptyReason,
  getThumbnailUrl,
}: RecommendationSectionViewProps) {
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

  if (error !== null) {
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

  if (recommendations.length === 0) {
    const message = getEmptyMessage(emptyReason);
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
            {recommendations.map(image => (
              <RecommendationCard
                key={image.id}
                image={image}
                conversionId={conversionMap.get(image.id)}
                getThumbnailUrl={getThumbnailUrl}
              />
            ))}
          </Group>
        </ScrollArea>
      </Stack>
    </Paper>
  );
}

interface RecommendationCardProps {
  image: RecommendedImage;
  conversionId: string | undefined;
  getThumbnailUrl: (imageId: string) => string;
}

function RecommendationCard({ image, conversionId, getThumbnailUrl }: RecommendationCardProps) {
  // Build URL with optional conversionId
  const url = buildUrl(`/images/${image.id}`, { conversionId });

  return (
    <Box
      component={Link}
      to={url}
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
            alt={image.title}
            fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3C/svg%3E"
          />
        </AspectRatio>
      </Card>
    </Box>
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
