import { useState } from 'react';
import {
  ActionIcon,
  Alert,
  Box,
  Button,
  Container,
  Group,
  Image,
  Loader,
  Modal,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconArrowLeft, IconTrash } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { deleteImage, fetchImage, getImageUrl } from '@/entities/image';
import { SimilarImagesSection } from '@/features/find-similar-images';
import { ImageAttributeSection } from '@/features/manage-image-attributes';
import { ImageCollectionsSection } from '@/features/manage-image-collections';
import { ImageDescriptionSection } from '@/features/manage-image-description';
import { useViewHistory } from '@/features/track-view-history';

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
  const [searchParams] = useSearchParams();
  const conversionId = searchParams.get('conversionId');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [opened, { open, close }] = useDisclosure(false);
  const [isDeleted, setIsDeleted] = useState(false);

  const { data: image, isLoading, error } = useQuery({
    queryKey: ['image', id],
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- enabled ensures id is defined
    queryFn: async () => await fetchImage(id!),
    enabled: id !== undefined && id !== '',
  });

  const deleteMutation = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- button is disabled when id is undefined
    mutationFn: async () => { await deleteImage(id!); },
    onSuccess: async () => {
      // Mark as deleted before navigation to prevent view history update
      setIsDeleted(true);
      close();
      // Invalidate caches that may contain the deleted image
      await queryClient.invalidateQueries({ queryKey: ['images'] });
      await queryClient.invalidateQueries({ queryKey: ['images-paginated'] });
      await queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      await navigate('/gallery');
    },
  });

  // Track view history for this image
  // If conversionId is present, also record the recommendation click
  // Skip cleanup if image was deleted (view history is cascade deleted)
  useViewHistory(id, { conversionId, isDeleted });

  if (isLoading) {
    return (
      <Container size="lg" py="xl">
        <Stack align="center" py="xl">
          <Loader size="lg" />
          <Text c="dimmed">画像を読み込み中...</Text>
        </Stack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="lg" py="xl">
        <Alert color="red" title="エラー">
          画像の読み込みに失敗しました:
          {' '}
          {error.message}
        </Alert>
      </Container>
    );
  }

  if (!image) {
    return (
      <Container size="lg" py="xl">
        <Alert color="yellow" title="見つかりません">
          画像が見つかりません
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
            to="/gallery"
            aria-label="ギャラリーに戻る"
          >
            <IconArrowLeft size={20} />
          </ActionIcon>
          <Title order={3} lineClamp={1} style={{ flex: 1 }}>
            {image.id}
          </Title>
          <ActionIcon
            variant="subtle"
            size="lg"
            color="red"
            onClick={open}
            aria-label="画像を削除"
          >
            <IconTrash size={20} />
          </ActionIcon>
        </Group>

        <Box>
          <Image
            src={getImageUrl(image.id)}
            alt={image.title}
            fit="contain"
            mah="70vh"
            radius="md"
          />
        </Box>

        <ImageDescriptionSection
          imageId={image.id}
          description={image.description}
        />

        <ImageAttributeSection imageId={image.id} />

        <ImageCollectionsSection imageId={image.id} />

        <SimilarImagesSection imageId={image.id} />

        <Paper p="md" withBorder>
          <Stack gap="xs">
            <Title order={5}>ファイル情報</Title>
            {image.width !== null && image.height !== null && (
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

      <Modal opened={opened} onClose={close} title="画像を削除" centered>
        <Stack>
          <Text>この画像を削除しますか？この操作は取り消せません。</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={close}>
              キャンセル
            </Button>
            <Button
              color="red"
              onClick={() => { deleteMutation.mutate(); }}
              loading={deleteMutation.isPending}
            >
              削除
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
