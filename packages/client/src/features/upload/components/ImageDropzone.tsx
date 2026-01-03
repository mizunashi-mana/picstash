import { Group, Text } from '@mantine/core';
import { Dropzone, IMAGE_MIME_TYPE } from '@mantine/dropzone';
import { useMutation } from '@tanstack/react-query';
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

  return (
    <Dropzone
      onDrop={(files) => {
        files.forEach((file) => {
          mutation.mutate(file);
        });
      }}
      accept={IMAGE_MIME_TYPE}
      maxSize={50 * 1024 * 1024}
      loading={mutation.isPending}
    >
      <Group
        justify="center"
        gap="xl"
        mih={220}
        style={{ pointerEvents: 'none' }}
      >
        <div>
          <Text size="xl" inline>
            ここに画像をドラッグ＆ドロップ
          </Text>
          <Text size="sm" c="dimmed" inline mt={7}>
            またはクリックしてファイルを選択
          </Text>
          {mutation.isError && (
            <Text size="sm" c="red" mt={7}>
              {mutation.error.message}
            </Text>
          )}
          {mutation.isSuccess && (
            <Text size="sm" c="green" mt={7}>
              アップロード完了
            </Text>
          )}
        </div>
      </Group>
    </Dropzone>
  );
}
