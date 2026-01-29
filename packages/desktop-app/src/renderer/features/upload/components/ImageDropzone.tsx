import { useMutation } from '@tanstack/react-query';
import { ImageDropzoneView } from './ImageDropzoneView';
import type { FileWithPath } from '@mantine/dropzone';
import { uploadImage } from '@/features/upload/api';

interface ImageDropzoneProps {
  onUploadSuccess?: () => void;
}

export function ImageDropzone({ onUploadSuccess }: ImageDropzoneProps) {
  const mutation = useMutation({
    mutationFn: uploadImage,
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
