/* v8 ignore file -- Container: Hook と View を接続するだけなので Storybook テストでカバー */
import { DuplicatesPageView } from '@/pages/duplicates/ui/DuplicatesPageView';
import { useDuplicatesPageViewProps } from '@/pages/duplicates/ui/useDuplicatesPageViewProps';

export function DuplicatesPage(): React.JSX.Element {
  const viewProps = useDuplicatesPageViewProps();
  return <DuplicatesPageView {...viewProps} />;
}
