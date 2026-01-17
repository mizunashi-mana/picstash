import { useState } from 'react';
import {
  ActionIcon,
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
import {
  IconAlertCircle,
  IconArrowLeft,
  IconEdit,
  IconPhoto,
  IconPlayerPlay,
  IconTrash,
} from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router';
import {
  deleteCollection,
  fetchCollection,
  removeImageFromCollection,
  updateCollection,
} from '@/features/collections/api';
import type { UpdateCollectionInput } from '@/features/collections/api';

function getThumbnailUrl(imageId: string): string {
  return `/api/images/${imageId}/thumbnail`;
}

export function CollectionDetailPage(): React.JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const { data: collection, isLoading, error } = useQuery({
    queryKey: ['collection', id],
    queryFn: async () => {
      if (id === undefined) throw new Error('Collection ID is required');
      return await fetchCollection(id);
    },
    enabled: id !== undefined,
  });

  const updateMutation = useMutation({
    mutationFn: async (input: UpdateCollectionInput) => {
      if (id === undefined) throw new Error('Collection ID is required');
      return await updateCollection(id, input);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['collection', id] });
      await queryClient.invalidateQueries({ queryKey: ['collections'] });
      setEditModalOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (id === undefined) throw new Error('Collection ID is required');
      await deleteCollection(id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['collections'] });
      void navigate('/collections');
    },
  });

  const removeImageMutation = useMutation({
    mutationFn: async (imageId: string) => {
      if (id === undefined) throw new Error('Collection ID is required');
      await removeImageFromCollection(id, imageId);
    },
    onSuccess: async (_data, imageId) => {
      await queryClient.invalidateQueries({ queryKey: ['collection', id] });
      await queryClient.invalidateQueries({ queryKey: ['collections'] });
      await queryClient.invalidateQueries({ queryKey: ['imageCollections', imageId] });
    },
  });

  const handleOpenEdit = (): void => {
    if (collection === undefined) return;
    setEditName(collection.name);
    setEditDescription(collection.description ?? '');
    setEditModalOpen(true);
  };

  const handleUpdate = (): void => {
    if (editName.trim() === '') return;
    updateMutation.mutate({
      name: editName.trim(),
      description: editDescription.trim() !== '' ? editDescription.trim() : null,
    });
  };

  const handleDelete = (): void => {
    deleteMutation.mutate();
  };

  const handleRemoveImage = (imageId: string): void => {
    removeImageMutation.mutate(imageId);
  };

  if (isLoading) {
    return (
      <Center h={400}>
        <Loader size="lg" />
      </Center>
    );
  }

  if (error !== null || collection === undefined) {
    return (
      <Container>
        <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
          {error instanceof Error ? error.message : 'Collection not found'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xl" py="md">
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <Group>
            <ActionIcon
              variant="subtle"
              component={Link}
              to="/collections"
            >
              <IconArrowLeft size={20} />
            </ActionIcon>
            <Stack gap={4}>
              <Title order={2}>{collection.name}</Title>
              {collection.description !== null && (
                <Text c="dimmed">{collection.description}</Text>
              )}
            </Stack>
          </Group>
          <Group>
            {collection.images.length > 0 && (
              <Button
                variant="filled"
                leftSection={<IconPlayerPlay size={16} />}
                component={Link}
                to={`/collections/${id}/view`}
              >
                View
              </Button>
            )}
            <Button
              variant="light"
              leftSection={<IconEdit size={16} />}
              onClick={handleOpenEdit}
            >
              Edit
            </Button>
            <Button
              variant="light"
              color="red"
              leftSection={<IconTrash size={16} />}
              onClick={() => { setDeleteModalOpen(true); }}
            >
              Delete
            </Button>
          </Group>
        </Group>

        {/* Image count */}
        <Text c="dimmed">
          {collection.images.length}
          {' '}
          image
          {collection.images.length !== 1 ? 's' : ''}
        </Text>

        {/* Images */}
        {collection.images.length === 0
          ? (
              <Card padding="xl" withBorder>
                <Stack align="center" gap="md">
                  <IconPhoto size={48} color="gray" />
                  <Text c="dimmed">No images in this collection</Text>
                  <Text size="sm" c="dimmed">
                    Add images from the image detail page
                  </Text>
                </Stack>
              </Card>
            )
          : (
              <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing="md">
                {collection.images.map(img => (
                  <Card key={img.id} shadow="xs" padding="xs" radius="sm" withBorder>
                    <Card.Section pos="relative">
                      <Link to={`/collections/${id}/view/${img.imageId}`}>
                        <Image
                          src={getThumbnailUrl(img.imageId)}
                          alt={img.filename}
                          height={140}
                          fit="cover"
                        />
                      </Link>
                      <ActionIcon
                        variant="filled"
                        color="red"
                        size="sm"
                        pos="absolute"
                        top={4}
                        right={4}
                        onClick={() => { handleRemoveImage(img.imageId); }}
                        loading={removeImageMutation.isPending}
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Card.Section>
                    <Text size="xs" c="dimmed" mt="xs" truncate>
                      {img.filename}
                    </Text>
                  </Card>
                ))}
              </SimpleGrid>
            )}
      </Stack>

      {/* Edit Modal */}
      <Modal
        opened={editModalOpen}
        onClose={() => { setEditModalOpen(false); }}
        title="Edit Collection"
      >
        <Stack>
          <TextInput
            label="Name"
            placeholder="Enter collection name"
            value={editName}
            onChange={(e) => { setEditName(e.target.value); }}
            required
          />
          <Textarea
            label="Description"
            placeholder="Enter collection description (optional)"
            value={editDescription}
            onChange={(e) => { setEditDescription(e.target.value); }}
            rows={3}
          />
          {updateMutation.isError && (
            <Alert icon={<IconAlertCircle size={16} />} color="red">
              {updateMutation.error instanceof Error
                ? updateMutation.error.message
                : 'Failed to update collection'}
            </Alert>
          )}
          <Group justify="flex-end">
            <Button variant="light" onClick={() => { setEditModalOpen(false); }}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              loading={updateMutation.isPending}
              disabled={editName.trim() === ''}
            >
              Save
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete Modal */}
      <Modal
        opened={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); }}
        title="Delete Collection"
      >
        <Stack>
          <Text>
            Are you sure you want to delete &quot;
            {collection.name}
            &quot;? This will not delete the images themselves.
          </Text>
          <Group justify="flex-end">
            <Button variant="light" onClick={() => { setDeleteModalOpen(false); }}>
              Cancel
            </Button>
            <Button
              color="red"
              onClick={handleDelete}
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
