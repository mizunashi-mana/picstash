/* v8 ignore file -- UI コンポーネント: Storybook テストでカバー */
import { useState } from 'react';
import { Alert, Button, Group, Paper, Stack, Text, TextInput } from '@mantine/core';

export interface UrlInputFormProps {
  onSubmit: (url: string) => void;
  isPending: boolean;
  isError: boolean;
  errorMessage?: string;
}

export function UrlInputForm({ onSubmit, isPending, isError, errorMessage }: UrlInputFormProps) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    if (url.trim() !== '') {
      onSubmit(url.trim());
    }
  };

  return (
    <Paper p="xl" radius="md" withBorder>
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Text size="lg" fw={500}>
            URLを入力
          </Text>
          <Text size="sm" c="dimmed">
            画像を取り込みたいウェブページのURLを入力してください
          </Text>

          <TextInput
            placeholder="https://example.com/gallery"
            value={url}
            onChange={(e) => { setUrl(e.currentTarget.value); }}
            size="md"
            disabled={isPending}
          />

          {isError && (
            <Alert color="red" title="エラー">
              {errorMessage ?? 'URLの取得に失敗しました'}
            </Alert>
          )}

          <Group justify="flex-end">
            <Button type="submit" loading={isPending} disabled={url.trim() === ''}>
              画像を取得
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}
