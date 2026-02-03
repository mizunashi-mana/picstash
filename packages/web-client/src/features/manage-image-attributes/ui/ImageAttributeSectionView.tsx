import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Card,
  Collapse,
  Group,
  Loader,
  Modal,
  Progress,
  Select,
  Stack,
  TagsInput,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import { IconEdit, IconPlus, IconSparkles, IconTrash } from '@tabler/icons-react';
import type { AttributeSuggestion } from '@/features/manage-image-attributes/api/attributes';
import type { ImageAttribute } from '@picstash/api';

export interface ImageAttributeSectionViewProps {
  attributes: ImageAttribute[] | undefined;
  labelOptions: Array<{ value: string; label: string }>;
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
  // Suggestion props
  showSuggestions: boolean;
  suggestions: AttributeSuggestion[];
  suggestionsLoading: boolean;
  suggestionsError: Error | null;
  addingSuggestionId: string | null;
  onToggleSuggestions: () => void;
  onAddSuggestion: (suggestion: AttributeSuggestion) => void;
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
  showSuggestions,
  suggestions,
  suggestionsLoading,
  suggestionsError,
  addingSuggestionId,
  onToggleSuggestions,
  onAddSuggestion,
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
      <Alert color="red" title="エラー">
        属性の読み込みに失敗しました
      </Alert>
    );
  }

  if (labelsError !== null) {
    return (
      <Alert color="red" title="エラー">
        ラベルの読み込みに失敗しました
      </Alert>
    );
  }

  return (
    <>
      <Card padding="md" withBorder>
        <Stack gap="md">
          <Group justify="space-between">
            <Title order={5}>属性</Title>
            <Group gap="xs">
              <Button
                size="xs"
                variant="light"
                color="grape"
                leftSection={<IconSparkles size={14} />}
                onClick={onToggleSuggestions}
              >
                {showSuggestions ? '閉じる' : 'AI提案'}
              </Button>
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
          </Group>

          {/* AI Suggestions Section */}
          <Collapse in={showSuggestions}>
            <Card padding="sm" withBorder bg="grape.0">
              <Stack gap="xs">
                <Text size="sm" fw={500} c="grape.7">
                  AI推薦ラベル
                </Text>
                {suggestionsLoading && (
                  <Group justify="center" py="xs">
                    <Loader size="sm" color="grape" />
                  </Group>
                )}
                {suggestionsError !== null && (
                  <Text size="xs" c="red">
                    提案の取得に失敗しました
                  </Text>
                )}
                {!suggestionsLoading && suggestionsError === null && suggestions.length === 0 && (
                  <Text size="xs" c="dimmed">
                    推薦できるラベルがありません
                  </Text>
                )}
                {!suggestionsLoading && suggestions.length > 0 && (
                  <Stack gap={4}>
                    {suggestions.map(suggestion => (
                      <Card key={suggestion.labelId} padding="xs" withBorder>
                        <Stack gap={4}>
                          <Group justify="space-between" wrap="nowrap">
                            <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                              <Group gap="xs">
                                <Badge size="sm" color="grape" variant="light">
                                  {suggestion.labelName}
                                </Badge>
                                <Tooltip label={`類似度: ${(suggestion.score * 100).toFixed(1)}%`}>
                                  <Progress
                                    value={suggestion.score * 100}
                                    size="xs"
                                    color="grape"
                                    style={{ width: 60 }}
                                  />
                                </Tooltip>
                              </Group>
                            </Stack>
                            <Button
                              size="xs"
                              variant="light"
                              color="grape"
                              leftSection={<IconPlus size={12} />}
                              loading={addingSuggestionId === suggestion.labelId}
                              onClick={() => { onAddSuggestion(suggestion); }}
                            >
                              追加
                            </Button>
                          </Group>
                          {suggestion.suggestedKeywords.length > 0 && (
                            <Group gap={4}>
                              <Text size="xs" c="dimmed">推薦キーワード:</Text>
                              {suggestion.suggestedKeywords.map(kw => (
                                <Tooltip key={kw.keyword} label={`${kw.count}件の類似画像で使用`}>
                                  <Badge size="xs" variant="outline" color="grape">
                                    {kw.keyword}
                                  </Badge>
                                </Tooltip>
                              ))}
                            </Group>
                          )}
                        </Stack>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Stack>
            </Card>
          </Collapse>

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
                        onClick={() => { onOpenEditModal(attr); }}
                        aria-label="編集"
                      >
                        <IconEdit size={14} />
                      </ActionIcon>
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        color="red"
                        onClick={() => { onDelete(attr.id); }}
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
