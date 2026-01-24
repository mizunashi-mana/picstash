import { Group, Text } from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';

const ARCHIVE_MIME_TYPES = [
  'application/zip',
  'application/x-zip-compressed',
  'application/vnd.rar',
  'application/x-rar-compressed',
  'application/x-rar',
];

export interface ArchiveDropzoneProps {
  onDrop: (files: File[]) => void;
  isPending: boolean;
  isError: boolean;
  errorMessage?: string;
}

export function ArchiveDropzone({
  onDrop,
  isPending,
  isError,
  errorMessage,
}: ArchiveDropzoneProps) {
  return (
    <Dropzone
      onDrop={onDrop}
      accept={ARCHIVE_MIME_TYPES}
      maxSize={500 * 1024 * 1024}
      loading={isPending}
      multiple={false}
    >
      <Group
        justify="center"
        gap="xl"
        mih={180}
        style={{ pointerEvents: 'none' }}
      >
        <div>
          <Text size="xl" inline>
            ZIP/RAR ファイルをドラッグ＆ドロップ
          </Text>
          <Text size="sm" c="dimmed" inline mt={7}>
            またはクリックしてファイルを選択
          </Text>
          {isError && (
            <Text size="sm" c="red" mt={7}>
              {errorMessage ?? 'エラーが発生しました'}
            </Text>
          )}
        </div>
      </Group>
    </Dropzone>
  );
}
