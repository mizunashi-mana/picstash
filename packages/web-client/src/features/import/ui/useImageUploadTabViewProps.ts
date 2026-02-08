/* v8 ignore file -- Hook: API 呼び出しが主体でモック困難 */
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useApiClient } from '@/shared';
import type { ImageUploadTabViewProps, UploadResult } from '@/features/import/ui/ImageUploadTabView';
import type { FileWithPath } from '@mantine/dropzone';

export function useImageUploadTabViewProps(): ImageUploadTabViewProps {
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const apiClient = useApiClient();

  const mutation = useMutation({
    mutationFn: async (files: Blob[]) => {
      let successCount = 0;
      let failedCount = 0;

      for (const file of files) {
        try {
          await apiClient.images.upload(file);
          successCount++;
        }
        catch {
          failedCount++;
        }
      }

      return { successCount, failedCount };
    },
    onSuccess: (result) => {
      setUploadResult(result);
    },
  });

  const handleDrop = (files: FileWithPath[]) => {
    setUploadResult(null);
    mutation.mutate(files);
  };

  const handleClearResult = () => {
    setUploadResult(null);
  };

  return {
    uploadResult,
    isPending: mutation.isPending,
    isError: mutation.isError,
    errorMessage: mutation.error?.message,
    onDrop: handleDrop,
    onClearResult: handleClearResult,
  };
}
