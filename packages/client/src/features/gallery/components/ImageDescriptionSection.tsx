import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  generateDescriptionJob,
  getJobStatus,
  updateImage,
} from '@/features/gallery/api';
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generateProgress, setGenerateProgress] = useState(0);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current !== null) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const pollJobStatus = useCallback(
    (jobId: string) => {
      const poll = async () => {
        try {
          const status = await getJobStatus(jobId);
          setGenerateProgress(status.progress);

          if (status.status === 'completed' && status.result !== undefined) {
            if (pollingRef.current !== null) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
            setIsGenerating(false);
            setEditValue(status.result.description);
            setGenerateProgress(0);
          }
          else if (status.status === 'failed') {
            if (pollingRef.current !== null) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
            setIsGenerating(false);
            setGenerateError(status.error ?? '説明の生成に失敗しました');
            setGenerateProgress(0);
          }
        }
        catch {
          // Polling error - continue trying
        }
      };

      // Start polling every 1 second
      pollingRef.current = setInterval(() => {
        void poll();
      }, 1000);

      // Initial poll
      void poll();
    },
    [],
  );

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
      return await generateDescriptionJob(imageId);
    },
    onSuccess: (result) => {
      // Start polling for job status
      pollJobStatus(result.jobId);
    },
    onError: (error) => {
      setIsGenerating(false);
      setGenerateError('説明の生成に失敗しました');
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
    setIsGenerating(true);
    setGenerateError(null);
    generateMutation.mutate();
  };

  return (
    <ImageDescriptionSectionView
      description={description}
      isEditing={isEditing}
      editValue={editValue}
      isPending={updateMutation.isPending}
      isGenerating={isGenerating || generateMutation.isPending}
      generateProgress={generateProgress}
      generateError={generateError}
      onStartEdit={handleStartEdit}
      onCancel={handleCancel}
      onSave={handleSave}
      onEditValueChange={setEditValue}
      onGenerate={handleGenerate}
    />
  );
}
