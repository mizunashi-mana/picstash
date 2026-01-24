import { AreaChart } from '@mantine/charts';
import { Card, Text } from '@mantine/core';
import type { DailyViewStats } from '@/features/stats/api';

interface ViewTrendsChartProps {
  data: DailyViewStats[];
}

export function ViewTrendsChart({ data }: ViewTrendsChartProps) {
  const chartData = data.map(item => ({
    date: item.date,
    views: item.viewCount,
    durationMinutes: Math.round(item.totalDuration / 60000),
  }));

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Text fw={500} mb="md">
        日別閲覧トレンド
      </Text>
      {data.length === 0
        ? (
            <Text c="dimmed" ta="center" py="xl">
              閲覧データがありません
            </Text>
          )
        : (
            <AreaChart
              h={300}
              data={chartData}
              dataKey="date"
              series={[
                { name: 'views', color: 'blue.6', label: '閲覧数' },
              ]}
              curveType="monotone"
              withLegend
              legendProps={{ verticalAlign: 'bottom', height: 50 }}
            />
          )}
    </Card>
  );
}
