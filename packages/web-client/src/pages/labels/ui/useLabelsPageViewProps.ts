import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createLabel,
  deleteLabel,
  fetchLabels,
  updateLabel,
  type CreateLabelInput,
  type UpdateLabelInput,
} from '@/entities/label';
import type { LabelsPageViewProps } from '@/pages/labels/ui/LabelsPageView';

export function useLabelsPageViewProps(): LabelsPageViewProps {
  const queryClient = useQueryClient();

  // === Queries ===
  const { data: labels, isLoading, error } = useQuery({
    queryKey: ['labels'],
    queryFn: fetchLabels,
  });

  // === Mutations ===
  const createMutation = useMutation({
    mutationFn: async (input: CreateLabelInput) => await createLabel(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['labels'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateLabelInput }) =>
      await updateLabel(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['labels'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await deleteLabel(id); },
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
