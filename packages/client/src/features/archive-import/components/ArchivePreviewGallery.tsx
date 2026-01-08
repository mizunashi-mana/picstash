import { useState } from 'react';
import {
  AspectRatio,
  Card,
  Image,
  Modal,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  getArchiveImageUrl,
  getArchiveThumbnailUrl,
} from '@/features/archive-import/api';
import type { ArchiveImage } from '@/features/archive-import/api';

export interface ArchivePreviewGalleryProps {
  sessionId: string;
  images: ArchiveImage[];
}

export function ArchivePreviewGallery({
  sessionId,
  images,
}: ArchivePreviewGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<ArchiveImage | null>(null);
  const [opened, { open, close }] = useDisclosure(false);

  const handleImageClick = (image: ArchiveImage) => {
    setSelectedImage(image);
    open();
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
            style={{ cursor: 'pointer' }}
            onClick={() => handleImageClick(image)}
          >
            <Card.Section>
              <AspectRatio ratio={1}>
                <Image
                  src={getArchiveThumbnailUrl(sessionId, image.index)}
                  alt={image.filename}
                  fit="cover"
                  fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23dee2e6' width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23868e96' font-size='12'%3ELoading%3C/text%3E%3C/svg%3E"
                />
              </AspectRatio>
            </Card.Section>
            <Text size="xs" c="dimmed" mt="xs" lineClamp={1}>
              {image.filename}
            </Text>
          </Card>
        ))}
      </SimpleGrid>

      <Modal
        opened={opened}
        onClose={close}
        size="xl"
        title={selectedImage?.filename}
        centered
      >
        {selectedImage && (
          <Image
            src={getArchiveImageUrl(sessionId, selectedImage.index)}
            alt={selectedImage.filename}
            fit="contain"
            mah="70vh"
          />
        )}
      </Modal>
    </>
  );
}
