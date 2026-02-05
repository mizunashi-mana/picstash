import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useElementSize, useMergedRef } from '@mantine/hooks';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useSearchParams } from 'react-router';
import {
  deleteAllSearchHistory,
  saveSearchHistory,
} from '@/features/search-images';
import { useApiClient, useViewMode } from '@/shared';
import type { GalleryPageViewProps } from '@/pages/gallery/ui/GalleryPageView';

const PAGE_SIZE = 50;

/** Grid spacing in pixels (matches Mantine's md spacing) */
const GRID_GAP = 16;

/** Card padding in pixels */
const CARD_PADDING = 8;

/** Minimum card width for responsive calculation */
const MIN_CARD_WIDTH = 150;

/** Calculate number of columns based on container width */
function calculateColumns(containerWidth: number): number {
  if (containerWidth === 0) return 2; // Default fallback
  // Calculate how many cards fit with gap
  const cols = Math.floor((containerWidth + GRID_GAP) / (MIN_CARD_WIDTH + GRID_GAP));
  return Math.max(2, Math.min(cols, 6)); // Clamp between 2 and 6
}

export function useGalleryPageViewProps(): GalleryPageViewProps {
  // === State ===
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useViewMode('grid');
  const apiClient = useApiClient();

  // Container size for responsive grid (merged with scroll container ref)
  const { ref: sizeRef, width: containerWidth } = useElementSize();
  const scrollRef = useRef<HTMLDivElement>(null);
  const parentRef = useMergedRef(sizeRef, scrollRef);

  // === Queries ===
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['images-paginated', query],
    queryFn: async ({ pageParam = 0 }) => {
      return await apiClient.images.listPaginated(query, {
        limit: PAGE_SIZE,
        offset: pageParam,
      });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const nextOffset = lastPage.offset + lastPage.items.length;
      return nextOffset < lastPage.total ? nextOffset : undefined;
    },
  });

  // === Selectors ===
  // Calculate grid layout
  const allImages = useMemo(
    () => data?.pages.flatMap(page => page.items) ?? [],
    [data],
  );
  const total = data?.pages[0]?.total ?? 0;

  const columns = calculateColumns(containerWidth);
  const rowCount = Math.ceil(allImages.length / columns);

  // Calculate item dimensions
  const cardWidth = containerWidth > 0
    ? (containerWidth - (columns - 1) * GRID_GAP) / columns
    : MIN_CARD_WIDTH;
  const rowHeight = cardWidth + CARD_PADDING * 2; // Square aspect ratio + padding

  // Virtual scroll
  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight + GRID_GAP,
    overscan: 3, // Render 3 extra rows above/below viewport
  });

  const virtualRows = virtualizer.getVirtualItems();

  // Fetch more when scrolling near the end (grid mode)
  useEffect(() => {
    if (viewMode !== 'grid') return;

    const lastRow = virtualRows[virtualRows.length - 1];
    if (
      lastRow !== undefined
      && lastRow.index >= rowCount - 2
      && hasNextPage
      && !isFetchingNextPage
    ) {
      void fetchNextPage();
    }
  }, [virtualRows, rowCount, hasNextPage, isFetchingNextPage, fetchNextPage, columns, viewMode]);

  // === Mutations ===
  // Save search history mutation
  const saveHistoryMutation = useMutation({
    mutationFn: saveSearchHistory,
  });

  // Delete all history mutation
  const deleteAllHistoryMutation = useMutation({
    mutationFn: deleteAllSearchHistory,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['search-suggestions'] });
    },
  });

  // === Handlers ===
  const handleSearchChange = useCallback(
    (value: string) => {
      if (value === '') {
        setSearchParams({});
      }
      else {
        setSearchParams({ q: value });
        saveHistoryMutation.mutate(value);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mutate is stable
    [setSearchParams],
  );

  const handleDeleteAllHistory = useCallback(() => {
    deleteAllHistoryMutation.mutate();
  }, [deleteAllHistoryMutation]);

  // Fetch more when carousel index approaches the end
  const handleCarouselIndexChange = useCallback((index: number) => {
    // Fetch next page when within 5 images of the end
    if (hasNextPage && !isFetchingNextPage && index >= allImages.length - 5) {
      void fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, allImages.length, fetchNextPage]);

  return {
    query,
    viewMode,
    allImages,
    total,
    isLoading,
    error,
    isFetchingNextPage,
    columns,
    virtualRows,
    virtualTotalSize: virtualizer.getTotalSize(),
    parentRef,
    getThumbnailUrl: apiClient.images.getThumbnailUrl,
    onSearchChange: handleSearchChange,
    onDeleteAllHistory: handleDeleteAllHistory,
    onViewModeChange: setViewMode,
    onCarouselIndexChange: handleCarouselIndexChange,
  };
}
