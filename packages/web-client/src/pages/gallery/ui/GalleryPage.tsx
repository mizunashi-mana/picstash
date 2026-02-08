/* v8 ignore file -- Container: Hook と View を接続するだけなので Storybook テストでカバー */
import { GalleryPageView } from '@/pages/gallery/ui/GalleryPageView';
import { useGalleryPageViewProps } from '@/pages/gallery/ui/useGalleryPageViewProps';

export function GalleryPage(): React.JSX.Element {
  const viewProps = useGalleryPageViewProps();
  return <GalleryPageView {...viewProps} />;
}
