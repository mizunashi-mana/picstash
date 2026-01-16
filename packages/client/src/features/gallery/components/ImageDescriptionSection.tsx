import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateImage } from '@/features/gallery/api';
import { ImageDescriptionSectionView } from './ImageDescriptionSectionView';

interface ImageDescriptionSectionProps {
  imageId: string;
  description: string | null;
}

export function ImageDescriptionSection({
  imageId,
  description,
}: ImageDescriptionSectionProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(description ?? '');

  const updateMutation = useMutation({
    mutationFn: async (newDescription: string) => {
      const trimmed = newDescription.trim();
      return await updateImage(imageId, {
        description: trimmed === '' ? null : trimmed,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['image', imageId] });
      setIsEditing(false);
    },
  });

  const handleStartEdit = () => {
    setEditValue(description ?? '');
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditValue(description ?? '');
    setIsEditing(false);
  };

  const handleSave = () => {
    updateMutation.mutate(editValue);
  };

  return (
    <ImageDescriptionSectionView
      description={description}
      isEditing={isEditing}
      editValue={editValue}
      isPending={updateMutation.isPending}
      onStartEdit={handleStartEdit}
      onCancel={handleCancel}
      onSave={handleSave}
      onEditValueChange={setEditValue}
    />
  );
}
