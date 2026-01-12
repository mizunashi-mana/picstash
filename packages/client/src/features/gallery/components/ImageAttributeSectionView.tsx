import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Card,
  Group,
  Loader,
  Modal,
  Select,
  Stack,
  TagsInput,
  Text,
  Title,
} from '@mantine/core';
import { IconEdit, IconPlus, IconTrash } from '@tabler/icons-react';
import type { ImageAttribute } from '@picstash/shared';

export interface ImageAttributeSectionViewProps {
  attributes: ImageAttribute[] | undefined;
  labelOptions: { value: string; label: string }[];
  isLoading: boolean;
  attributesError: Error | null;
  labelsError: Error | null;
  addModalOpen: boolean;
  editingAttribute: ImageAttribute | null;
  selectedLabelId: string | null;
  keywords: string[];
  isCreating: boolean;
  isUpdating: boolean;
  isDeletingId: string | null;
  hasAvailableLabels: boolean;
  onOpenAddModal: () => void;
  onCloseAddModal: () => void;
  onOpenEditModal: (attr: ImageAttribute) => void;
  onCloseEditModal: () => void;
  onSelectedLabelIdChange: (id: string | null) => void;
  onKeywordsChange: (keywords: string[]) => void;
  onCreate: () => void;
  onUpdate: () => void;
  onDelete: (attributeId: string) => void;
}

function parseKeywords(keywordsString: string | null): string[] {
  if (keywordsString === null || keywordsString === '') return [];
  return keywordsString
    .split(',')
    .map(k => k.trim())
    .filter(k => k !== '');
}

export function ImageAttributeSectionView({
  attributes,
  labelOptions,
  isLoading,
  attributesError,
  labelsError,
  addModalOpen,
  editingAttribute,
  selectedLabelId,
  keywords,
  isCreating,
  isUpdating,
  isDeletingId,
  hasAvailableLabels,
  onOpenAddModal,
  onCloseAddModal,
  onOpenEditModal,
  onCloseEditModal,
  onSelectedLabelIdChange,
  onKeywordsChange,
  onCreate,
  onUpdate,
  onDelete,
}: ImageAttributeSectionViewProps) {
  if (isLoading) {
    return (
      <Card padding="md" withBorder>
        <Stack align="center" py="md">
          <Loader size="sm" />
        </Stack>
      </Card>
    );
  }

  if (attributesError !== null) {
    return (
      <Alert color="red" title="Error">
        Failed to load attributes
      </Alert>
    );
  }

  if (labelsError !== null) {
    return (
      <Alert color="red" title="Error">
        Failed to load labels
      </Alert>
    );
  }

  return (
    <>
      <Card padding="md" withBorder>
        <Stack gap="md">
          <Group justify="space-between">
            <Title order={5}>属性</Title>
            <Button
              size="xs"
              variant="light"
              leftSection={<IconPlus size={14} />}
              onClick={onOpenAddModal}
              disabled={!hasAvailableLabels}
            >
              追加
            </Button>
          </Group>

          {attributes?.length === 0 && (
            <Text size="sm" c="dimmed" ta="center">
              属性が設定されていません
            </Text>
          )}

          <Stack gap="xs">
            {attributes?.map((attr) => {
              const attrKeywords = parseKeywords(attr.keywords);
              const labelColor = attr.label.color;

              return (
                <Card key={attr.id} padding="xs" withBorder>
                  <Group justify="space-between" wrap="nowrap">
                    <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                      <Badge
                        size="md"
                        color={labelColor ?? 'gray'}
                        variant="light"
                        style={
                          labelColor !== null
                            ? {
                                backgroundColor: `${labelColor}20`,
                                color: labelColor,
                                borderColor: labelColor,
                              }
                            : undefined
                        }
                      >
                        {attr.label.name}
                      </Badge>
                      {attrKeywords.length > 0 && (
                        <Group gap={4}>
                          {attrKeywords.map((keyword, idx) => (
                            <Badge key={`${keyword}-${idx}`} size="xs" variant="outline" color="gray">
                              {keyword}
                            </Badge>
                          ))}
                        </Group>
                      )}
                    </Stack>
                    <Group gap={4}>
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        onClick={() => onOpenEditModal(attr)}
                        aria-label="編集"
                      >
                        <IconEdit size={14} />
                      </ActionIcon>
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        color="red"
                        onClick={() => onDelete(attr.id)}
                        loading={isDeletingId === attr.id}
                        aria-label="削除"
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Group>
                  </Group>
                </Card>
              );
            })}
          </Stack>
        </Stack>
      </Card>

      {/* Add Attribute Modal */}
      <Modal
        opened={addModalOpen}
        onClose={onCloseAddModal}
        title="属性を追加"
      >
        <Stack gap="md">
          <Select
            label="ラベル"
            placeholder="ラベルを選択"
            data={labelOptions}
            value={selectedLabelId}
            onChange={onSelectedLabelIdChange}
            searchable
          />
          <TagsInput
            label="キーワード"
            placeholder="キーワードを入力して Enter"
            value={keywords}
            onChange={onKeywordsChange}
          />
          <Group justify="flex-end">
            <Button variant="subtle" onClick={onCloseAddModal}>
              キャンセル
            </Button>
            <Button
              onClick={onCreate}
              loading={isCreating}
              disabled={selectedLabelId === null}
            >
              追加
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Edit Attribute Modal */}
      <Modal
        opened={editingAttribute !== null}
        onClose={onCloseEditModal}
        title="属性を編集"
      >
        <Stack gap="md">
          {editingAttribute !== null && (
            <>
              <Group>
                <Text size="sm" c="dimmed">ラベル:</Text>
                <Badge
                  color={editingAttribute.label.color ?? 'gray'}
                  variant="light"
                >
                  {editingAttribute.label.name}
                </Badge>
              </Group>
              <TagsInput
                label="キーワード"
                placeholder="キーワードを入力して Enter"
                value={keywords}
                onChange={onKeywordsChange}
              />
              <Group justify="flex-end">
                <Button variant="subtle" onClick={onCloseEditModal}>
                  キャンセル
                </Button>
                <Button
                  onClick={onUpdate}
                  loading={isUpdating}
                >
                  保存
                </Button>
              </Group>
            </>
          )}
        </Stack>
      </Modal>
    </>
  );
}
