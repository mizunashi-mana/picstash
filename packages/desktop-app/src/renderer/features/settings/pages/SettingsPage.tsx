import { useEffect, useState } from 'react';
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

/**
 * 設定ページ
 * ストレージフォルダの確認・変更を行う
 */
export function SettingsPage() {
  const [storagePath, setStoragePath] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChanging, setIsChanging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStoragePath = async () => {
      try {
        if (window.picstash === undefined) {
          throw new Error('Picstash API is not available');
        }
        const path = await window.picstash.storage.getPath();
        setStoragePath(path);
      }
      catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load storage path');
      }
      finally {
        setIsLoading(false);
      }
    };
    void loadStoragePath();
  }, []);

  const handleChangeFolder = async () => {
    setIsChanging(true);
    setError(null);

    try {
      if (window.picstash === undefined) {
        throw new Error('Picstash API is not available');
      }

      const selectedPath = await window.picstash.storage.selectPath();
      if (selectedPath !== null) {
        // フォルダが変更された場合、アプリを再起動してキャッシュをクリア
        window.location.reload();
      }
    }
    catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change folder');
      setIsChanging(false);
    }
  };

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
              onClick={() => { void handleChangeFolder(); }}
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
