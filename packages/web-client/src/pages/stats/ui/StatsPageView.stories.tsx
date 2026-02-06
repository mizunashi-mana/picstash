import { expect, fn, userEvent, within } from 'storybook/test';
import { StatsPageView } from './StatsPageView';
import type { Meta, StoryObj } from '@storybook/react-vite';

const mockGetThumbnailUrl = (imageId: string) => `/api/images/${imageId}/thumbnail`;

const meta = {
  title: 'Pages/Stats/StatsPageView',
  component: StatsPageView,
  args: {
    days: '7',
    onDaysChange: fn(),
    getThumbnailUrl: mockGetThumbnailUrl,
  },
} satisfies Meta<typeof StatsPageView>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockOverviewStats = {
  totalImages: 156,
  totalViews: 2340,
  totalViewDuration: 4680000,
  conversionRate: 0.32,
  avgViewDuration: 12000,
};

const mockViewTrends = [
  { date: '2026-01-28', viewCount: 45, totalDuration: 90000 },
  { date: '2026-01-29', viewCount: 52, totalDuration: 104000 },
  { date: '2026-01-30', viewCount: 38, totalDuration: 76000 },
  { date: '2026-01-31', viewCount: 61, totalDuration: 122000 },
  { date: '2026-02-01', viewCount: 47, totalDuration: 94000 },
  { date: '2026-02-02', viewCount: 55, totalDuration: 110000 },
  { date: '2026-02-03', viewCount: 42, totalDuration: 84000 },
];

const mockRecommendationTrends = [
  { date: '2026-01-28', impressions: 120, clicks: 38, conversionRate: 0.32 },
  { date: '2026-01-29', impressions: 135, clicks: 45, conversionRate: 0.33 },
  { date: '2026-01-30', impressions: 98, clicks: 28, conversionRate: 0.29 },
  { date: '2026-01-31', impressions: 150, clicks: 52, conversionRate: 0.35 },
  { date: '2026-02-01', impressions: 115, clicks: 36, conversionRate: 0.31 },
  { date: '2026-02-02', impressions: 140, clicks: 48, conversionRate: 0.34 },
  { date: '2026-02-03', impressions: 108, clicks: 32, conversionRate: 0.30 },
];

const mockPopularImages = [
  {
    id: '1',
    title: '夕焼けの海岸',
    thumbnailPath: null,
    viewCount: 89,
    totalDuration: 178000,
    lastViewedAt: '2026-02-03T10:30:00.000Z',
  },
  {
    id: '2',
    title: '桜並木の風景',
    thumbnailPath: null,
    viewCount: 72,
    totalDuration: 144000,
    lastViewedAt: '2026-02-03T09:15:00.000Z',
  },
  {
    id: '3',
    title: '山頂からの眺望',
    thumbnailPath: null,
    viewCount: 56,
    totalDuration: 112000,
    lastViewedAt: '2026-02-02T18:45:00.000Z',
  },
];

export const Default: Story = {
  args: {
    days: '7',
    overviewStats: mockOverviewStats,
    viewTrends: mockViewTrends,
    recommendationTrends: mockRecommendationTrends,
    popularImages: mockPopularImages,
    isLoading: false,
    hasError: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // ページタイトルが表示されていることを確認
    await expect(canvas.getByText('統計ダッシュボード')).toBeInTheDocument();

    // 期間セレクターが表示されていることを確認
    await expect(canvas.getByText('7日間')).toBeInTheDocument();
    await expect(canvas.getByText('30日間')).toBeInTheDocument();
    await expect(canvas.getByText('90日間')).toBeInTheDocument();
  },
};

export const Loading: Story = {
  args: {
    days: '7',
    overviewStats: undefined,
    viewTrends: undefined,
    recommendationTrends: undefined,
    popularImages: undefined,
    isLoading: true,
    hasError: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // ページタイトルが表示されていることを確認
    await expect(canvas.getByText('統計ダッシュボード')).toBeInTheDocument();

    // ローディングメッセージが表示されていることを確認
    await expect(canvas.getByText('統計を読み込み中...')).toBeInTheDocument();
  },
};

export const ErrorState: Story = {
  args: {
    days: '7',
    overviewStats: undefined,
    viewTrends: undefined,
    recommendationTrends: undefined,
    popularImages: undefined,
    isLoading: false,
    hasError: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // ページタイトルが表示されていることを確認
    await expect(canvas.getByText('統計ダッシュボード')).toBeInTheDocument();

    // エラーメッセージが表示されていることを確認
    await expect(canvas.getByText('統計の読み込みに失敗しました。再度お試しください。')).toBeInTheDocument();
  },
};

export const ThirtyDays: Story = {
  args: {
    days: '30',
    overviewStats: mockOverviewStats,
    viewTrends: mockViewTrends,
    recommendationTrends: mockRecommendationTrends,
    popularImages: mockPopularImages,
    isLoading: false,
    hasError: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // ページタイトルが表示されていることを確認
    await expect(canvas.getByText('統計ダッシュボード')).toBeInTheDocument();
  },
};

export const NinetyDays: Story = {
  args: {
    days: '90',
    overviewStats: mockOverviewStats,
    viewTrends: mockViewTrends,
    recommendationTrends: mockRecommendationTrends,
    popularImages: mockPopularImages,
    isLoading: false,
    hasError: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // ページタイトルが表示されていることを確認
    await expect(canvas.getByText('統計ダッシュボード')).toBeInTheDocument();
  },
};

export const ChangePeriodInteraction: Story = {
  args: {
    days: '7',
    overviewStats: mockOverviewStats,
    viewTrends: mockViewTrends,
    recommendationTrends: mockRecommendationTrends,
    popularImages: mockPopularImages,
    isLoading: false,
    hasError: false,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // 30日間ボタンをクリック
    const thirtyDaysButton = canvas.getByText('30日間');
    await userEvent.click(thirtyDaysButton);

    // onDaysChange が呼ばれていることを確認
    await expect(args.onDaysChange).toHaveBeenCalled();
  },
};
