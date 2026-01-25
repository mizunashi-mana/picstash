import { useState } from 'react';
import { Alert, Button, Stack, Text } from '@mantine/core';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router';
import { ImageDropzoneView, uploadImage } from '@/features/upload';
import type { FileWithPath } from '@mantine/dropzone';

interface UploadResult {
  successCount: number;
  failedCount: number;
}

export function ImageUploadTab() {
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  const mutation = useMutation({
    mutationFn: async (files: Blob[]) => {
      let successCount = 0;
      let failedCount = 0;

      for (const file of files) {
        try {
          await uploadImage(file);
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

  return (
    <Stack gap="md">
      <Text size="sm" c="dimmed" ta="center">
        画像ファイルをドラッグ＆ドロップまたはクリックして選択
      </Text>

      {uploadResult !== null && (
        <Alert
          color={uploadResult.failedCount === 0 ? 'green' : 'yellow'}
          title="アップロード完了"
          withCloseButton
          onClose={() => { setUploadResult(null); }}
        >
          <Stack gap="xs">
            <Text>
              {uploadResult.successCount}
              {' '}
              件アップロード成功
              {uploadResult.failedCount > 0 && (
                <>
                  、
                  {uploadResult.failedCount}
                  {' '}
                  件失敗
                </>
              )}
            </Text>
            {uploadResult.successCount > 0 && (
              <Button variant="light" size="sm" component={Link} to="/gallery">
                ギャラリーを見る
              </Button>
            )}
          </Stack>
        </Alert>
      )}

      <ImageDropzoneView
        onDrop={handleDrop}
        isPending={mutation.isPending}
        isError={mutation.isError}
        isSuccess={false}
        errorMessage={mutation.error?.message}
      />
    </Stack>
  );
}
