/* v8 ignore file -- View: 純粋な描画コンポーネントなので Storybook テストでカバー */
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
import { Link } from 'react-router';
import type { Collection } from '@/entities/collection';

export interface ImageCollectionsSectionViewProps {
  imageCollections: Collection[] | undefined;
  availableCollections: Array<{ value: string; label: string }>;
  hasAnyCollections: boolean;
  selectedCollectionId: string | null;
  isAdding: boolean;
  onSelectedCollectionIdChange: (value: string | null) => void;
  onAdd: () => void;
  onRemove: (collectionId: string) => void;
}

export function ImageCollectionsSectionView({
  imageCollections,
  availableCollections,
  hasAnyCollections,
  selectedCollectionId,
  isAdding,
  onSelectedCollectionIdChange,
  onAdd,
  onRemove,
}: ImageCollectionsSectionViewProps) {
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
                        onClick={() => { onRemove(collection.id); }}
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
              data={availableCollections}
              value={selectedCollectionId}
              onChange={onSelectedCollectionIdChange}
              clearable
              style={{ flex: 1 }}
            />
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={onAdd}
              loading={isAdding}
              disabled={selectedCollectionId === null}
            >
              追加
            </Button>
          </Group>
        )}

        {availableCollections.length === 0 && !hasAnyCollections && (
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
