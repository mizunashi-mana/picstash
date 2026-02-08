import { useCallback, useEffect, useState } from 'react';
import {
  ActionIcon,
  AspectRatio,
  Box,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { useHotkeys } from '@mantine/hooks';
import {
  IconChevronLeft,
  IconChevronRight,
  IconExternalLink,
} from '@tabler/icons-react';
import { Link } from 'react-router';
import type { Image as ImageType } from '@picstash/api';
import { LocalImage } from '@/shared';

export interface ImageCarouselProps {
  images: ImageType[];
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
}

export function ImageCarousel({ images, initialIndex = 0, onIndexChange }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const goToPrev = useCallback(() => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex(prev => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  useHotkeys([
    ['ArrowLeft', goToPrev],
    ['ArrowRight', goToNext],
  ]);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  // Clamp currentIndex when images array changes
  useEffect(() => {
    if (images.length > 0 && currentIndex >= images.length) {
      setCurrentIndex(images.length - 1);
    }
  }, [images.length, currentIndex]);

  // Notify parent when index changes
  useEffect(() => {
    onIndexChange?.(currentIndex);
  }, [currentIndex, onIndexChange]);

  if (images.length === 0) {
    return (
      <Stack align="center" py="xl">
        <Text c="dimmed" size="lg">
          画像がありません
        </Text>
      </Stack>
    );
  }

  // Safe to access after length check - clamp index to valid range
  const safeIndex = Math.max(0, Math.min(currentIndex, images.length - 1));
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- guaranteed by length check above
  const currentImage = images[safeIndex]!;

  return (
    <Stack gap="md" style={{ height: 'calc(100vh - 250px)' }}>
      {/* Main image area */}
      <Paper
        withBorder
        radius="md"
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        {/* Navigation buttons */}
        <ActionIcon
          variant="filled"
          color="dark"
          size="xl"
          radius="xl"
          style={{
            position: 'absolute',
            left: 16,
            zIndex: 10,
            opacity: 0.8,
          }}
          onClick={goToPrev}
          aria-label="前の画像"
        >
          <IconChevronLeft size={24} />
        </ActionIcon>

        <ActionIcon
          variant="filled"
          color="dark"
          size="xl"
          radius="xl"
          style={{
            position: 'absolute',
            right: 16,
            zIndex: 10,
            opacity: 0.8,
          }}
          onClick={goToNext}
          aria-label="次の画像"
        >
          <IconChevronRight size={24} />
        </ActionIcon>

        {/* Link to detail page */}
        <ActionIcon
          component={Link}
          to={`/images/${currentImage.id}`}
          variant="filled"
          color="dark"
          size="lg"
          radius="xl"
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 10,
            opacity: 0.8,
          }}
          aria-label="詳細を表示"
        >
          <IconExternalLink size={18} />
        </ActionIcon>

        {/* Main image */}
        <Box
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <LocalImage
            path={currentImage.path}
            alt={currentImage.title}
            fit="contain"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
            }}
          />
        </Box>

        {/* Image counter */}
        <Text
          size="sm"
          c="dimmed"
          style={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            color: 'white',
            padding: '4px 12px',
            borderRadius: 12,
          }}
        >
          {safeIndex + 1}
          {' / '}
          {images.length}
        </Text>
      </Paper>

      {/* Thumbnail strip */}
      <Paper withBorder radius="md" p="xs">
        <ScrollArea type="scroll" scrollbarSize={8}>
          <Group gap="xs" wrap="nowrap" justify="center">
            {images.map((image, index) => (
              <UnstyledButton
                key={image.id}
                onClick={() => { setCurrentIndex(index); }}
                aria-label={`${image.title} (${index + 1}/${images.length})`}
                aria-current={index === safeIndex ? 'true' : undefined}
                style={{
                  borderRadius: 8,
                  overflow: 'hidden',
                  border:
                    index === safeIndex
                      ? '3px solid var(--mantine-color-blue-filled)'
                      : '3px solid transparent',
                  opacity: index === safeIndex ? 1 : 0.6,
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                }}
              >
                <AspectRatio ratio={1} w={60}>
                  <LocalImage
                    path={image.thumbnailPath}
                    alt={image.title}
                    fit="cover"
                  />
                </AspectRatio>
              </UnstyledButton>
            ))}
          </Group>
        </ScrollArea>
      </Paper>
    </Stack>
  );
}
