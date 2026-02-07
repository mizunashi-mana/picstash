import { Card, Group, SimpleGrid, Text } from '@mantine/core';
import type { OverviewStats } from '@picstash/api';

interface StatsOverviewCardsProps {
  stats: OverviewStats;
}

function formatDuration(ms: number | null): string {
  if (ms === null) {
    return '-';
  }
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function formatPercentage(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

export function StatsOverviewCards({ stats }: StatsOverviewCardsProps) {
  return (
    <SimpleGrid cols={{ base: 2, sm: 3, lg: 5 }}>
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Text size="sm" c="dimmed">
          総画像数
        </Text>
        <Text size="xl" fw={700}>
          {stats.totalImages.toLocaleString()}
        </Text>
      </Card>

      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Text size="sm" c="dimmed">
          総閲覧数
        </Text>
        <Text size="xl" fw={700}>
          {stats.totalViews.toLocaleString()}
        </Text>
      </Card>

      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Text size="sm" c="dimmed">
          総閲覧時間
        </Text>
        <Text size="xl" fw={700}>
          {formatDuration(stats.totalViewDuration)}
        </Text>
      </Card>

      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Text size="sm" c="dimmed">
          平均閲覧時間
        </Text>
        <Text size="xl" fw={700}>
          {formatDuration(stats.avgViewDuration)}
        </Text>
      </Card>

      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Text size="sm" c="dimmed">
          コンバージョン率
        </Text>
        <Group gap="xs" align="baseline">
          <Text size="xl" fw={700}>
            {formatPercentage(stats.conversionRate)}
          </Text>
        </Group>
      </Card>
    </SimpleGrid>
  );
}
