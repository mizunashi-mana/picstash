import { useState } from 'react';
import { useDisclosure } from '@mantine/hooks';
import type { CrawledImage } from '@/features/import-url/api/crawl';
import type { CrawlPreviewGalleryViewProps } from '@/features/import-url/ui/CrawlPreviewGalleryView';

interface CrawlPreviewGalleryInputProps {
  sessionId: string;
  images: CrawledImage[];
  selectedIndices: Set<number>;
  onSelectionChange: (indices: Set<number>) => void;
}

export function useCrawlPreviewGalleryViewProps(
  props: CrawlPreviewGalleryInputProps,
): CrawlPreviewGalleryViewProps {
  const [previewImage, setPreviewImage] = useState<CrawledImage | null>(null);
  const [opened, { open, close }] = useDisclosure(false);

  const handlePreviewClick = (image: CrawledImage, event: React.MouseEvent): void => {
    event.stopPropagation();
    setPreviewImage(image);
    open();
  };

  const handleSelectionToggle = (index: number): void => {
    const newSelection = new Set(props.selectedIndices);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    }
    else {
      newSelection.add(index);
    }
    props.onSelectionChange(newSelection);
  };

  return {
    sessionId: props.sessionId,
    images: props.images,
    selectedIndices: props.selectedIndices,
    previewImage,
    previewOpened: opened,
    onSelectionToggle: handleSelectionToggle,
    onPreviewClick: handlePreviewClick,
    onPreviewClose: close,
  };
}
