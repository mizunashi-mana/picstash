import { LabelsPageView } from '@/pages/labels/ui/LabelsPageView';
import { useLabelsPageViewProps } from '@/pages/labels/ui/useLabelsPageViewProps';

export function LabelsPage(): React.JSX.Element {
  const viewProps = useLabelsPageViewProps();
  return <LabelsPageView {...viewProps} />;
}
