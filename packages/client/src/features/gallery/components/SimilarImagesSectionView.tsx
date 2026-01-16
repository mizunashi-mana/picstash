import {
  Alert,
  Card,
  Group,
  Image,
  Loader,
  SimpleGrid,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { IconPhoto } from '@tabler/icons-react';
import { Link } from 'react-router';
import { getThumbnailUrl } from '@/features/gallery/api';
import type { SimilarImage } from '@/features/gallery/api';

export interface SimilarImagesSectionViewProps {
  similarImages: SimilarImage[];
  isLoading: boolean;
  error: Error | null;
}

function SimilarityScore({ distance }: { distance: number }) {
  // Convert distance to similarity percentage (lower distance = higher similarity)
  // Distance ranges from 0 (identical) to ~2 (very different)
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
            {error.message.includes('embedding')
              ? '埋め込みが生成されていないため、類似画像を検索できません。'
              : '類似画像の取得に失敗しました。'}
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
                  {image.thumbnailPath !== null
                    ? (
                        <Image
                          src={getThumbnailUrl(image.id)}
                          alt={image.filename}
                          radius="sm"
                          h={80}
                          fit="cover"
                        />
                      )
                    : (
                        <Group
                          justify="center"
                          align="center"
                          h={80}
                          bg="gray.1"
                          style={{ borderRadius: 'var(--mantine-radius-sm)' }}
                        >
                          <IconPhoto size={24} color="gray" />
                        </Group>
                      )}
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
