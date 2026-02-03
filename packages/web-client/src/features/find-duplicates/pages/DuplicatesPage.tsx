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
import { deleteDuplicateImage, fetchDuplicates } from '@/features/find-duplicates/api/duplicates';
import { DuplicateGroupCard } from '@/features/find-duplicates/ui/DuplicateGroupCard';
import type { DuplicateGroup } from '@/features/find-duplicates/api/duplicates';

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
        <Alert color="red" title="エラー">
          重複画像の読み込みに失敗しました
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xl" py="md">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-end">
          <Title order={2}>重複画像</Title>
          <Group>
            <Stack gap={4}>
              <Text size="sm" c="dimmed">
                類似度しきい値:
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
            title="一部削除失敗"
            withCloseButton
            onClose={() => { setDeleteError(null); }}
          >
            {deleteError}
          </Alert>
        )}

        {data !== undefined && data.totalGroups > 0 && (
          <Group justify="space-between">
            <Text c="dimmed">
              {data.totalGroups}
              グループ、
              {data.totalDuplicates}
              件の重複が見つかりました
            </Text>
            {selectedIds.size > 0 && (
              <Button color="red" onClick={handleDeleteSelected}>
                選択した
                {selectedIds.size}
                件を削除
              </Button>
            )}
          </Group>
        )}

        {data?.totalGroups === 0
          ? (
              <Alert color="green" title="重複なし">
                現在のしきい値では重複画像が見つかりませんでした。
                しきい値を上げると、より類似した画像が見つかる可能性があります。
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
        title="削除の確認"
      >
        <Stack>
          <Text>
            {selectedIds.size}
            件の画像を削除しますか？この操作は取り消せません。
          </Text>
          <Group justify="flex-end">
            <Button variant="light" onClick={() => { setDeleteModalOpen(false); }}>
              キャンセル
            </Button>
            <Button
              color="red"
              onClick={confirmDelete}
              loading={deleteMutation.isPending}
            >
              削除
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
