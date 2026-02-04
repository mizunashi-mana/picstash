import { ImageCollectionsSectionView } from '@/features/manage-image-collections/ui/ImageCollectionsSectionView';
import { useImageCollectionsSectionViewProps } from '@/features/manage-image-collections/ui/useImageCollectionsSectionViewProps';

interface ImageCollectionsSectionProps {
  imageId: string;
}

export function ImageCollectionsSection({ imageId }: ImageCollectionsSectionProps): React.JSX.Element {
  const viewProps = useImageCollectionsSectionViewProps(imageId);
  return <ImageCollectionsSectionView {...viewProps} />;
}
