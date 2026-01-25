import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  generateDescriptionJob,
  getJobStatus,
  updateImage,
} from '@/features/gallery/api';
import { useJobs } from '@/features/jobs';
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
  const { trackJob } = useJobs();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(description ?? '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generateProgress, setGenerateProgress] = useState(0);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const errorCountRef = useRef(0);
  const currentJobIdRef = useRef<string | null>(null);
  const previousImageIdRef = useRef<string>(imageId);

  const MAX_POLLING_ERRORS = 5;

  const stopPolling = useCallback(() => {
    if (pollingRef.current !== null) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    errorCountRef.current = 0;
    currentJobIdRef.current = null;
  }, []);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current !== null) {
        clearInterval(pollingRef.current);
      }
      currentJobIdRef.current = null;
    };
  }, []);

  // Handle imageId changes: stop polling and reset state
  useEffect(() => {
    // Only reset when imageId actually changes
    if (previousImageIdRef.current !== imageId) {
      previousImageIdRef.current = imageId;
      stopPolling();
      // eslint-disable-next-line react-hooks/set-state-in-effect -- We need to reset state when imageId changes
      setIsGenerating(false);

      setGenerateError(null);

      setGenerateProgress(0);

      setIsEditing(false);

      setEditValue(description ?? '');
    }
  }, [imageId, description, stopPolling]);

  const pollJobStatus = useCallback(
    (jobId: string) => {
      const poll = async () => {
        try {
          // Only process results for the current job
          if (currentJobIdRef.current !== jobId) {
            return;
          }

          const status = await getJobStatus(jobId);
          errorCountRef.current = 0; // Reset error count on success

          // Double-check after async operation
          if (currentJobIdRef.current !== jobId) {
            return;
          }

          setGenerateProgress(status.progress);

          if (status.status === 'completed' && status.result !== undefined) {
            stopPolling();
            setIsGenerating(false);
            setEditValue(status.result.description);
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
    [stopPolling],
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
      // Set the current job ID to track this generation
      currentJobIdRef.current = result.jobId;
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
    // Stop any existing polling before starting a new generation
    stopPolling();
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
