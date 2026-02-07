import { useState } from 'react';
import { Button, Center, Stack, Text, Title } from '@mantine/core';
import { IconFolder } from '@tabler/icons-react';

interface StorageSetupPageProps {
  onStorageSelected: () => void;
}

/**
 * ストレージ選択画面
 * 初回起動時（ストレージ未設定）に表示される
 */
export function StorageSetupPage({ onStorageSelected }: StorageSetupPageProps) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectFolder = async () => {
    setIsSelecting(true);
    setError(null);

    try {
      if (window.picstash === undefined) {
        throw new Error('Picstash API is not available');
      }
      const selectedPath = await window.picstash.storage.selectPath();
      if (selectedPath !== null) {
        onStorageSelected();
      }
    }
    catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select folder');
    }
    finally {
      setIsSelecting(false);
    }
  };

  return (
    <Center h="100vh">
      <Stack align="center" gap="lg">
        <Title order={2}>Picstash へようこそ</Title>
        <Text c="dimmed" ta="center" maw={400}>
          画像を保存するフォルダを選択してください。
          <br />
          選択したフォルダに画像ファイルとデータベースが保存されます。
        </Text>
        <Button
          size="lg"
          leftSection={<IconFolder size={20} />}
          onClick={() => { handleSelectFolder().catch(() => {}); }}
          loading={isSelecting}
        >
          フォルダを選択
        </Button>
        {error !== null && (
          <Text c="red" size="sm">
            {error}
          </Text>
        )}
      </Stack>
    </Center>
  );
}
