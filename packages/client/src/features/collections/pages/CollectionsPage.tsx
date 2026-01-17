import { useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Center,
  Container,
  Group,
  Image,
  Loader,
  Modal,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
} from '@mantine/core';
import { IconAlertCircle, IconFolder, IconPlus } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';
import {
  createCollection,
  deleteCollection,
  fetchCollections,
} from '@/features/collections/api';
import type { CollectionWithCount, CreateCollectionInput } from '@/features/collections/api';

function getThumbnailUrl(imageId: string): string {
  return `/api/images/${imageId}/thumbnail`;
}

interface CollectionCardProps {
  collection: CollectionWithCount;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

function CollectionCard({ collection, onDelete, isDeleting }: CollectionCardProps): React.JSX.Element {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const handleDelete = (): void => {
    onDelete(collection.id);
    setDeleteModalOpen(false);
  };

  return (
    <>
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Card.Section>
          <Link to={`/collections/${collection.id}`}>
            {collection.coverImageId !== null
              ? (
                  <Image
                    src={getThumbnailUrl(collection.coverImageId)}
                    height={160}
                    alt={collection.name}
                    fit="cover"
                  />
                )
              : (
                  <Center h={160} bg="gray.1">
                    <IconFolder size={48} color="gray" />
                  </Center>
                )}
          </Link>
        </Card.Section>

        <Stack gap="xs" mt="md">
          <Text fw={500} lineClamp={1}>
            {collection.name}
          </Text>
          <Text size="sm" c="dimmed" lineClamp={2}>
            {collection.description ?? '説明なし'}
          </Text>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              {collection.imageCount}
              件の画像
            </Text>
            <Button
              variant="subtle"
              color="red"
              size="xs"
              onClick={() => { setDeleteModalOpen(true); }}
            >
              削除
            </Button>
          </Group>
        </Stack>
      </Card>

      <Modal
        opened={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); }}
        title="コレクションを削除"
      >
        <Stack>
          <Text>
            「
            {collection.name}
            」を削除しますか？この操作は取り消せません。
          </Text>
          <Group justify="flex-end">
            <Button variant="light" onClick={() => { setDeleteModalOpen(false); }}>
              キャンセル
            </Button>
            <Button color="red" onClick={handleDelete} loading={isDeleting}>
              削除
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}

export function CollectionsPage(): React.JSX.Element {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const queryClient = useQueryClient();

  const { data: collections, isLoading, error } = useQuery({
    queryKey: ['collections'],
    queryFn: fetchCollections,
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateCollectionInput) => await createCollection(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['collections'] });
      setCreateModalOpen(false);
      setNewName('');
      setNewDescription('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await deleteCollection(id); },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });

  const handleCreate = (): void => {
    if (newName.trim() === '') return;
    createMutation.mutate({
      name: newName.trim(),
      description: newDescription.trim() !== '' ? newDescription.trim() : undefined,
    });
  };

  const handleDelete = (id: string): void => {
    deleteMutation.mutate(id);
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
        <Alert icon={<IconAlertCircle size={16} />} title="エラー" color="red">
          コレクションの読み込みに失敗しました
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xl" py="md">
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <Stack gap={4}>
            <Title order={2}>コレクション</Title>
            <Text c="dimmed">画像をコレクションに整理します</Text>
          </Stack>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => { setCreateModalOpen(true); }}
          >
            新規コレクション
          </Button>
        </Group>

        {collections?.length === 0
          ? (
              <Card padding="xl" withBorder>
                <Stack align="center" gap="md">
                  <IconFolder size={48} color="gray" />
                  <Text c="dimmed">コレクションがまだありません</Text>
                  <Button
                    variant="light"
                    leftSection={<IconPlus size={16} />}
                    onClick={() => { setCreateModalOpen(true); }}
                  >
                    最初のコレクションを作成
                  </Button>
                </Stack>
              </Card>
            )
          : (
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
                {collections?.map(collection => (
                  <CollectionCard
                    key={collection.id}
                    collection={collection}
                    onDelete={handleDelete}
                    isDeleting={deleteMutation.isPending}
                  />
                ))}
              </SimpleGrid>
            )}
      </Stack>

      <Modal
        opened={createModalOpen}
        onClose={() => { setCreateModalOpen(false); }}
        title="新しいコレクションを作成"
      >
        <Stack>
          <TextInput
            label="名前"
            placeholder="コレクション名を入力"
            value={newName}
            onChange={(e) => { setNewName(e.target.value); }}
            required
          />
          <Textarea
            label="説明"
            placeholder="説明を入力（オプション）"
            value={newDescription}
            onChange={(e) => { setNewDescription(e.target.value); }}
            rows={3}
          />
          {createMutation.isError && (
            <Alert icon={<IconAlertCircle size={16} />} color="red">
              {createMutation.error instanceof Error
                ? createMutation.error.message
                : 'コレクションの作成に失敗しました'}
            </Alert>
          )}
          <Group justify="flex-end">
            <Button variant="light" onClick={() => { setCreateModalOpen(false); }}>
              キャンセル
            </Button>
            <Button
              onClick={handleCreate}
              loading={createMutation.isPending}
              disabled={newName.trim() === ''}
            >
              作成
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
