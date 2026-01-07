import { useState } from 'react';
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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateImage } from '@/features/gallery/api';

interface ImageDescriptionSectionProps {
  imageId: string;
  description: string | null;
}

export function ImageDescriptionSection({
  imageId,
  description,
}: ImageDescriptionSectionProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(description ?? '');

  const updateMutation = useMutation({
    mutationFn: async (newDescription: string) => {
      const trimmed = newDescription.trim();
      return updateImage(imageId, {
        description: trimmed === '' ? null : trimmed,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['image', imageId] });
      setIsEditing(false);
    },
  });

  const handleStartEdit = () => {
    setEditValue(description ?? '');
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditValue(description ?? '');
    setIsEditing(false);
  };

  const handleSave = () => {
    updateMutation.mutate(editValue);
  };

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
              onClick={handleStartEdit}
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
                  onChange={e => setEditValue(e.currentTarget.value)}
                  placeholder="画像の説明を入力..."
                  autosize
                  minRows={3}
                  maxRows={10}
                />
                <Group justify="flex-end">
                  <Button
                    variant="subtle"
                    size="xs"
                    onClick={handleCancel}
                    disabled={updateMutation.isPending}
                  >
                    キャンセル
                  </Button>
                  <Button
                    size="xs"
                    onClick={handleSave}
                    loading={updateMutation.isPending}
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
