import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';
import { fetchImages } from '@/features/gallery/api';
import { ImageGalleryView } from './ImageGalleryView';

export function ImageGallery() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';

  const { data: images, isLoading, error } = useQuery({
    queryKey: ['images', query],
    queryFn: async () => fetchImages(query),
  });

  const handleSearchChange = useCallback((value: string) => {
    if (value === '') {
      setSearchParams({});
    }
    else {
      setSearchParams({ q: value });
    }
  }, [setSearchParams]);

  return (
    <ImageGalleryView
      images={images}
      isLoading={isLoading}
      error={error}
      searchQuery={query}
      onSearchChange={handleSearchChange}
    />
  );
}
