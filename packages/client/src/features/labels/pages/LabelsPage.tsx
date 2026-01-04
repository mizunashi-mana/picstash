import {
  Alert,
  Card,
  Container,
  Loader,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createLabel,
  deleteLabel,
  fetchLabels,
  updateLabel,
} from '@/features/labels/api';
import { LabelForm, LabelList } from '@/features/labels/components';
import type { CreateLabelInput, UpdateLabelInput } from '@picstash/shared';

export function LabelsPage() {
  const queryClient = useQueryClient();

  const {
    data: labels,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['labels'],
    queryFn: fetchLabels,
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateLabelInput) => createLabel(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['labels'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateLabelInput }) =>
      updateLabel(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['labels'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => deleteLabel(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['labels'] });
    },
  });

  const handleCreate = (input: CreateLabelInput | UpdateLabelInput) => {
    createMutation.mutate(input as CreateLabelInput);
  };

  const handleUpdate = async (id: string, input: UpdateLabelInput) => {
    await updateMutation.mutateAsync({ id, input });
  };

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  const existingColors
    = labels?.map(l => l.color).filter((c): c is string => c !== null) ?? [];

  return (
    <Container size="md" py="xl">
      <Stack gap="xl">
        <Stack gap="xs">
          <Title order={2}>Label Management</Title>
          <Text c="dimmed">
            Create and manage labels to organize your images
          </Text>
        </Stack>

        {/* Create Form */}
        <Card padding="lg" withBorder>
          <Stack gap="md">
            <Title order={4}>Create New Label</Title>
            <LabelForm
              mode="create"
              existingColors={existingColors}
              onSubmit={handleCreate}
              isSubmitting={createMutation.isPending}
            />
          </Stack>
        </Card>

        {createMutation.isError && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Error creating label"
            color="red"
          >
            {createMutation.error instanceof Error
              ? createMutation.error.message
              : 'Failed to create label'}
          </Alert>
        )}

        {/* Label List */}
        <Stack gap="sm">
          <Title order={4}>Labels</Title>

          {isLoading && (
            <Stack align="center" py="xl">
              <Loader size="lg" />
            </Stack>
          )}

          {error && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              title="Error loading labels"
              color="red"
            >
              {error instanceof Error ? error.message : 'Failed to load labels'}
            </Alert>
          )}

          {labels && (
            <LabelList
              labels={labels}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              isUpdating={updateMutation.isPending}
              isDeleting={deleteMutation.isPending}
            />
          )}
        </Stack>
      </Stack>
    </Container>
  );
}
