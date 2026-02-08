/* v8 ignore file -- View: 純粋な描画コンポーネントなので Storybook テストでカバー */
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
import { DuplicateGroupCard } from '@/features/find-duplicates/ui/DuplicateGroupCard';
import type { DuplicateGroup, DuplicatesResponse } from '@picstash/api';

export interface DuplicatesPageViewProps {
  threshold: number;
  selectedIds: Set<string>;
  deleteModalOpen: boolean;
  deleteError: string | null;
  data: DuplicatesResponse | undefined;
  isLoading: boolean;
  error: Error | null;
  isDeleting: boolean;
  getThumbnailUrl: (imageId: string) => string;
  onThresholdChange: (value: number) => void;
  onSelectToggle: (imageId: string) => void;
  onSelectAllDuplicates: (group: DuplicateGroup) => void;
  onDeleteSelected: () => void;
  onConfirmDelete: () => void;
  onCloseDeleteModal: () => void;
  onClearDeleteError: () => void;
}

export function DuplicatesPageView({
  threshold,
  selectedIds,
  deleteModalOpen,
  deleteError,
  data,
  isLoading,
  error,
  isDeleting,
  getThumbnailUrl,
  onThresholdChange,
  onSelectToggle,
  onSelectAllDuplicates,
  onDeleteSelected,
  onConfirmDelete,
  onCloseDeleteModal,
  onClearDeleteError,
}: DuplicatesPageViewProps): React.JSX.Element {
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
                onChange={onThresholdChange}
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
            onClose={onClearDeleteError}
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
              <Button color="red" onClick={onDeleteSelected}>
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
                    onSelectToggle={onSelectToggle}
                    onSelectAllDuplicates={onSelectAllDuplicates}
                    getThumbnailUrl={getThumbnailUrl}
                  />
                ))}
              </Stack>
            )}
      </Stack>

      <Modal
        opened={deleteModalOpen}
        onClose={onCloseDeleteModal}
        title="削除の確認"
      >
        <Stack>
          <Text>
            {selectedIds.size}
            件の画像を削除しますか？この操作は取り消せません。
          </Text>
          <Group justify="flex-end">
            <Button variant="light" onClick={onCloseDeleteModal}>
              キャンセル
            </Button>
            <Button
              color="red"
              onClick={onConfirmDelete}
              loading={isDeleting}
            >
              削除
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
