import { useQuery } from '@tanstack/react-query';
import { fetchSimilarImages } from '@/features/find-similar-images/api/similar';
import { SimilarImagesSectionView } from './SimilarImagesSectionView';

interface SimilarImagesSectionProps {
  imageId: string;
}

export function SimilarImagesSection({ imageId }: SimilarImagesSectionProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['similarImages', imageId],
    queryFn: async () => await fetchSimilarImages(imageId, { limit: 10 }),
  });

  return (
    <SimilarImagesSectionView
      similarImages={data?.similarImages ?? []}
      isLoading={isLoading}
      error={error}
    />
  );
}
