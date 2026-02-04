import { Alert, Button, Stack, Text } from '@mantine/core';
import { Link } from 'react-router';
import { ImageDropzoneView } from '@/features/upload-image';
import type { FileWithPath } from '@mantine/dropzone';

export interface UploadResult {
  successCount: number;
  failedCount: number;
}

export interface ImageUploadTabViewProps {
  uploadResult: UploadResult | null;
  isPending: boolean;
  isError: boolean;
  errorMessage: string | undefined;
  onDrop: (files: FileWithPath[]) => void;
  onClearResult: () => void;
}

export function ImageUploadTabView({
  uploadResult,
  isPending,
  isError,
  errorMessage,
  onDrop,
  onClearResult,
}: ImageUploadTabViewProps) {
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
          onClose={onClearResult}
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
        onDrop={onDrop}
        isPending={isPending}
        isError={isError}
        isSuccess={false}
        errorMessage={errorMessage}
      />
    </Stack>
  );
}
