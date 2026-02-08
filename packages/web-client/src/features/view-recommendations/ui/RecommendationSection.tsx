/* v8 ignore file -- Container: Hook と View を接続するだけなので Storybook テストでカバー */
import { RecommendationSectionView } from '@/features/view-recommendations/ui/RecommendationSectionView';
import { useRecommendationSectionViewProps } from '@/features/view-recommendations/ui/useRecommendationSectionViewProps';

export function RecommendationSection(): React.JSX.Element {
  const viewProps = useRecommendationSectionViewProps();
  return <RecommendationSectionView {...viewProps} />;
}
