import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { generateDescription, updateImage } from '@/features/gallery/api';
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

  const generateMutation = useMutation({
    mutationFn: async () => {
      return await generateDescription(imageId);
    },
    onSuccess: (result) => {
      setEditValue(result.description);
    },
    onError: (error) => {
      // eslint-disable-next-line no-console -- Log error for debugging
      console.error('Failed to generate description:', error);
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

  const handleGenerate = () => {
    generateMutation.mutate();
  };

  return (
    <ImageDescriptionSectionView
      description={description}
      isEditing={isEditing}
      editValue={editValue}
      isPending={updateMutation.isPending}
      isGenerating={generateMutation.isPending}
      generateError={generateMutation.isError ? '説明の生成に失敗しました' : null}
      onStartEdit={handleStartEdit}
      onCancel={handleCancel}
      onSave={handleSave}
      onEditValueChange={setEditValue}
      onGenerate={handleGenerate}
    />
  );
}
