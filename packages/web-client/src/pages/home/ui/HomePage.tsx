/* v8 ignore file -- Container: Hook と View を接続するだけなので Storybook テストでカバー */
import { Container, Divider, Stack, Text, Title } from '@mantine/core';
import { useQueryClient } from '@tanstack/react-query';
import { ImageDropzone } from '@/features/upload-image';
import { RecommendationSection } from '@/features/view-recommendations';

export function HomePage() {
  const queryClient = useQueryClient();

  const handleUploadSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['images'] }).catch((error: unknown) => {
      // eslint-disable-next-line no-console -- Log error to help debug cache invalidation failures
      console.error('Failed to invalidate image queries after upload:', error);
    });
  };

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Stack align="center" gap="md">
          <Title order={1}>Picstash</Title>
          <Text c="dimmed">あなたの画像ライブラリ</Text>
        </Stack>
        <ImageDropzone onUploadSuccess={handleUploadSuccess} />
        <Divider />
        <RecommendationSection />
      </Stack>
    </Container>
  );
}
