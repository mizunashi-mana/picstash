import {
  Alert,
  Card,
  Container,
  Loader,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { LabelForm } from '@/features/labels/ui/LabelForm';
import { LabelList } from '@/features/labels/ui/LabelList';
import type {
  CreateLabelInput,
  Label,
  UpdateLabelInput,
} from '@/entities/label';

export interface LabelsPageViewProps {
  labels: Label[] | undefined;
  isLoading: boolean;
  error: Error | null;
  existingColors: string[];
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  createError: string | null;
  onCreate: (input: CreateLabelInput | UpdateLabelInput) => void;
  onUpdate: (id: string, input: UpdateLabelInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function LabelsPageView({
  labels,
  isLoading,
  error,
  existingColors,
  isCreating,
  isUpdating,
  isDeleting,
  createError,
  onCreate,
  onUpdate,
  onDelete,
}: LabelsPageViewProps): React.JSX.Element {
  return (
    <Container size="md" py="xl">
      <Stack gap="xl">
        <Stack gap="xs">
          <Title order={2}>ラベル管理</Title>
          <Text c="dimmed">
            画像を整理するためのラベルを作成・管理します
          </Text>
        </Stack>

        {/* Create Form */}
        <Card padding="lg" withBorder>
          <Stack gap="md">
            <Title order={4}>新しいラベルを作成</Title>
            <LabelForm
              mode="create"
              existingColors={existingColors}
              onSubmit={onCreate}
              isSubmitting={isCreating}
            />
          </Stack>
        </Card>

        {createError !== null && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="ラベルの作成エラー"
            color="red"
          >
            {createError}
          </Alert>
        )}

        {/* Label List */}
        <Stack gap="sm">
          <Title order={4}>ラベル一覧</Title>

          {isLoading && (
            <Stack align="center" py="xl">
              <Loader size="lg" />
            </Stack>
          )}

          {error && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              title="ラベルの読み込みエラー"
              color="red"
            >
              {error instanceof Error ? error.message : 'ラベルの読み込みに失敗しました'}
            </Alert>
          )}

          {labels && (
            <LabelList
              labels={labels}
              onUpdate={onUpdate}
              onDelete={onDelete}
              isUpdating={isUpdating}
              isDeleting={isDeleting}
            />
          )}
        </Stack>
      </Stack>
    </Container>
  );
}
