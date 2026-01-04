import { useQuery } from '@tanstack/react-query';
import { fetchImages } from '@/features/gallery/api';
import { ImageGalleryView } from './ImageGalleryView';

export function ImageGallery() {
  const { data: images, isLoading, error } = useQuery({
    queryKey: ['images'],
    queryFn: fetchImages,
  });

  return (
    <ImageGalleryView
      images={images}
      isLoading={isLoading}
      error={error}
    />
  );
}
