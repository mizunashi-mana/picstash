import {
  ActionIcon,
  Alert,
  Box,
  Center,
  Group,
  Image,
  Loader,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { imageEndpoints } from '@picstash/api';
import {
  IconAlertCircle,
  IconArrowLeft,
  IconChevronLeft,
  IconChevronRight,
  IconX,
} from '@tabler/icons-react';
import { Link } from 'react-router';
import type { CollectionImage, CollectionWithImages } from '@/entities/collection';

export interface CollectionViewerPageViewProps {
  id: string | undefined;
  collection: CollectionWithImages | undefined;
  isLoading: boolean;
  error: Error | null;
  currentIndex: number;
  currentImage: CollectionImage | null;
  canGoPrev: boolean;
  canGoNext: boolean;
  onGoPrev: () => void;
  onGoNext: () => void;
  onClose: () => void;
}

export function CollectionViewerPageView({
  id,
  collection,
  isLoading,
  error,
  currentIndex,
  currentImage,
  canGoPrev,
  canGoNext,
  onGoPrev,
  onGoNext,
  onClose,
}: CollectionViewerPageViewProps): React.JSX.Element {
  if (isLoading) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  if (error !== null || collection === undefined) {
    return (
      <Center h="100vh">
        <Alert icon={<IconAlertCircle size={16} />} title="エラー" color="red">
          {error instanceof Error ? error.message : 'コレクションが見つかりません'}
        </Alert>
      </Center>
    );
  }

  if (collection.images.length === 0) {
    return (
      <Center h="100vh">
        <Stack align="center" gap="md">
          <Text c="dimmed">このコレクションには画像がありません</Text>
          <ActionIcon
            variant="light"
            size="lg"
            component={Link}
            to={`/collections/${id}`}
          >
            <IconArrowLeft size={20} />
          </ActionIcon>
        </Stack>
      </Center>
    );
  }

  return (
    <Box
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--mantine-color-dark-9)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Group justify="space-between" p="md" style={{ flexShrink: 0 }}>
        <Group gap="sm">
          <ActionIcon
            variant="subtle"
            color="gray"
            size="lg"
            component={Link}
            to={`/collections/${id}`}
            aria-label="コレクションに戻る"
          >
            <IconArrowLeft size={20} />
          </ActionIcon>
          <Title order={5} c="dimmed">
            {collection.name}
          </Title>
        </Group>
        <Group gap="md">
          <Text c="dimmed" size="sm">
            {currentIndex + 1}
            {' / '}
            {collection.images.length}
          </Text>
          <ActionIcon
            variant="subtle"
            color="gray"
            size="lg"
            onClick={onClose}
            aria-label="ビューアを閉じる"
          >
            <IconX size={20} />
          </ActionIcon>
        </Group>
      </Group>

      {/* Main content */}
      <Box style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* Previous button */}
        <ActionIcon
          variant="subtle"
          color="gray"
          size="xl"
          onClick={onGoPrev}
          disabled={!canGoPrev}
          aria-label="前の画像"
          style={{
            position: 'absolute',
            left: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
          }}
        >
          <IconChevronLeft size={32} />
        </ActionIcon>

        {/* Image */}
        <Center h="100%">
          {currentImage !== null && (
            <Image
              src={imageEndpoints.file(currentImage.imageId)}
              alt={`${collection.images.length}枚中${currentIndex + 1}枚目`}
              fit="contain"
              style={{ maxHeight: '100%', maxWidth: '100%' }}
              fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23333' width='100' height='100'/%3E%3C/svg%3E"
            />
          )}
        </Center>

        {/* Next button */}
        <ActionIcon
          variant="subtle"
          color="gray"
          size="xl"
          onClick={onGoNext}
          disabled={!canGoNext}
          aria-label="次の画像"
          style={{
            position: 'absolute',
            right: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
          }}
        >
          <IconChevronRight size={32} />
        </ActionIcon>
      </Box>

      {/* Footer - page indicator */}
      <Box p="sm" style={{ flexShrink: 0, textAlign: 'center' }}>
        <Text c="dimmed" size="sm">
          {currentIndex + 1}
          {' / '}
          {collection.images.length}
        </Text>
      </Box>
    </Box>
  );
}
