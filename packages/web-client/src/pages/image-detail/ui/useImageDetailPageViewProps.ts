/* v8 ignore file -- Hook: API 呼び出しが主体でモック困難 */
import { useState } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { useViewHistory } from '@/features/track-view-history';
import { useApiClient } from '@/shared';
import type { ImageDetailPageViewProps } from '@/pages/image-detail/ui/ImageDetailPageView';

export function useImageDetailPageViewProps(): ImageDetailPageViewProps {
  // === State ===
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const conversionId = searchParams.get('conversionId');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [opened, { open, close }] = useDisclosure(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const apiClient = useApiClient();

  // === Queries ===
  const { data: image, isLoading, error } = useQuery({
    queryKey: ['image', id],
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- enabled ensures id is defined
    queryFn: async () => await apiClient.images.detail(id!),
    enabled: id !== undefined && id !== '',
  });

  // === Mutations ===
  const deleteMutation = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- button is disabled when id is undefined
    mutationFn: async () => { await apiClient.images.delete(id!); },
    onSuccess: async () => {
      setIsDeleted(true);
      close();
      await queryClient.invalidateQueries({ queryKey: ['images'] });
      await queryClient.invalidateQueries({ queryKey: ['images-paginated'] });
      await queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      await navigate('/gallery');
    },
  });

  // Track view history for this image
  // If conversionId is present, also record the recommendation click
  // Skip cleanup if image was deleted (view history is cascade deleted)
  useViewHistory(id, { conversionId, isDeleted });

  // === Handlers ===
  const onDelete = (): void => {
    deleteMutation.mutate();
  };

  return {
    image,
    imageUrl: image ? apiClient.images.getImageUrl(image.id) : undefined,
    isLoading,
    error,
    deleteModalOpened: opened,
    isDeleting: deleteMutation.isPending,
    onOpenDeleteModal: open,
    onCloseDeleteModal: close,
    onDelete,
  };
}
