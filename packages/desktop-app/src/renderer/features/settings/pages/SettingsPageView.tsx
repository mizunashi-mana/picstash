import {
  Alert,
  Button,
  Card,
  Container,
  Group,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconAlertCircle, IconFolder, IconFolderOpen } from '@tabler/icons-react';

export interface SettingsPageViewProps {
  // State
  storagePath: string | null;
  isLoading: boolean;
  isChanging: boolean;
  error: string | null;

  // Handler
  onChangeFolder: () => void;
}

/**
 * 設定ページ View
 * 純粋な描画コンポーネント
 */
export function SettingsPageView({
  storagePath,
  isLoading,
  isChanging,
  error,
  onChangeFolder,
}: SettingsPageViewProps) {
  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        <Title order={2}>設定</Title>

        <Card withBorder>
          <Stack gap="md">
            <Group gap="xs">
              <IconFolder size={20} />
              <Text fw={500}>ストレージフォルダ</Text>
            </Group>

            <Text size="sm" c="dimmed">
              画像ファイルとデータベースが保存されるフォルダです。
            </Text>

            {isLoading
              ? (
                  <Text c="dimmed">読み込み中...</Text>
                )
              : (
                  <Card withBorder bg="gray.0" p="sm">
                    <Group gap="xs">
                      <IconFolderOpen size={16} color="var(--mantine-color-blue-6)" />
                      <Text size="sm" style={{ wordBreak: 'break-all' }}>
                        {storagePath ?? '未設定'}
                      </Text>
                    </Group>
                  </Card>
                )}

            <Alert
              icon={<IconAlertCircle size={16} />}
              color="yellow"
              variant="light"
            >
              フォルダを変更すると、新しいライブラリとして開きます。
              既存のデータは移行されません。
            </Alert>

            {error !== null && (
              <Alert color="red" variant="light">
                {error}
              </Alert>
            )}

            <Button
              leftSection={<IconFolder size={16} />}
              onClick={onChangeFolder}
              loading={isChanging}
              variant="outline"
            >
              フォルダを変更
            </Button>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}
