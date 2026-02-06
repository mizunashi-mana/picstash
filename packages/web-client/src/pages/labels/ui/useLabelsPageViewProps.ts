import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '@/shared';
import type { LabelsPageViewProps } from '@/pages/labels/ui/LabelsPageView';
import type { CreateLabelInput, UpdateLabelInput } from '@picstash/api';

export function useLabelsPageViewProps(): LabelsPageViewProps {
  const queryClient = useQueryClient();
  const apiClient = useApiClient();

  // === Queries ===
  const { data: labels, isLoading, error } = useQuery({
    queryKey: ['labels'],
    queryFn: async () => await apiClient.labels.list(),
  });

  // === Mutations ===
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

  // === Selectors ===
  const existingColors
    = labels?.map(l => l.color).filter((c): c is string => c !== null) ?? [];

  // === Handlers ===
  const handleCreate = (input: CreateLabelInput | UpdateLabelInput): void => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- form only passes CreateLabelInput for create
    createMutation.mutate(input as CreateLabelInput);
  };

  const handleUpdate = async (id: string, input: UpdateLabelInput): Promise<void> => {
    await updateMutation.mutateAsync({ id, input });
  };

  const handleDelete = async (id: string): Promise<void> => {
    await deleteMutation.mutateAsync(id);
  };

  return {
    labels,
    isLoading,
    error,
    existingColors,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createError: createMutation.isError
      ? (createMutation.error instanceof Error
          ? createMutation.error.message
          : 'ラベルの作成に失敗しました')
      : null,
    onCreate: handleCreate,
    onUpdate: handleUpdate,
    onDelete: handleDelete,
  };
}
