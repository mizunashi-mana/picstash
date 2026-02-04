import { RecommendationSectionView } from '@/features/view-recommendations/ui/RecommendationSectionView';
import { useRecommendationSectionViewProps } from '@/features/view-recommendations/ui/useRecommendationSectionViewProps';

export function RecommendationSection(): React.JSX.Element {
  const viewProps = useRecommendationSectionViewProps();
  return <RecommendationSectionView {...viewProps} />;
}
