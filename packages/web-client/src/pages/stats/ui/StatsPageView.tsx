import { Container, Grid, Group, SegmentedControl, Stack, Text, Title } from '@mantine/core';
import { PopularImagesList } from '@/features/view-stats/ui/PopularImagesList';
import { RecommendationTrendsChart } from '@/features/view-stats/ui/RecommendationTrendsChart';
import { StatsOverviewCards } from '@/features/view-stats/ui/StatsOverviewCards';
import { ViewTrendsChart } from '@/features/view-stats/ui/ViewTrendsChart';
import type {
  DailyRecommendationStats,
  DailyViewStats,
  OverviewStats,
  PopularImage,
} from '@/features/view-stats/api/stats';

export interface StatsPageViewProps {
  /** 期間（日数） */
  days: string;
  /** 概要統計 */
  overviewStats: OverviewStats | undefined;
  /** 閲覧トレンド */
  viewTrends: DailyViewStats[] | undefined;
  /** レコメンドトレンド */
  recommendationTrends: DailyRecommendationStats[] | undefined;
  /** 人気画像 */
  popularImages: PopularImage[] | undefined;
  /** ローディング中 */
  isLoading: boolean;
  /** エラー */
  hasError: boolean;
  /** 期間変更ハンドラ */
  onDaysChange: (value: string) => void;
}

const PERIOD_OPTIONS = [
  { label: '7日間', value: '7' },
  { label: '30日間', value: '30' },
  { label: '90日間', value: '90' },
];

export function StatsPageView({
  days,
  overviewStats,
  viewTrends,
  recommendationTrends,
  popularImages,
  isLoading,
  hasError,
  onDaysChange,
}: StatsPageViewProps) {
  return (
    <Container size="xl" py="md">
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <Title order={2}>統計ダッシュボード</Title>
          <SegmentedControl value={days} onChange={onDaysChange} data={PERIOD_OPTIONS} />
        </Group>
        {hasError && (<Text c="red">統計の読み込みに失敗しました。再度お試しください。</Text>)}
        {isLoading
          ? (<Text c="dimmed">統計を読み込み中...</Text>)
          : (
              <>
                {overviewStats !== undefined && (<StatsOverviewCards stats={overviewStats} />)}
                <Grid gutter="lg">
                  <Grid.Col span={{ base: 12, md: 6 }} style={{ minWidth: 0 }}>
                    {viewTrends !== undefined && (<ViewTrendsChart data={viewTrends} />)}
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }} style={{ minWidth: 0 }}>
                    {recommendationTrends !== undefined && (<RecommendationTrendsChart data={recommendationTrends} />)}
                  </Grid.Col>
                </Grid>
                {popularImages !== undefined && (<PopularImagesList images={popularImages} />)}
              </>
            )}
      </Stack>
    </Container>
  );
}
