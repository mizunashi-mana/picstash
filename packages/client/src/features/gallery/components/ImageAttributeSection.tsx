import { useState } from 'react';
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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createImageAttribute,
  deleteImageAttribute,
  fetchImageAttributes,
  updateImageAttribute,
} from '@/features/gallery/api';
import { fetchLabels } from '@/features/labels';
import type { ImageAttribute } from '@picstash/shared';

interface ImageAttributeSectionProps {
  imageId: string;
}

export function ImageAttributeSection({ imageId }: ImageAttributeSectionProps) {
  const queryClient = useQueryClient();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<ImageAttribute | null>(null);
  const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null);
  const [keywords, setKeywords] = useState<string[]>([]);

  // Fetch attributes for this image
  const {
    data: attributes,
    isLoading: attributesLoading,
    error: attributesError,
  } = useQuery({
    queryKey: ['imageAttributes', imageId],
    queryFn: async () => fetchImageAttributes(imageId),
  });

  // Fetch all labels for the dropdown
  const { data: labels } = useQuery({
    queryKey: ['labels'],
    queryFn: fetchLabels,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      if (selectedLabelId === null) throw new Error('Label is required');
      return createImageAttribute(imageId, {
        labelId: selectedLabelId,
        keywords: keywords.length > 0 ? keywords.join(',') : undefined,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['imageAttributes', imageId] });
      setAddModalOpen(false);
      setSelectedLabelId(null);
      setKeywords([]);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (editingAttribute === null) throw new Error('No attribute selected');
      return updateImageAttribute(imageId, editingAttribute.id, {
        keywords: keywords.length > 0 ? keywords.join(',') : undefined,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['imageAttributes', imageId] });
      setEditingAttribute(null);
      setKeywords([]);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (attributeId: string) => deleteImageAttribute(imageId, attributeId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['imageAttributes', imageId] });
    },
  });

  // Get labels that are not already assigned
  const availableLabels = labels?.filter(
    label => !attributes?.some(attr => attr.labelId === label.id),
  ) ?? [];

  const labelOptions = availableLabels.map(label => ({
    value: label.id,
    label: label.name,
  }));

  const openAddModal = () => {
    setSelectedLabelId(null);
    setKeywords([]);
    setAddModalOpen(true);
  };

  const openEditModal = (attribute: ImageAttribute) => {
    setEditingAttribute(attribute);
    setKeywords(attribute.keywords?.split(',').filter(k => k !== '') ?? []);
  };

  const parseKeywords = (keywordsString: string | null): string[] => {
    if (keywordsString === null || keywordsString === '') return [];
    return keywordsString.split(',').filter(k => k !== '');
  };

  if (attributesLoading) {
    return (
      <Card padding="md" withBorder>
        <Stack align="center" py="md">
          <Loader size="sm" />
        </Stack>
      </Card>
    );
  }

  if (attributesError) {
    return (
      <Alert color="red" title="Error">
        Failed to load attributes
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
              onClick={openAddModal}
              disabled={availableLabels.length === 0}
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
                            <Badge key={idx} size="xs" variant="outline" color="gray">
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
                        onClick={() => openEditModal(attr)}
                        aria-label="編集"
                      >
                        <IconEdit size={14} />
                      </ActionIcon>
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        color="red"
                        onClick={() => deleteMutation.mutate(attr.id)}
                        loading={deleteMutation.isPending}
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
        onClose={() => setAddModalOpen(false)}
        title="属性を追加"
      >
        <Stack gap="md">
          <Select
            label="ラベル"
            placeholder="ラベルを選択"
            data={labelOptions}
            value={selectedLabelId}
            onChange={setSelectedLabelId}
            searchable
          />
          <TagsInput
            label="キーワード"
            placeholder="キーワードを入力して Enter"
            value={keywords}
            onChange={setKeywords}
          />
          <Group justify="flex-end">
            <Button variant="subtle" onClick={() => setAddModalOpen(false)}>
              キャンセル
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              loading={createMutation.isPending}
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
        onClose={() => setEditingAttribute(null)}
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
                onChange={setKeywords}
              />
              <Group justify="flex-end">
                <Button variant="subtle" onClick={() => setEditingAttribute(null)}>
                  キャンセル
                </Button>
                <Button
                  onClick={() => updateMutation.mutate()}
                  loading={updateMutation.isPending}
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
