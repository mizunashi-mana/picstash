import { Container, Stack, Tabs, Text, Title } from '@mantine/core';
import { IconArchive, IconPhoto, IconWorld } from '@tabler/icons-react';
import { ArchiveImportTab } from '@/features/import/ui/ArchiveImportTab';
import { ImageUploadTab } from '@/features/import/ui/ImageUploadTab';
import { UrlCrawlTab } from '@/features/import/ui/UrlCrawlTab';

export function ImportPage() {
  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Stack align="center" gap="md">
          <Title order={1}>インポート</Title>
          <Text c="dimmed">画像、アーカイブ、URL から取り込み</Text>
        </Stack>

        <Tabs defaultValue="image">
          <Tabs.List grow>
            <Tabs.Tab value="image" leftSection={<IconPhoto size={16} />}>
              画像
            </Tabs.Tab>
            <Tabs.Tab value="archive" leftSection={<IconArchive size={16} />}>
              アーカイブ
            </Tabs.Tab>
            <Tabs.Tab value="url" leftSection={<IconWorld size={16} />}>
              URL
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="image" pt="xl">
            <ImageUploadTab />
          </Tabs.Panel>

          <Tabs.Panel value="archive" pt="xl">
            <ArchiveImportTab />
          </Tabs.Panel>

          <Tabs.Panel value="url" pt="xl">
            <UrlCrawlTab />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}
