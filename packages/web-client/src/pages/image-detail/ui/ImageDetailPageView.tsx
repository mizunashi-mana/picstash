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
import { IconArrowLeft, IconTrash } from '@tabler/icons-react';
import { Link } from 'react-router';
import { SimilarImagesSection } from '@/features/find-similar-images';
import { ImageAttributeSection } from '@/features/manage-image-attributes';
import { ImageCollectionsSection } from '@/features/manage-image-collections';
import { ImageDescriptionSection } from '@/features/manage-image-description';
import { formatDate, formatFileSize } from '@/pages/image-detail/lib/format';
import type { Image as ImageType } from '@/entities/image';

export interface ImageDetailPageViewProps {
  /** 画像データ */
  image: ImageType | undefined;
  /** 画像ファイル URL */
  imageUrl: string | undefined;
  /** ローディング中 */
  isLoading: boolean;
  /** エラー */
  error: Error | null;
  /** 削除確認モーダルの開閉状態 */
  deleteModalOpened: boolean;
  /** 削除処理中 */
  isDeleting: boolean;
  /** 削除モーダルを開く */
  onOpenDeleteModal: () => void;
  /** 削除モーダルを閉じる */
  onCloseDeleteModal: () => void;
  /** 削除実行 */
  onDelete: () => void;
}

export function ImageDetailPageView({
  image,
  imageUrl,
  isLoading,
  error,
  deleteModalOpened,
  isDeleting,
  onOpenDeleteModal,
  onCloseDeleteModal,
  onDelete,
}: ImageDetailPageViewProps) {
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
            onClick={onOpenDeleteModal}
            aria-label="画像を削除"
          >
            <IconTrash size={20} />
          </ActionIcon>
        </Group>

        <Box>
          <Image
            src={imageUrl}
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

      <Modal opened={deleteModalOpened} onClose={onCloseDeleteModal} title="画像を削除" centered>
        <Stack>
          <Text>この画像を削除しますか？この操作は取り消せません。</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={onCloseDeleteModal}>
              キャンセル
            </Button>
            <Button
              color="red"
              onClick={onDelete}
              loading={isDeleting}
            >
              削除
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
