import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router';
import {
  deleteCollection,
  fetchCollection,
  removeImageFromCollection,
  updateCollection,
  type UpdateCollectionInput,
} from '@/entities/collection';
import type { CollectionDetailPageViewProps } from '@/pages/collections/ui/CollectionDetailPageView';

export function useCollectionDetailPageViewProps(): CollectionDetailPageViewProps {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const { data: collection, isLoading, error } = useQuery({
    queryKey: ['collection', id],
    queryFn: async () => {
      if (id === undefined) throw new Error('Collection ID is required');
      return await fetchCollection(id);
    },
    enabled: id !== undefined,
  });

  const updateMutation = useMutation({
    mutationFn: async (input: UpdateCollectionInput) => {
      if (id === undefined) throw new Error('Collection ID is required');
      return await updateCollection(id, input);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['collection', id] });
      await queryClient.invalidateQueries({ queryKey: ['collections'] });
      setEditModalOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (id === undefined) throw new Error('Collection ID is required');
      await deleteCollection(id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['collections'] });
      void navigate('/collections');
    },
  });

  const removeImageMutation = useMutation({
    mutationFn: async (imageId: string) => {
      if (id === undefined) throw new Error('Collection ID is required');
      await removeImageFromCollection(id, imageId);
    },
    onSuccess: async (_data, imageId) => {
      await queryClient.invalidateQueries({ queryKey: ['collection', id] });
      await queryClient.invalidateQueries({ queryKey: ['collections'] });
      await queryClient.invalidateQueries({ queryKey: ['imageCollections', imageId] });
    },
  });

  const handleOpenEdit = (): void => {
    if (collection === undefined) return;
    setEditName(collection.name);
    setEditDescription(collection.description ?? '');
    setEditModalOpen(true);
  };

  const handleUpdate = (): void => {
    if (editName.trim() === '') return;
    updateMutation.mutate({
      name: editName.trim(),
      description: editDescription.trim() !== '' ? editDescription.trim() : null,
    });
  };

  const handleDelete = (): void => {
    deleteMutation.mutate();
  };

  const handleRemoveImage = (imageId: string): void => {
    removeImageMutation.mutate(imageId);
  };

  return {
    id,
    collection,
    isLoading,
    error,
    editModalOpen,
    deleteModalOpen,
    editName,
    editDescription,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isRemovingImage: removeImageMutation.isPending,
    updateError: updateMutation.isError
      ? (updateMutation.error instanceof Error
          ? updateMutation.error.message
          : 'コレクションの更新に失敗しました')
      : null,
    onOpenEdit: handleOpenEdit,
    onCloseEditModal: () => { setEditModalOpen(false); },
    onEditNameChange: setEditName,
    onEditDescriptionChange: setEditDescription,
    onUpdate: handleUpdate,
    onOpenDeleteModal: () => { setDeleteModalOpen(true); },
    onCloseDeleteModal: () => { setDeleteModalOpen(false); },
    onDelete: handleDelete,
    onRemoveImage: handleRemoveImage,
  };
}
