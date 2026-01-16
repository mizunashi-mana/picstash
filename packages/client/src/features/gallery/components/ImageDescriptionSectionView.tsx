import {
  ActionIcon,
  Button,
  Card,
  Group,
  Stack,
  Text,
  Textarea,
  Title,
} from '@mantine/core';
import { IconEdit, IconPlus } from '@tabler/icons-react';

export interface ImageDescriptionSectionViewProps {
  description: string | null;
  isEditing: boolean;
  editValue: string;
  isPending: boolean;
  onStartEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onEditValueChange: (value: string) => void;
}

export function ImageDescriptionSectionView({
  description,
  isEditing,
  editValue,
  isPending,
  onStartEdit,
  onCancel,
  onSave,
  onEditValueChange,
}: ImageDescriptionSectionViewProps) {
  const hasDescription = description !== null && description.trim() !== '';

  return (
    <Card padding="md" withBorder>
      <Stack gap="md">
        <Group justify="space-between">
          <Title order={5}>説明</Title>
          {!isEditing && (
            <ActionIcon
              size="sm"
              variant="subtle"
              onClick={onStartEdit}
              aria-label={hasDescription ? '説明を編集' : '説明を追加'}
            >
              {hasDescription ? <IconEdit size={16} /> : <IconPlus size={16} />}
            </ActionIcon>
          )}
        </Group>

        {isEditing
          ? (
              <Stack gap="sm">
                <Textarea
                  value={editValue}
                  onChange={(e) => { onEditValueChange(e.currentTarget.value); }}
                  placeholder="画像の説明を入力..."
                  autosize
                  minRows={3}
                  maxRows={10}
                />
                <Group justify="flex-end">
                  <Button
                    variant="subtle"
                    size="xs"
                    onClick={onCancel}
                    disabled={isPending}
                  >
                    キャンセル
                  </Button>
                  <Button
                    size="xs"
                    onClick={onSave}
                    loading={isPending}
                  >
                    保存
                  </Button>
                </Group>
              </Stack>
            )
          : hasDescription
            ? (
                <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                  {description}
                </Text>
              )
            : (
                <Text size="sm" c="dimmed" ta="center">
                  説明がありません
                </Text>
              )}
      </Stack>
    </Card>
  );
}
