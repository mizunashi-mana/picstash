/* v8 ignore file -- Container: Hook と View を接続するだけなので Storybook テストでカバー */
import { ImageUploadTabView } from '@/features/import/ui/ImageUploadTabView';
import { useImageUploadTabViewProps } from '@/features/import/ui/useImageUploadTabViewProps';

export function ImageUploadTab(): React.JSX.Element {
  const viewProps = useImageUploadTabViewProps();
  return <ImageUploadTabView {...viewProps} />;
}
