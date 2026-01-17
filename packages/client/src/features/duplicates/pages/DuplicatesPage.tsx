import { useState } from 'react';
import {
  Alert,
  Button,
  Center,
  Container,
  Group,
  Loader,
  Modal,
  Slider,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteDuplicateImage, fetchDuplicates } from '@/features/duplicates/api';
import { DuplicateGroupCard } from '@/features/duplicates/components/DuplicateGroupCard';
import type { DuplicateGroup } from '@/features/duplicates/api';

interface DeleteResult {
  successIds: string[];
  failedIds: string[];
}

export function DuplicatesPage(): React.JSX.Element {
  const [threshold, setThreshold] = useState(0.1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['duplicates', threshold],
    queryFn: async () => await fetchDuplicates({ threshold }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (imageIds: string[]): Promise<DeleteResult> => {
      const results = await Promise.allSettled(
        imageIds.map(async id => await deleteDuplicateImage(id).then(() => id)),
      );

      const successIds: string[] = [];
      const failedIds: string[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successIds.push(result.value);
        }
        else {
          failedIds.push(imageIds[index] ?? '');
        }
      });

      return { successIds, failedIds };
    },
    onSuccess: async (result) => {
      // Remove only successfully deleted IDs from selection
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const id of result.successIds) {
          next.delete(id);
        }
        return next;
      });

      setDeleteModalOpen(false);

      if (result.failedIds.length > 0) {
        setDeleteError(
          `Failed to delete ${result.failedIds.length.toString()} image(s). Successfully deleted ${result.successIds.length.toString()}.`,
        );
      }
      else {
        setDeleteError(null);
      }

      await queryClient.invalidateQueries({ queryKey: ['duplicates'] });
      await queryClient.invalidateQueries({ queryKey: ['images'] });
    },
  });

  const handleSelectToggle = (imageId: string): void => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(imageId)) {
        next.delete(imageId);
      }
      else {
        next.add(imageId);
      }
      return next;
    });
  };

  const handleSelectAllDuplicates = (group: DuplicateGroup): void => {
    const allSelected = group.duplicates.every(dup => selectedIds.has(dup.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const dup of group.duplicates) {
        if (allSelected) {
          next.delete(dup.id);
        }
        else {
          next.add(dup.id);
        }
      }
      return next;
    });
  };

  const handleDeleteSelected = (): void => {
    if (selectedIds.size > 0) {
      setDeleteModalOpen(true);
    }
  };

  const confirmDelete = (): void => {
    deleteMutation.mutate(Array.from(selectedIds));
  };

  if (isLoading) {
    return (
      <Center h={400}>
        <Loader size="lg" />
      </Center>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert color="red" title="Error">
          Failed to load duplicate images
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xl" py="md">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-end">
          <Title order={2}>Duplicate Images</Title>
          <Group>
            <Stack gap={4}>
              <Text size="sm" c="dimmed">
                Similarity Threshold:
                {' '}
                {(threshold * 100).toFixed(0)}
                %
              </Text>
              <Slider
                w={200}
                min={0.01}
                max={0.5}
                step={0.01}
                value={threshold}
                onChange={setThreshold}
                marks={[
                  { value: 0.05, label: '5%' },
                  { value: 0.1, label: '10%' },
                  { value: 0.25, label: '25%' },
                ]}
              />
            </Stack>
          </Group>
        </Group>

        {deleteError !== null && (
          <Alert
            color="orange"
            title="Partial Delete"
            withCloseButton
            onClose={() => { setDeleteError(null); }}
          >
            {deleteError}
          </Alert>
        )}

        {data !== undefined && data.totalGroups > 0 && (
          <Group justify="space-between">
            <Text c="dimmed">
              Found
              {' '}
              {data.totalGroups}
              {' '}
              group
              {data.totalGroups !== 1 ? 's' : ''}
              {' '}
              with
              {' '}
              {data.totalDuplicates}
              {' '}
              duplicate
              {data.totalDuplicates !== 1 ? 's' : ''}
            </Text>
            {selectedIds.size > 0 && (
              <Button color="red" onClick={handleDeleteSelected}>
                Delete
                {' '}
                {selectedIds.size}
                {' '}
                selected
              </Button>
            )}
          </Group>
        )}

        {data?.totalGroups === 0
          ? (
              <Alert color="green" title="No Duplicates Found">
                No duplicate images were found in your library with the current threshold.
                Try increasing the threshold to find more similar images.
              </Alert>
            )
          : (
              <Stack gap="md">
                {data?.groups.map((group, index) => (
                  <DuplicateGroupCard
                    key={`group-${index.toString()}`}
                    group={group}
                    selectedIds={selectedIds}
                    onSelectToggle={handleSelectToggle}
                    onSelectAllDuplicates={handleSelectAllDuplicates}
                  />
                ))}
              </Stack>
            )}
      </Stack>

      <Modal
        opened={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); }}
        title="Confirm Delete"
      >
        <Stack>
          <Text>
            Are you sure you want to delete
            {' '}
            {selectedIds.size}
            {' '}
            image
            {selectedIds.size !== 1 ? 's' : ''}
            ?
            This action cannot be undone.
          </Text>
          <Group justify="flex-end">
            <Button variant="light" onClick={() => { setDeleteModalOpen(false); }}>
              Cancel
            </Button>
            <Button
              color="red"
              onClick={confirmDelete}
              loading={deleteMutation.isPending}
            >
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
