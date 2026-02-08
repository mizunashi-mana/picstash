/* v8 ignore file -- Container: Hook と View を接続するだけなので Storybook テストでカバー */
import { useQuery } from '@tanstack/react-query';
import { useApiClient } from '@/shared';
import { SimilarImagesSectionView } from './SimilarImagesSectionView';

interface SimilarImagesSectionProps {
  imageId: string;
}

export function SimilarImagesSection({ imageId }: SimilarImagesSectionProps) {
  const apiClient = useApiClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['similarImages', imageId],
    queryFn: async () => await apiClient.images.fetchSimilar(imageId, { limit: 10 }),
  });

  return (
    <SimilarImagesSectionView
      similarImages={data?.similarImages ?? []}
      isLoading={isLoading}
      error={error}
      getThumbnailUrl={apiClient.images.getThumbnailUrl}
    />
  );
}
