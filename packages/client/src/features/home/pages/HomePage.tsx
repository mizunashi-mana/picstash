import { Container, Stack, Text, Title } from '@mantine/core';
import { ImageDropzone } from '@/features/upload';

export function HomePage() {
  return (
    <Container size="sm" py="xl">
      <Stack gap="xl">
        <Stack align="center" gap="md">
          <Title order={1}>Picstash</Title>
          <Text c="dimmed">Your personal image library</Text>
        </Stack>
        <ImageDropzone />
      </Stack>
    </Container>
  );
}
