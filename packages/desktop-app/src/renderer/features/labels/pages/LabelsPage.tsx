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
import type { CreateLabelInput, UpdateLabelInput } from '@picstash/api';
import { LabelForm, LabelList } from '@/features/labels/components';
import { useApiClient } from '@/shared';

export function LabelsPage() {
  const queryClient = useQueryClient();
  const apiClient = useApiClient();

  const {
    data: labels,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['labels'],
    queryFn: async () => await apiClient.labels.list(),
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateLabelInput) => await apiClient.labels.create(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['labels'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateLabelInput }) =>
      await apiClient.labels.update(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['labels'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await apiClient.labels.delete(id); },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['labels'] });
    },
  });

  const handleCreate = (input: CreateLabelInput | UpdateLabelInput) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- form only passes CreateLabelInput for create
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
          <Title order={2}>ラベル管理</Title>
          <Text c="dimmed">
            画像を整理するためのラベルを作成・管理します
          </Text>
        </Stack>

        {/* Create Form */}
        <Card padding="lg" withBorder>
          <Stack gap="md">
            <Title order={4}>新しいラベルを作成</Title>
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
            title="ラベルの作成エラー"
            color="red"
          >
            {createMutation.error instanceof Error
              ? createMutation.error.message
              : 'ラベルの作成に失敗しました'}
          </Alert>
        )}

        {/* Label List */}
        <Stack gap="sm">
          <Title order={4}>ラベル一覧</Title>

          {isLoading && (
            <Stack align="center" py="xl">
              <Loader size="lg" />
            </Stack>
          )}

          {error && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              title="ラベルの読み込みエラー"
              color="red"
            >
              {error instanceof Error ? error.message : 'ラベルの読み込みに失敗しました'}
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
