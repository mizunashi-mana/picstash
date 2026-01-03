import { Button, Container, Stack, Text, Title } from '@mantine/core';

export function HomePage() {
  return (
    <Container size="sm" py="xl">
      <Stack align="center" gap="md">
        <Title order={1}>Picstash</Title>
        <Text c="dimmed">Your personal image library</Text>
        <Button variant="filled">Get Started</Button>
      </Stack>
    </Container>
  );
}
