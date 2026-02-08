import {
  Alert,
  Card,
  Loader,
  SimpleGrid,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { Link } from 'react-router';
import type { SimilarImage } from '@picstash/api';
import { LocalImage } from '@/shared';

export interface SimilarImagesSectionViewProps {
  similarImages: SimilarImage[];
  isLoading: boolean;
  error: Error | null;
}

function SimilarityScore({ distance }: { distance: number }) {
  // Distance is cosine distance between L2-normalized embeddings, which ranges
  // from 0 (identical) to 2 (opposite), hence the normalization by 2 below.
  const similarity = Math.max(0, Math.round((1 - distance / 2) * 100));
  return (
    <Text size="xs" c="dimmed" ta="center">
      {similarity}
      %
    </Text>
  );
}

export function SimilarImagesSectionView({
  similarImages,
  isLoading,
  error,
}: SimilarImagesSectionViewProps) {
  return (
    <Card padding="md" withBorder>
      <Stack gap="md">
        <Title order={5}>類似画像</Title>

        {isLoading && (
          <Stack align="center" py="md">
            <Loader size="sm" />
            <Text size="sm" c="dimmed">
              類似画像を検索中...
            </Text>
          </Stack>
        )}

        {error !== null && (
          <Alert color="yellow" variant="light">
            類似画像の取得に失敗しました。
          </Alert>
        )}

        {!isLoading && error === null && similarImages.length === 0 && (
          <Text size="sm" c="dimmed" ta="center">
            類似画像が見つかりませんでした
          </Text>
        )}

        {!isLoading && error === null && similarImages.length > 0 && (
          <SimpleGrid cols={{ base: 3, sm: 4, md: 5 }} spacing="xs">
            {similarImages.map(image => (
              <UnstyledButton
                key={image.id}
                component={Link}
                to={`/images/${image.id}`}
              >
                <Stack gap={4}>
                  <LocalImage
                    path={image.thumbnailPath}
                    alt={image.title}
                    radius="sm"
                    h={80}
                    fit="cover"
                  />
                  <SimilarityScore distance={image.distance} />
                </Stack>
              </UnstyledButton>
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </Card>
  );
}
