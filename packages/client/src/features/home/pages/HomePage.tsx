import { Container, Divider, Stack, Text, Title } from '@mantine/core';
import { useQueryClient } from '@tanstack/react-query';
import { ImageGallery } from '@/features/gallery';
import { ImageDropzone } from '@/features/upload';

export function HomePage() {
  const queryClient = useQueryClient();

  const handleUploadSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['images'] }).catch(() => {
      // Ignore invalidation errors
    });
  };

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Stack align="center" gap="md">
          <Title order={1}>Picstash</Title>
          <Text c="dimmed">Your personal image library</Text>
        </Stack>
        <ImageDropzone onUploadSuccess={handleUploadSuccess} />
        <Divider />
        <ImageGallery />
      </Stack>
    </Container>
  );
}
