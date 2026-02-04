import { StatsPageView } from '@/pages/stats/ui/StatsPageView';
import { useStatsPageViewProps } from '@/pages/stats/ui/useStatsPageViewProps';

export function StatsPage(): React.JSX.Element {
  const viewProps = useStatsPageViewProps();
  return <StatsPageView {...viewProps} />;
}
