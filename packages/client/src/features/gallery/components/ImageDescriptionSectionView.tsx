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
import { IconEdit, IconPlus, IconSparkles } from '@tabler/icons-react';

export interface ImageDescriptionSectionViewProps {
  description: string | null;
  isEditing: boolean;
  editValue: string;
  isPending: boolean;
  isGenerating: boolean;
  generateError?: string | null;
  onStartEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onEditValueChange: (value: string) => void;
  onGenerate: () => void;
}

export function ImageDescriptionSectionView({
  description,
  isEditing,
  editValue,
  isPending,
  isGenerating,
  generateError,
  onStartEdit,
  onCancel,
  onSave,
  onEditValueChange,
  onGenerate,
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
                  disabled={isGenerating}
                />
                {generateError !== undefined && generateError !== null && (
                  <Text size="xs" c="red">
                    {generateError}
                  </Text>
                )}
                <Group justify="space-between">
                  <Button
                    variant="light"
                    size="xs"
                    leftSection={<IconSparkles size={14} />}
                    onClick={onGenerate}
                    loading={isGenerating}
                    disabled={isPending}
                  >
                    AI で生成
                  </Button>
                  <Group>
                    <Button
                      variant="subtle"
                      size="xs"
                      onClick={onCancel}
                      disabled={isPending || isGenerating}
                    >
                      キャンセル
                    </Button>
                    <Button
                      size="xs"
                      onClick={onSave}
                      loading={isPending}
                      disabled={isGenerating}
                    >
                      保存
                    </Button>
                  </Group>
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
