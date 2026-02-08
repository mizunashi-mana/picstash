/* v8 ignore file -- Container: Hook と View を接続するだけなので Storybook テストでカバー */
import { StatsPageView } from '@/pages/stats/ui/StatsPageView';
import { useStatsPageViewProps } from '@/pages/stats/ui/useStatsPageViewProps';

export function StatsPage(): React.JSX.Element {
  const viewProps = useStatsPageViewProps();
  return <StatsPageView {...viewProps} />;
}
