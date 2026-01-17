import { useCallback, useEffect, useMemo, useState } from 'react';
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
import {
  IconAlertCircle,
  IconArrowLeft,
  IconChevronLeft,
  IconChevronRight,
  IconX,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router';
import { fetchCollection } from '@/features/collections/api';

function getImageUrl(imageId: string): string {
  return `/api/images/${imageId}/file`;
}

export function CollectionViewerPage(): React.JSX.Element {
  const { id, imageId: initialImageId } = useParams<{ id: string; imageId?: string }>();
  const navigate = useNavigate();
  const { data: collection, isLoading, error } = useQuery({
    queryKey: ['collection', id],
    queryFn: async () => {
      if (id === undefined) throw new Error('Collection ID is required');
      return await fetchCollection(id);
    },
    enabled: id !== undefined,
  });

  // Calculate initial index based on imageId parameter
  const initialIndex = useMemo(() => {
    if (collection === undefined || initialImageId === undefined) return 0;
    const index = collection.images.findIndex(img => img.imageId === initialImageId);
    return index !== -1 ? index : 0;
  }, [collection, initialImageId]);

  const [currentIndex, setCurrentIndex] = useState(0);

  // Sync initial index when collection loads
  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const currentImage = useMemo(() => {
    if (collection === undefined || collection.images.length === 0) return null;
    return collection.images[currentIndex] ?? null;
  }, [collection, currentIndex]);

  const canGoPrev = currentIndex > 0;
  const canGoNext = collection !== undefined && currentIndex < collection.images.length - 1;

  const goToPrev = useCallback(() => {
    if (canGoPrev && collection !== undefined) {
      const newIndex = currentIndex - 1;
      const newImageId = collection.images[newIndex]?.imageId;
      setCurrentIndex(newIndex);
      if (newImageId !== undefined) {
        void navigate(`/collections/${id}/view/${newImageId}`, { replace: true });
      }
    }
  }, [canGoPrev, collection, currentIndex, id, navigate]);

  const goToNext = useCallback(() => {
    // canGoNext guarantees collection is defined
    if (canGoNext) {
      const newIndex = currentIndex + 1;
      const newImageId = collection.images[newIndex]?.imageId;
      setCurrentIndex(newIndex);
      if (newImageId !== undefined) {
        void navigate(`/collections/${id}/view/${newImageId}`, { replace: true });
      }
    }
  }, [canGoNext, collection, currentIndex, id, navigate]);

  const handleClose = useCallback(() => {
    void navigate(`/collections/${id}`);
  }, [navigate, id]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          goToPrev();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNext();
          break;
        case 'Escape':
          handleClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [goToPrev, goToNext, handleClose]);

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
        <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
          {error instanceof Error ? error.message : 'Collection not found'}
        </Alert>
      </Center>
    );
  }

  if (collection.images.length === 0) {
    return (
      <Center h="100vh">
        <Stack align="center" gap="md">
          <Text c="dimmed">No images in this collection</Text>
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
            aria-label="Back to collection"
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
            onClick={handleClose}
            aria-label="Close viewer"
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
          onClick={goToPrev}
          disabled={!canGoPrev}
          aria-label="Previous image"
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
              src={getImageUrl(currentImage.imageId)}
              alt={`Image ${currentIndex + 1} of ${collection.images.length}: ${currentImage.filename}`}
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
          onClick={goToNext}
          disabled={!canGoNext}
          aria-label="Next image"
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

      {/* Footer - filename */}
      <Box p="sm" style={{ flexShrink: 0, textAlign: 'center' }}>
        <Text c="dimmed" size="sm">
          {currentImage?.filename}
        </Text>
      </Box>
    </Box>
  );
}
