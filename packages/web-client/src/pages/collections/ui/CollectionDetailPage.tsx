/* v8 ignore file -- Container: Hook と View を接続するだけなので Storybook テストでカバー */
import { CollectionDetailPageView } from '@/pages/collections/ui/CollectionDetailPageView';
import { useCollectionDetailPageViewProps } from '@/pages/collections/ui/useCollectionDetailPageViewProps';

export function CollectionDetailPage(): React.JSX.Element {
  const viewProps = useCollectionDetailPageViewProps();
  return <CollectionDetailPageView {...viewProps} />;
}
