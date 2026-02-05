import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router';
import { useApiClient } from '@/shared';
import type { CollectionViewerPageViewProps } from '@/pages/collections/ui/CollectionViewerPageView';

export function useCollectionViewerPageViewProps(): CollectionViewerPageViewProps {
  const { id, imageId: initialImageId } = useParams<{ id: string; imageId?: string }>();
  const navigate = useNavigate();
  const apiClient = useApiClient();
  const { data: collection, isLoading, error } = useQuery({
    queryKey: ['collection', id],
    queryFn: async () => {
      if (id === undefined) throw new Error('Collection ID is required');
      return await apiClient.collections.detail(id);
    },
    enabled: id !== undefined,
  });

  const initialIndex = useMemo(() => {
    if (collection === undefined || initialImageId === undefined) return 0;
    const index = collection.images.findIndex(img => img.imageId === initialImageId);
    return index !== -1 ? index : 0;
  }, [collection, initialImageId]);

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const currentImage = useMemo(() => {
    if (collection === undefined || collection.images.length === 0) return null;
    return collection.images[currentIndex] ?? null;
  }, [collection, currentIndex]);

  const canGoPrev = currentIndex > 0;
  const canGoNext = collection !== undefined && currentIndex < collection.images.length - 1;

  const goToPrev = useCallback(() => {
    if (canGoPrev && collection !== undefined) {
      const newIndex = currentIndex - 1;
      const newImageId = collection.images[newIndex]?.imageId;
      setCurrentIndex(newIndex);
      if (newImageId !== undefined) {
        void navigate(`/collections/${id}/view/${newImageId}`, { replace: true });
      }
    }
  }, [canGoPrev, collection, currentIndex, id, navigate]);

  const goToNext = useCallback(() => {
    if (canGoNext) {
      const newIndex = currentIndex + 1;
      const newImageId = collection.images[newIndex]?.imageId;
      setCurrentIndex(newIndex);
      if (newImageId !== undefined) {
        void navigate(`/collections/${id}/view/${newImageId}`, { replace: true });
      }
    }
  }, [canGoNext, collection, currentIndex, id, navigate]);

  const handleClose = useCallback(() => {
    void navigate(`/collections/${id}`);
  }, [navigate, id]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          goToPrev();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNext();
          break;
        case 'Escape':
          handleClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [goToPrev, goToNext, handleClose]);

  return {
    id,
    collection,
    isLoading,
    error,
    currentIndex,
    currentImage,
    canGoPrev,
    canGoNext,
    onGoPrev: goToPrev,
    onGoNext: goToNext,
    onClose: handleClose,
  };
}
