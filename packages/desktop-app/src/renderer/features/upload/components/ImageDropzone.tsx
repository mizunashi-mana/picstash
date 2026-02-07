import { useMutation } from '@tanstack/react-query';
import { ImageDropzoneView } from './ImageDropzoneView';
import type { FileWithPath } from '@mantine/dropzone';
import { uploadImageWithLocalFallback } from '@/features/upload/api';
import { useApiClient } from '@/shared';

interface ImageDropzoneProps {
  onUploadSuccess?: () => void;
}

export function ImageDropzone({ onUploadSuccess }: ImageDropzoneProps) {
  const apiClient = useApiClient();

  const mutation = useMutation({
    mutationFn: async (file: Blob) => await uploadImageWithLocalFallback(
      file,
      async (f: Blob) => await apiClient.images.upload(f),
    ),
    onSuccess: () => {
      onUploadSuccess?.();
    },
  });

  const handleDrop = (files: FileWithPath[]) => {
    files.forEach((file) => {
      mutation.mutate(file);
    });
  };

  return (
    <ImageDropzoneView
      onDrop={handleDrop}
      isPending={mutation.isPending}
      isError={mutation.isError}
      isSuccess={mutation.isSuccess}
      errorMessage={mutation.error?.message}
    />
  );
}
