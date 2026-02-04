import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createCollection,
  deleteCollection,
  fetchCollections,
  type CreateCollectionInput,
} from '@/entities/collection';
import type { CollectionsPageViewProps } from '@/pages/collections/ui/CollectionsPageView';

export function useCollectionsPageViewProps(): CollectionsPageViewProps {
  // === State ===
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const queryClient = useQueryClient();

  // === Queries ===
  const { data: collections, isLoading, error } = useQuery({
    queryKey: ['collections'],
    queryFn: fetchCollections,
  });

  // === Mutations ===
  const createMutation = useMutation({
    mutationFn: async (input: CreateCollectionInput) => await createCollection(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['collections'] });
      setCreateModalOpen(false);
      setNewName('');
      setNewDescription('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await deleteCollection(id); },
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
