/* v8 ignore file -- View: 純粋な描画コンポーネントなので Storybook テストでカバー */
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
import { imageEndpoints } from '@picstash/api';
import {
  IconAlertCircle,
  IconArrowLeft,
  IconEdit,
  IconPhoto,
  IconPlayerPlay,
  IconTrash,
} from '@tabler/icons-react';
import { Link } from 'react-router';
import type { CollectionWithImages } from '@/entities/collection';

export interface CollectionDetailPageViewProps {
  id: string | undefined;
  collection: CollectionWithImages | undefined;
  isLoading: boolean;
  error: Error | null;
  editModalOpen: boolean;
  deleteModalOpen: boolean;
  editName: string;
  editDescription: string;
  isUpdating: boolean;
  isDeleting: boolean;
  isRemovingImage: boolean;
  updateError: string | null;
  onOpenEdit: () => void;
  onCloseEditModal: () => void;
  onEditNameChange: (value: string) => void;
  onEditDescriptionChange: (value: string) => void;
  onUpdate: () => void;
  onOpenDeleteModal: () => void;
  onCloseDeleteModal: () => void;
  onDelete: () => void;
  onRemoveImage: (imageId: string) => void;
}

export function CollectionDetailPageView({
  id,
  collection,
  isLoading,
  error,
  editModalOpen,
  deleteModalOpen,
  editName,
  editDescription,
  isUpdating,
  isDeleting,
  isRemovingImage,
  updateError,
  onOpenEdit,
  onCloseEditModal,
  onEditNameChange,
  onEditDescriptionChange,
  onUpdate,
  onOpenDeleteModal,
  onCloseDeleteModal,
  onDelete,
  onRemoveImage,
}: CollectionDetailPageViewProps): React.JSX.Element {
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
        <Alert icon={<IconAlertCircle size={16} />} title="エラー" color="red">
          {error instanceof Error ? error.message : 'コレクションが見つかりません'}
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
                表示
              </Button>
            )}
            <Button
              variant="light"
              leftSection={<IconEdit size={16} />}
              onClick={onOpenEdit}
            >
              編集
            </Button>
            <Button
              variant="light"
              color="red"
              leftSection={<IconTrash size={16} />}
              onClick={onOpenDeleteModal}
            >
              削除
            </Button>
          </Group>
        </Group>

        {/* Image count */}
        <Text c="dimmed">
          {collection.images.length}
          件の画像
        </Text>

        {/* Images */}
        {collection.images.length === 0
          ? (
              <Card padding="xl" withBorder>
                <Stack align="center" gap="md">
                  <IconPhoto size={48} color="gray" />
                  <Text c="dimmed">このコレクションには画像がありません</Text>
                  <Text size="sm" c="dimmed">
                    画像の詳細ページから追加してください
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
                          src={imageEndpoints.thumbnail(img.imageId)}
                          alt={img.title}
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
                        onClick={() => { onRemoveImage(img.imageId); }}
                        loading={isRemovingImage}
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Card.Section>
                  </Card>
                ))}
              </SimpleGrid>
            )}
      </Stack>

      {/* Edit Modal */}
      <Modal
        opened={editModalOpen}
        onClose={onCloseEditModal}
        title="コレクションを編集"
      >
        <Stack>
          <TextInput
            label="名前"
            placeholder="コレクション名を入力"
            value={editName}
            onChange={(e) => { onEditNameChange(e.target.value); }}
            required
          />
          <Textarea
            label="説明"
            placeholder="説明を入力（オプション）"
            value={editDescription}
            onChange={(e) => { onEditDescriptionChange(e.target.value); }}
            rows={3}
          />
          {updateError !== null && (
            <Alert icon={<IconAlertCircle size={16} />} color="red">
              {updateError}
            </Alert>
          )}
          <Group justify="flex-end">
            <Button variant="light" onClick={onCloseEditModal}>
              キャンセル
            </Button>
            <Button
              onClick={onUpdate}
              loading={isUpdating}
              disabled={editName.trim() === ''}
            >
              保存
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete Modal */}
      <Modal
        opened={deleteModalOpen}
        onClose={onCloseDeleteModal}
        title="コレクションを削除"
      >
        <Stack>
          <Text>
            「
            {collection.name}
            」を削除しますか？画像自体は削除されません。
          </Text>
          <Group justify="flex-end">
            <Button variant="light" onClick={onCloseDeleteModal}>
              キャンセル
            </Button>
            <Button
              color="red"
              onClick={onDelete}
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
