import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '@/shared';
import type { ImageCollectionsSectionViewProps } from '@/features/manage-image-collections/ui/ImageCollectionsSectionView';

export function useImageCollectionsSectionViewProps(imageId: string): ImageCollectionsSectionViewProps {
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const apiClient = useApiClient();

  // === Queries ===
  const { data: imageCollections } = useQuery({
    queryKey: ['imageCollections', imageId],
    queryFn: async () => await apiClient.collections.fetchImageCollections(imageId),
  });

  const { data: allCollections } = useQuery({
    queryKey: ['collections'],
    queryFn: async () => await apiClient.collections.list(),
  });

  // === Mutations ===
  const addMutation = useMutation({
    mutationFn: async (collectionId: string) => {
      await apiClient.collections.addImage(collectionId, { imageId });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['imageCollections', imageId] });
      await queryClient.invalidateQueries({ queryKey: ['collections'] });
      setSelectedCollectionId(null);
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (collectionId: string) => {
      await apiClient.collections.removeImage(collectionId, imageId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['imageCollections', imageId] });
      await queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });

  // === Selectors ===
  const imageCollectionIds = new Set(imageCollections?.map(c => c.id) ?? []);
  const availableCollections = allCollections?.filter(c => !imageCollectionIds.has(c.id)) ?? [];

  // === Handlers ===
  const handleAdd = (): void => {
    if (selectedCollectionId === null) return;
    addMutation.mutate(selectedCollectionId);
  };

  const handleRemove = (collectionId: string): void => {
    removeMutation.mutate(collectionId);
  };

  return {
    imageCollections,
    availableCollections: availableCollections.map(c => ({ value: c.id, label: c.name })),
    hasAnyCollections: (allCollections?.length ?? 0) > 0,
    selectedCollectionId,
    isAdding: addMutation.isPending,
    onSelectedCollectionIdChange: setSelectedCollectionId,
    onAdd: handleAdd,
    onRemove: handleRemove,
  };
}
