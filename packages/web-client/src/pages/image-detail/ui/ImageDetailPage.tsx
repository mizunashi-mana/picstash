/* v8 ignore file -- Container: Hook と View を接続するだけなので Storybook テストでカバー */
import { ImageDetailPageView } from '@/pages/image-detail/ui/ImageDetailPageView';
import { useImageDetailPageViewProps } from '@/pages/image-detail/ui/useImageDetailPageViewProps';

export function ImageDetailPage(): React.JSX.Element {
  const viewProps = useImageDetailPageViewProps();
  return <ImageDetailPageView {...viewProps} />;
}
