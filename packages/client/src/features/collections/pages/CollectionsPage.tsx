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
            {collection.description ?? 'No description'}
          </Text>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              {collection.imageCount}
              {' '}
              image
              {collection.imageCount !== 1 ? 's' : ''}
            </Text>
            <Button
              variant="subtle"
              color="red"
              size="xs"
              onClick={() => { setDeleteModalOpen(true); }}
            >
              Delete
            </Button>
          </Group>
        </Stack>
      </Card>

      <Modal
        opened={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); }}
        title="Delete Collection"
      >
        <Stack>
          <Text>
            Are you sure you want to delete &quot;
            {collection.name}
            &quot;? This action cannot be undone.
          </Text>
          <Group justify="flex-end">
            <Button variant="light" onClick={() => { setDeleteModalOpen(false); }}>
              Cancel
            </Button>
            <Button color="red" onClick={handleDelete} loading={isDeleting}>
              Delete
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
        <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
          Failed to load collections
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xl" py="md">
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <Stack gap={4}>
            <Title order={2}>Collections</Title>
            <Text c="dimmed">Organize your images into collections</Text>
          </Stack>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => { setCreateModalOpen(true); }}
          >
            New Collection
          </Button>
        </Group>

        {collections?.length === 0
          ? (
              <Card padding="xl" withBorder>
                <Stack align="center" gap="md">
                  <IconFolder size={48} color="gray" />
                  <Text c="dimmed">No collections yet</Text>
                  <Button
                    variant="light"
                    leftSection={<IconPlus size={16} />}
                    onClick={() => { setCreateModalOpen(true); }}
                  >
                    Create your first collection
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
        title="Create New Collection"
      >
        <Stack>
          <TextInput
            label="Name"
            placeholder="Enter collection name"
            value={newName}
            onChange={(e) => { setNewName(e.target.value); }}
            required
          />
          <Textarea
            label="Description"
            placeholder="Enter collection description (optional)"
            value={newDescription}
            onChange={(e) => { setNewDescription(e.target.value); }}
            rows={3}
          />
          {createMutation.isError && (
            <Alert icon={<IconAlertCircle size={16} />} color="red">
              {createMutation.error instanceof Error
                ? createMutation.error.message
                : 'Failed to create collection'}
            </Alert>
          )}
          <Group justify="flex-end">
            <Button variant="light" onClick={() => { setCreateModalOpen(false); }}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              loading={createMutation.isPending}
              disabled={newName.trim() === ''}
            >
              Create
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
