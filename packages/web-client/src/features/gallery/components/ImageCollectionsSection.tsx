import { useState } from 'react';
import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Paper,
  Select,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconFolder, IconPlus, IconX } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';
import {
  addImageToCollection,
  fetchCollections,
  fetchImageCollections,
  removeImageFromCollection,
} from '@/entities/collection';

interface ImageCollectionsSectionProps {
  imageId: string;
}

export function ImageCollectionsSection({ imageId }: ImageCollectionsSectionProps): React.JSX.Element {
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: imageCollections } = useQuery({
    queryKey: ['imageCollections', imageId],
    queryFn: async () => await fetchImageCollections(imageId),
  });

  const { data: allCollections } = useQuery({
    queryKey: ['collections'],
    queryFn: fetchCollections,
  });

  const addMutation = useMutation({
    mutationFn: async (collectionId: string) => {
      await addImageToCollection(collectionId, { imageId });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['imageCollections', imageId] });
      await queryClient.invalidateQueries({ queryKey: ['collections'] });
      setSelectedCollectionId(null);
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (collectionId: string) => {
      await removeImageFromCollection(collectionId, imageId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['imageCollections', imageId] });
      await queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });

  const handleAdd = (): void => {
    if (selectedCollectionId === null) return;
    addMutation.mutate(selectedCollectionId);
  };

  const handleRemove = (collectionId: string): void => {
    removeMutation.mutate(collectionId);
  };

  // Filter out collections that the image is already in
  const imageCollectionIds = new Set(imageCollections?.map(c => c.id) ?? []);
  const availableCollections = allCollections?.filter(c => !imageCollectionIds.has(c.id)) ?? [];

  return (
    <Paper p="md" withBorder>
      <Stack gap="md">
        <Title order={5}>コレクション</Title>

        {imageCollections !== undefined && imageCollections.length > 0
          ? (
              <Group gap="xs">
                {imageCollections.map(collection => (
                  <Badge
                    key={collection.id}
                    size="lg"
                    variant="light"
                    leftSection={<IconFolder size={14} />}
                    rightSection={(
                      <ActionIcon
                        size="xs"
                        variant="transparent"
                        onClick={() => { handleRemove(collection.id); }}
                      >
                        <IconX size={12} />
                      </ActionIcon>
                    )}
                    component={Link}
                    to={`/collections/${collection.id}`}
                    style={{ cursor: 'pointer' }}
                  >
                    {collection.name}
                  </Badge>
                ))}
              </Group>
            )
          : (
              <Text size="sm" c="dimmed">
                コレクションに追加されていません
              </Text>
            )}

        {availableCollections.length > 0 && (
          <Group>
            <Select
              placeholder="コレクションを選択"
              data={availableCollections.map(c => ({ value: c.id, label: c.name }))}
              value={selectedCollectionId}
              onChange={setSelectedCollectionId}
              clearable
              style={{ flex: 1 }}
            />
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={handleAdd}
              loading={addMutation.isPending}
              disabled={selectedCollectionId === null}
            >
              追加
            </Button>
          </Group>
        )}

        {availableCollections.length === 0 && (allCollections?.length ?? 0) === 0 && (
          <Button
            variant="light"
            leftSection={<IconPlus size={16} />}
            component={Link}
            to="/collections"
          >
            コレクションを作成
          </Button>
        )}
      </Stack>
    </Paper>
  );
}
