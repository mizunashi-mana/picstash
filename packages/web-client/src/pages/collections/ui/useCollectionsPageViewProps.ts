import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '@/shared';
import type { CollectionsPageViewProps } from '@/pages/collections/ui/CollectionsPageView';
import type { CreateCollectionInput } from '@picstash/api';

export function useCollectionsPageViewProps(): CollectionsPageViewProps {
  // === State ===
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const queryClient = useQueryClient();
  const apiClient = useApiClient();

  // === Queries ===
  const { data: collections, isLoading, error } = useQuery({
    queryKey: ['collections'],
    queryFn: async () => await apiClient.collections.list(),
  });

  // === Mutations ===
  const createMutation = useMutation({
    mutationFn: async (input: CreateCollectionInput) => await apiClient.collections.create(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['collections'] });
      setCreateModalOpen(false);
      setNewName('');
      setNewDescription('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await apiClient.collections.delete(id); },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });

  // === Handlers ===
  const handleCreate = (): void => {
    if (newName.trim() === '') return;
    createMutation.mutate({
      name: newName.trim(),
      description: newDescription.trim() !== '' ? newDescription.trim() : undefined,
    });
  };

  const handleDelete = (id: string): void => {
    deleteMutation.mutate(id);
  };

  return {
    collections,
    isLoading,
    error,
    createModalOpen,
    newName,
    newDescription,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createError: createMutation.isError
      ? (createMutation.error instanceof Error
          ? createMutation.error.message
          : 'コレクションの作成に失敗しました')
      : null,
    onOpenCreateModal: () => { setCreateModalOpen(true); },
    onCloseCreateModal: () => { setCreateModalOpen(false); },
    onNewNameChange: setNewName,
    onNewDescriptionChange: setNewDescription,
    onCreate: handleCreate,
    onDelete: handleDelete,
  };
}
