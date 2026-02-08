/* v8 ignore file -- View: 純粋な描画コンポーネントなので Storybook テストでカバー */
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
import type { CrawledImage } from '@picstash/api';

export interface CrawlPreviewGalleryViewProps {
  sessionId: string;
  images: CrawledImage[];
  selectedIndices: Set<number>;
  previewImage: CrawledImage | null;
  previewOpened: boolean;
  onSelectionToggle: (index: number) => void;
  onPreviewClick: (image: CrawledImage, event: React.MouseEvent) => void;
  onPreviewClose: () => void;
  getThumbnailUrl: (sessionId: string, imageIndex: number) => string;
  getImageUrl: (sessionId: string, imageIndex: number) => string;
}

export function CrawlPreviewGalleryView({
  sessionId,
  images,
  selectedIndices,
  previewImage,
  previewOpened,
  onSelectionToggle,
  onPreviewClick,
  onPreviewClose,
  getThumbnailUrl,
  getImageUrl,
}: CrawlPreviewGalleryViewProps) {
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
              onSelectionToggle(image.index);
            }}
          >
            <Card.Section pos="relative">
              <AspectRatio ratio={1}>
                <Image
                  src={getThumbnailUrl(sessionId, image.index)}
                  alt={image.alt ?? image.filename}
                  fit="cover"
                  fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23dee2e6' width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23868e96' font-size='12'%3ELoading%3C/text%3E%3C/svg%3E"
                  onClick={(e) => {
                    onPreviewClick(image, e);
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
                    onSelectionToggle(image.index);
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

      <Modal opened={previewOpened} onClose={onPreviewClose} size="xl" title={previewImage?.filename} centered>
        {previewImage !== null && (
          <Image
            src={getImageUrl(sessionId, previewImage.index)}
            alt={previewImage.alt ?? previewImage.filename}
            fit="contain"
            mah="70vh"
          />
        )}
      </Modal>
    </>
  );
}
