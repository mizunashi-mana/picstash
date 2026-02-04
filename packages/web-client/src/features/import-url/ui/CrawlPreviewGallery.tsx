import { CrawlPreviewGalleryView } from '@/features/import-url/ui/CrawlPreviewGalleryView';
import { useCrawlPreviewGalleryViewProps } from '@/features/import-url/ui/useCrawlPreviewGalleryViewProps';
import type { CrawledImage } from '@/features/import-url/api/crawl';

export interface CrawlPreviewGalleryProps {
  sessionId: string;
  images: CrawledImage[];
  selectedIndices: Set<number>;
  onSelectionChange: (indices: Set<number>) => void;
}

export function CrawlPreviewGallery(props: CrawlPreviewGalleryProps): React.JSX.Element {
  const viewProps = useCrawlPreviewGalleryViewProps(props);
  return <CrawlPreviewGalleryView {...viewProps} />;
}
