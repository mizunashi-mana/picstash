import { useState } from 'react';
import { Container, Grid, Group, SegmentedControl, Stack, Text, Title } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { PopularImagesList } from '@/features/stats/components/PopularImagesList';
import { RecommendationTrendsChart } from '@/features/stats/components/RecommendationTrendsChart';
import { StatsOverviewCards } from '@/features/stats/components/StatsOverviewCards';
import { ViewTrendsChart } from '@/features/stats/components/ViewTrendsChart';
import { useApiClient } from '@/shared';

const PERIOD_OPTIONS = [
  { label: '7日間', value: '7' },
  { label: '30日間', value: '30' },
  { label: '90日間', value: '90' },
];

export function StatsPage() {
  const [days, setDays] = useState('30');
  const daysNumber = parseInt(days, 10);
  const apiClient = useApiClient();

  const overviewQuery = useQuery({
    queryKey: ['stats', 'overview', daysNumber],
    queryFn: async () => await apiClient.stats.overview({ days: daysNumber }),
  });

  const viewTrendsQuery = useQuery({
    queryKey: ['stats', 'view-trends', daysNumber],
    queryFn: async () => await apiClient.stats.viewTrends({ days: daysNumber }),
  });

  const recommendationTrendsQuery = useQuery({
    queryKey: ['stats', 'recommendation-trends', daysNumber],
    queryFn: async () => await apiClient.stats.recommendationTrends({ days: daysNumber }),
  });

  const popularImagesQuery = useQuery({
    queryKey: ['stats', 'popular-images', daysNumber],
    queryFn: async () => await apiClient.stats.popularImages({ days: daysNumber, limit: 10 }),
  });

  const isLoading
    = overviewQuery.isLoading
      || viewTrendsQuery.isLoading
      || recommendationTrendsQuery.isLoading
      || popularImagesQuery.isLoading;

  const hasError
    = overviewQuery.isError
      || viewTrendsQuery.isError
      || recommendationTrendsQuery.isError
      || popularImagesQuery.isError;

  return (
    <Container size="xl" py="md">
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <Title order={2}>統計ダッシュボード</Title>
          <SegmentedControl
            value={days}
            onChange={setDays}
            data={PERIOD_OPTIONS}
          />
        </Group>

        {hasError && (
          <Text c="red">統計の読み込みに失敗しました。再度お試しください。</Text>
        )}

        {isLoading
          ? (
              <Text c="dimmed">統計を読み込み中...</Text>
            )
          : (
              <>
                {overviewQuery.data !== undefined && (
                  <StatsOverviewCards stats={overviewQuery.data} />
                )}

                <Grid gutter="lg">
                  <Grid.Col span={{ base: 12, md: 6 }} style={{ minWidth: 0 }}>
                    {viewTrendsQuery.data !== undefined && (
                      <ViewTrendsChart data={viewTrendsQuery.data} />
                    )}
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }} style={{ minWidth: 0 }}>
                    {recommendationTrendsQuery.data !== undefined && (
                      <RecommendationTrendsChart
                        data={recommendationTrendsQuery.data}
                      />
                    )}
                  </Grid.Col>
                </Grid>

                {popularImagesQuery.data !== undefined && (
                  <PopularImagesList images={popularImagesQuery.data} />
                )}
              </>
            )}
      </Stack>
    </Container>
  );
}
