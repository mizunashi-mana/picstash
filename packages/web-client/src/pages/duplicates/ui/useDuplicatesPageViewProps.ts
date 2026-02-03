import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteDuplicateImage, fetchDuplicates } from '@/features/find-duplicates/api/duplicates';
import type { DuplicateGroup } from '@/features/find-duplicates/api/duplicates';
import type { DuplicatesPageViewProps } from '@/pages/duplicates/ui/DuplicatesPageView';

interface DeleteResult {
  successIds: string[];
  failedIds: string[];
}

export function useDuplicatesPageViewProps(): DuplicatesPageViewProps {
  const [threshold, setThreshold] = useState(0.1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['duplicates', threshold],
    queryFn: async () => await fetchDuplicates({ threshold }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (imageIds: string[]): Promise<DeleteResult> => {
      const results = await Promise.allSettled(
        imageIds.map(async id => await deleteDuplicateImage(id).then(() => id)),
      );

      const successIds: string[] = [];
      const failedIds: string[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successIds.push(result.value);
        }
        else {
          failedIds.push(imageIds[index] ?? '');
        }
      });

      return { successIds, failedIds };
    },
    onSuccess: async (result) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const id of result.successIds) {
          next.delete(id);
        }
        return next;
      });

      setDeleteModalOpen(false);

      if (result.failedIds.length > 0) {
        setDeleteError(
          `${result.failedIds.length.toString()}件の画像の削除に失敗しました。${result.successIds.length.toString()}件は正常に削除されました。`,
        );
      }
      else {
        setDeleteError(null);
      }

      await queryClient.invalidateQueries({ queryKey: ['duplicates'] });
      await queryClient.invalidateQueries({ queryKey: ['images'] });
    },
  });

  const handleSelectToggle = (imageId: string): void => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(imageId)) {
        next.delete(imageId);
      }
      else {
        next.add(imageId);
      }
      return next;
    });
  };

  const handleSelectAllDuplicates = (group: DuplicateGroup): void => {
    const allSelected = group.duplicates.every(dup => selectedIds.has(dup.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const dup of group.duplicates) {
        if (allSelected) {
          next.delete(dup.id);
        }
        else {
          next.add(dup.id);
        }
      }
      return next;
    });
  };

  const handleDeleteSelected = (): void => {
    if (selectedIds.size > 0) {
      setDeleteModalOpen(true);
    }
  };

  const handleConfirmDelete = (): void => {
    deleteMutation.mutate(Array.from(selectedIds));
  };

  const handleCloseDeleteModal = (): void => {
    setDeleteModalOpen(false);
  };

  const handleClearDeleteError = (): void => {
    setDeleteError(null);
  };

  return {
    threshold,
    selectedIds,
    deleteModalOpen,
    deleteError,
    data,
    isLoading,
    error,
    isDeleting: deleteMutation.isPending,
    onThresholdChange: setThreshold,
    onSelectToggle: handleSelectToggle,
    onSelectAllDuplicates: handleSelectAllDuplicates,
    onDeleteSelected: handleDeleteSelected,
    onConfirmDelete: handleConfirmDelete,
    onCloseDeleteModal: handleCloseDeleteModal,
    onClearDeleteError: handleClearDeleteError,
  };
}
