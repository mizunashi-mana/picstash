/* v8 ignore file -- Container: Hook と View を接続するだけなので Storybook テストでカバー */
import { CollectionsPageView } from '@/pages/collections/ui/CollectionsPageView';
import { useCollectionsPageViewProps } from '@/pages/collections/ui/useCollectionsPageViewProps';

export function CollectionsPage(): React.JSX.Element {
  const viewProps = useCollectionsPageViewProps();
  return <CollectionsPageView {...viewProps} />;
}
