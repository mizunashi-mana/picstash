import { useState } from 'react';
import {
  AspectRatio,
  Box,
  Card,
  Checkbox,
  Image,
  Modal,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { getCrawlImageUrl, getCrawlThumbnailUrl } from '@/features/url-crawl/api';
import type { CrawledImage } from '@/features/url-crawl/api';

export interface CrawlPreviewGalleryProps {
  sessionId: string;
  images: CrawledImage[];
  selectedIndices: Set<number>;
  onSelectionChange: (indices: Set<number>) => void;
}

export function CrawlPreviewGallery({
  sessionId,
  images,
  selectedIndices,
  onSelectionChange,
}: CrawlPreviewGalleryProps) {
  const [previewImage, setPreviewImage] = useState<CrawledImage | null>(null);
  const [opened, { open, close }] = useDisclosure(false);

  const handlePreviewClick = (image: CrawledImage, event: React.MouseEvent) => {
    event.stopPropagation();
    setPreviewImage(image);
    open();
  };

  const handleSelectionToggle = (index: number) => {
    const newSelection = new Set(selectedIndices);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    }
    else {
      newSelection.add(index);
    }
    onSelectionChange(newSelection);
  };

  if (images.length === 0) {
    return (
      <Stack align="center" py="xl">
        <Text c="dimmed" size="lg">
          画像がありません
        </Text>
      </Stack>
    );
  }

  return (
    <>
      <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing="md">
        {images.map(image => (
          <Card
            key={image.index}
            padding="xs"
            radius="md"
            withBorder
            style={{
              cursor: 'pointer',
              outline: selectedIndices.has(image.index)
                ? '2px solid var(--mantine-color-blue-6)'
                : 'none',
            }}
            onClick={() => {
              handleSelectionToggle(image.index);
            }}
          >
            <Card.Section pos="relative">
              <AspectRatio ratio={1}>
                <Image
                  src={getCrawlThumbnailUrl(sessionId, image.index)}
                  alt={image.alt ?? image.filename}
                  fit="cover"
                  fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23dee2e6' width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23868e96' font-size='12'%3ELoading%3C/text%3E%3C/svg%3E"
                  onClick={(e) => {
                    handlePreviewClick(image, e);
                  }}
                />
              </AspectRatio>
              <Box
                pos="absolute"
                top={8}
                left={8}
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <Checkbox
                  checked={selectedIndices.has(image.index)}
                  onChange={() => {
                    handleSelectionToggle(image.index);
                  }}
                  size="md"
                  color="blue"
                  styles={{
                    input: {
                      backgroundColor: selectedIndices.has(image.index)
                        ? undefined
                        : 'rgba(255, 255, 255, 0.9)',
                    },
                  }}
                />
              </Box>
            </Card.Section>
            <Text size="xs" c="dimmed" mt="xs" lineClamp={1}>
              {image.filename}
            </Text>
          </Card>
        ))}
      </SimpleGrid>

      <Modal opened={opened} onClose={close} size="xl" title={previewImage?.filename} centered>
        {previewImage !== null && (
          <Image
            src={getCrawlImageUrl(sessionId, previewImage.index)}
            alt={previewImage.alt ?? previewImage.filename}
            fit="contain"
            mah="70vh"
          />
        )}
      </Modal>
    </>
  );
}
