import {
  Badge,
  Button,
  Card,
  Checkbox,
  Group,
  Image,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core';
import { Link } from 'react-router';
import type { DuplicateGroup } from '@/features/duplicates/api';

interface DuplicateGroupCardProps {
  group: DuplicateGroup;
  selectedIds: Set<string>;
  onSelectToggle: (imageId: string) => void;
  onSelectAllDuplicates: (group: DuplicateGroup) => void;
}

function getThumbnailUrl(imageId: string): string {
  return `/api/images/${imageId}/thumbnail`;
}

function formatDistance(distance: number): string {
  // Convert distance to similarity percentage (0 = 100% similar, higher = less similar)
  const similarity = Math.max(0, (1 - distance) * 100);
  return `${similarity.toFixed(1)}%`;
}

export function DuplicateGroupCard({
  group,
  selectedIds,
  onSelectToggle,
  onSelectAllDuplicates,
}: DuplicateGroupCardProps): React.JSX.Element {
  const allDuplicatesSelected = group.duplicates.every(dup =>
    selectedIds.has(dup.id),
  );

  return (
    <Card shadow="sm" padding="md" radius="md" withBorder>
      <Stack gap="md">
        <Group justify="space-between">
          <Text fw={500}>
            {group.duplicates.length}
            {' '}
            duplicate
            {group.duplicates.length !== 1 ? 's' : ''}
            {' '}
            found
          </Text>
          <Button
            variant="light"
            size="xs"
            onClick={() => { onSelectAllDuplicates(group); }}
          >
            {allDuplicatesSelected ? 'Deselect All' : 'Select All Duplicates'}
          </Button>
        </Group>

        <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing="md">
          {/* Original Image */}
          <Card shadow="xs" padding="xs" radius="sm" withBorder>
            <Card.Section>
              <Link to={`/images/${group.original.id}`}>
                <Image
                  src={getThumbnailUrl(group.original.id)}
                  alt={group.original.filename}
                  height={120}
                  fit="cover"
                />
              </Link>
            </Card.Section>
            <Stack gap={4} mt="xs">
              <Badge color="green" size="sm" variant="filled">
                Original
              </Badge>
              <Text size="xs" c="dimmed" truncate>
                {group.original.filename}
              </Text>
            </Stack>
          </Card>

          {/* Duplicate Images */}
          {group.duplicates.map(dup => (
            <Card key={dup.id} shadow="xs" padding="xs" radius="sm" withBorder>
              <Card.Section pos="relative">
                <Checkbox
                  pos="absolute"
                  top={4}
                  left={4}
                  checked={selectedIds.has(dup.id)}
                  onChange={() => { onSelectToggle(dup.id); }}
                  style={{ zIndex: 1 }}
                />
                <Link to={`/images/${dup.id}`}>
                  <Image
                    src={getThumbnailUrl(dup.id)}
                    alt={dup.filename}
                    height={120}
                    fit="cover"
                  />
                </Link>
              </Card.Section>
              <Stack gap={4} mt="xs">
                <Group gap={4}>
                  <Badge color="orange" size="sm" variant="light">
                    Duplicate
                  </Badge>
                  {dup.distance !== undefined && (
                    <Badge color="gray" size="xs" variant="outline">
                      {formatDistance(dup.distance)}
                      {' '}
                      similar
                    </Badge>
                  )}
                </Group>
                <Text size="xs" c="dimmed" truncate>
                  {dup.filename}
                </Text>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      </Stack>
    </Card>
  );
}
