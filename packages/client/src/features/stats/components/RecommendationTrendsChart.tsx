import { BarChart } from '@mantine/charts';
import { Card, Text } from '@mantine/core';
import type { DailyRecommendationStats } from '@/features/stats/api';

interface RecommendationTrendsChartProps {
  data: DailyRecommendationStats[];
}

export function RecommendationTrendsChart({
  data,
}: RecommendationTrendsChartProps) {
  const chartData = data.map(item => ({
    date: item.date,
    impressions: item.impressions,
    clicks: item.clicks,
    conversionRate: Math.round(item.conversionRate * 100),
  }));

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Text fw={500} mb="md">
        Daily Recommendation Performance
      </Text>
      {data.length === 0
        ? (
            <Text c="dimmed" ta="center" py="xl">
              No recommendation data available
            </Text>
          )
        : (
            <BarChart
              h={300}
              data={chartData}
              dataKey="date"
              series={[
                { name: 'impressions', color: 'gray.5', label: 'Impressions' },
                { name: 'clicks', color: 'teal.6', label: 'Clicks' },
              ]}
              withLegend
              legendProps={{ verticalAlign: 'bottom', height: 50 }}
            />
          )}
    </Card>
  );
}
