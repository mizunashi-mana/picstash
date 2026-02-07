import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ImageDescriptionSectionView } from './ImageDescriptionSectionView';
import { useJobs } from '@/features/jobs';
import { useApiClient } from '@/shared';

interface ImageDescriptionSectionProps {
  imageId: string;
  description: string | null;
}

export function ImageDescriptionSection({
  imageId,
  description,
}: ImageDescriptionSectionProps) {
  const queryClient = useQueryClient();
  const { trackJob } = useJobs();
  const apiClient = useApiClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(description ?? '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generateProgress, setGenerateProgress] = useState(0);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const errorCountRef = useRef(0);

  const MAX_POLLING_ERRORS = 5;

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current !== null) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const stopPolling = useCallback(() => {
    if (pollingRef.current !== null) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    errorCountRef.current = 0;
  }, []);

  const pollJobStatus = useCallback(
    (jobId: string) => {
      const poll = async () => {
        try {
          const status = await apiClient.jobs.detail(jobId);
          errorCountRef.current = 0; // Reset error count on success
          setGenerateProgress(status.progress);

          if (status.status === 'completed' && status.result !== undefined) {
            stopPolling();
            setIsGenerating(false);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Job result type for description generation
            const description = status.result.description as string | undefined;
            if (description !== undefined) {
              setEditValue(description);
            }
            setGenerateProgress(0);
          }
          else if (status.status === 'failed') {
            stopPolling();
            setIsGenerating(false);
            setGenerateError(status.error ?? '説明の生成に失敗しました');
            setGenerateProgress(0);
          }
        }
        catch {
          errorCountRef.current += 1;
          if (errorCountRef.current >= MAX_POLLING_ERRORS) {
            stopPolling();
            setIsGenerating(false);
            setGenerateError('ジョブ状態の取得に失敗しました。再度お試しください。');
            setGenerateProgress(0);
          }
        }
      };

      // Start polling every 1 second
      pollingRef.current = setInterval(() => {
        void poll();
      }, 1000);

      // Initial poll
      void poll();
    },
    [stopPolling, apiClient.jobs],
  );

  const updateMutation = useMutation({
    mutationFn: async (newDescription: string) => {
      const trimmed = newDescription.trim();
      return await apiClient.images.update(imageId, {
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
      return await apiClient.description.generateJob(imageId);
    },
    onSuccess: (result) => {
      // Track job in global context for notifications
      trackJob(result.jobId);
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
