import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';
import {
  deleteAllSearchHistory,
  saveSearchHistory,
} from '@/features/search-images';
import { useApiClient } from '@/shared';
import { ImageGalleryView } from './ImageGalleryView';

export function ImageGallery() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const [isExpanded, setIsExpanded] = useState(query !== '');
  const queryClient = useQueryClient();
  const apiClient = useApiClient();

  const { data: images, isLoading, error } = useQuery({
    queryKey: ['images', query],
    queryFn: async () => await apiClient.images.list({ q: query !== '' ? query : undefined }),
    enabled: isExpanded,
  });

  // Save search history mutation (fire and forget)
  const saveHistoryMutation = useMutation({
    mutationFn: saveSearchHistory,
  });

  // Delete all history mutation
  const deleteAllHistoryMutation = useMutation({
    mutationFn: deleteAllSearchHistory,
    onSuccess: () => {
      // Invalidate suggestions to refresh the list
      void queryClient.invalidateQueries({ queryKey: ['search-suggestions'] });
    },
  });

  const handleSearchChange = useCallback(
    (value: string) => {
      if (value === '') {
        setSearchParams({});
      }
      else {
        setSearchParams({ q: value });
        // Save to search history (async, don't block UI)
        saveHistoryMutation.mutate(value);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mutate is stable
    [setSearchParams],
  );

  const handleToggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const handleDeleteAllHistory = useCallback(() => {
    deleteAllHistoryMutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mutate is stable
  }, []);

  return (
    <ImageGalleryView
      images={images}
      isLoading={isLoading}
      error={error}
      searchQuery={query}
      onSearchChange={handleSearchChange}
      isExpanded={isExpanded}
      onToggleExpand={handleToggleExpand}
      onDeleteAllHistory={handleDeleteAllHistory}
      getThumbnailUrl={apiClient.images.getThumbnailUrl}
    />
  );
}
