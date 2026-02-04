import { ImageDetailPageView } from '@/pages/image-detail/ui/ImageDetailPageView';
import { useImageDetailPageViewProps } from '@/pages/image-detail/ui/useImageDetailPageViewProps';

export function ImageDetailPage(): React.JSX.Element {
  const viewProps = useImageDetailPageViewProps();
  return <ImageDetailPageView {...viewProps} />;
}
