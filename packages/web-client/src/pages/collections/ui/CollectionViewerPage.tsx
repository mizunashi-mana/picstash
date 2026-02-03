import { CollectionViewerPageView } from '@/pages/collections/ui/CollectionViewerPageView';
import { useCollectionViewerPageViewProps } from '@/pages/collections/ui/useCollectionViewerPageViewProps';

export function CollectionViewerPage(): React.JSX.Element {
  const viewProps = useCollectionViewerPageViewProps();
  return <CollectionViewerPageView {...viewProps} />;
}
