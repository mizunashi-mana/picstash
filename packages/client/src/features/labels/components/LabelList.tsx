import { useState } from 'react';
import {
  ActionIcon,
  Button,
  Card,
  Group,
  Modal,
  Stack,
  Text,
} from '@mantine/core';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { LabelBadge } from './LabelBadge';
import { LabelForm } from './LabelForm';
import type { Label, UpdateLabelInput } from '@picstash/shared';

interface LabelListProps {
  labels: Label[];
  onUpdate: (id: string, input: UpdateLabelInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isUpdating?: boolean;
  isDeleting?: boolean;
}

export function LabelList({
  labels,
  onUpdate,
  onDelete,
  isUpdating = false,
  isDeleting = false,
}: LabelListProps) {
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);
  const [deletingLabelId, setDeletingLabelId] = useState<string | null>(null);

  const handleUpdate = (input: UpdateLabelInput) => {
    if (editingLabel === null) return;
    onUpdate(editingLabel.id, input)
      .then(() => {
        setEditingLabel(null);
      })
      .catch(() => {
        // Error handling is done by the parent component
      });
  };

  const handleDelete = () => {
    if (deletingLabelId === null) return;
    onDelete(deletingLabelId)
      .then(() => {
        setDeletingLabelId(null);
      })
      .catch(() => {
        // Error handling is done by the parent component
      });
  };

  const existingColors = labels
    .map(l => l.color)
    .filter((c): c is string => c !== null);

  if (labels.length === 0) {
    return (
      <Text c="dimmed" ta="center" py="xl">
        No labels yet. Create one above!
      </Text>
    );
  }

  return (
    <>
      <Stack gap="xs">
        {labels.map(label => (
          <Card key={label.id} padding="sm" withBorder>
            <Group justify="space-between">
              <LabelBadge label={label} size="lg" />
              <Group gap="xs">
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  onClick={() => setEditingLabel(label)}
                  aria-label={`Edit ${label.name}`}
                >
                  <IconEdit size={18} />
                </ActionIcon>
                <ActionIcon
                  variant="subtle"
                  color="red"
                  onClick={() => setDeletingLabelId(label.id)}
                  aria-label={`Delete ${label.name}`}
                >
                  <IconTrash size={18} />
                </ActionIcon>
              </Group>
            </Group>
          </Card>
        ))}
      </Stack>

      {/* Edit Modal */}
      <Modal
        opened={editingLabel !== null}
        onClose={() => setEditingLabel(null)}
        title="Edit Label"
      >
        {editingLabel && (
          <LabelForm
            mode="edit"
            label={editingLabel}
            existingColors={existingColors.filter(c => c !== editingLabel.color)}
            onSubmit={handleUpdate}
            onCancel={() => setEditingLabel(null)}
            isSubmitting={isUpdating}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deletingLabelId !== null}
        onClose={() => setDeletingLabelId(null)}
        title="Delete Label"
      >
        <Stack>
          <Text>Are you sure you want to delete this label?</Text>
          <Group justify="flex-end">
            <Button
              variant="subtle"
              onClick={() => setDeletingLabelId(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <ActionIcon
              variant="filled"
              color="red"
              size="lg"
              onClick={handleDelete}
              loading={isDeleting}
              aria-label="Confirm delete"
            >
              <IconTrash size={18} />
            </ActionIcon>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
