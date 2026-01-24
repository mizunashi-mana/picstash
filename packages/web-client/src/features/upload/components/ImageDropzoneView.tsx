import { Group, Text } from '@mantine/core';
import { Dropzone, IMAGE_MIME_TYPE } from '@mantine/dropzone';

export interface ImageDropzoneViewProps {
  onDrop: (files: File[]) => void;
  isPending: boolean;
  isError: boolean;
  isSuccess: boolean;
  errorMessage?: string;
}

export function ImageDropzoneView({
  onDrop,
  isPending,
  isError,
  isSuccess,
  errorMessage,
}: ImageDropzoneViewProps) {
  return (
    <Dropzone
      onDrop={onDrop}
      accept={IMAGE_MIME_TYPE}
      maxSize={50 * 1024 * 1024}
      loading={isPending}
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
          {isError && (
            <Text size="sm" c="red" mt={7}>
              {errorMessage ?? 'エラーが発生しました'}
            </Text>
          )}
          {isSuccess && (
            <Text size="sm" c="green" mt={7}>
              アップロード完了
            </Text>
          )}
        </div>
      </Group>
    </Dropzone>
  );
}
