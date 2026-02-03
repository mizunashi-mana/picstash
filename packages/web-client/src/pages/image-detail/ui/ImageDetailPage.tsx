import { useState } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { deleteImage, fetchImage } from '@/entities/image';
import { useViewHistory } from '@/features/track-view-history';
import { ImageDetailPageView } from '@/pages/image-detail/ui/ImageDetailPageView';

export function ImageDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const conversionId = searchParams.get('conversionId');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [opened, { open, close }] = useDisclosure(false);
  const [isDeleted, setIsDeleted] = useState(false);

  const { data: image, isLoading, error } = useQuery({
    queryKey: ['image', id],
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- enabled ensures id is defined
    queryFn: async () => await fetchImage(id!),
    enabled: id !== undefined && id !== '',
  });

  const deleteMutation = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- button is disabled when id is undefined
    mutationFn: async () => { await deleteImage(id!); },
    onSuccess: async () => {
      // Mark as deleted before navigation to prevent view history update
      setIsDeleted(true);
      close();
      // Invalidate caches that may contain the deleted image
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

  return (
    <ImageDetailPageView
      image={image}
      isLoading={isLoading}
      error={error}
      deleteModalOpened={opened}
      isDeleting={deleteMutation.isPending}
      onOpenDeleteModal={open}
      onCloseDeleteModal={close}
      onDelete={() => { deleteMutation.mutate(); }}
    />
  );
}
