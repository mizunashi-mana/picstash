import { expect, within } from 'storybook/test';
import { RecommendationSectionView } from './RecommendationSectionView';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Features/ViewRecommendations/RecommendationSectionView',
  component: RecommendationSectionView,
} satisfies Meta<typeof RecommendationSectionView>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockRecommendations = [
  {
    id: 'img-1',
    title: '風景写真',
    thumbnailPath: '/storage/thumbnails/img-1.jpg',
    score: 0.95,
  },
  {
    id: 'img-2',
    title: 'ポートレート',
    thumbnailPath: '/storage/thumbnails/img-2.jpg',
    score: 0.87,
  },
  {
    id: 'img-3',
    title: '夜景',
    thumbnailPath: null,
    score: 0.82,
  },
];

const mockConversionMap = new Map<string, string>([
  ['img-1', 'conv-1'],
  ['img-2', 'conv-2'],
  ['img-3', 'conv-3'],
]);

export const Default: Story = {
  args: {
    recommendations: mockRecommendations,
    conversionMap: mockConversionMap,
    isLoading: false,
    error: null,
    emptyReason: undefined,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // タイトルが表示されていることを確認
    await expect(canvas.getByText('おすすめ')).toBeInTheDocument();

    // おすすめ画像のリンクが表示されていることを確認
    const links = canvas.getAllByRole('link');
    await expect(links).toHaveLength(3);
  },
};

export const Loading: Story = {
  args: {
    recommendations: [],
    conversionMap: new Map<string, string>(),
    isLoading: true,
    error: null,
    emptyReason: undefined,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // タイトルが表示されていることを確認
    await expect(canvas.getByText('おすすめ')).toBeInTheDocument();

    // ローディングメッセージが表示されていることを確認
    await expect(canvas.getByText('おすすめを読み込み中...')).toBeInTheDocument();
  },
};

export const Error: Story = {
  args: {
    recommendations: [],
    conversionMap: new Map<string, string>(),
    isLoading: false,
    error: new globalThis.Error('Network error'),
    emptyReason: undefined,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // タイトルが表示されていることを確認
    await expect(canvas.getByText('おすすめ')).toBeInTheDocument();

    // エラーメッセージが表示されていることを確認
    await expect(canvas.getByText('おすすめの読み込みに失敗しました')).toBeInTheDocument();
  },
};

export const EmptyNoHistory: Story = {
  args: {
    recommendations: [],
    conversionMap: new Map<string, string>(),
    isLoading: false,
    error: null,
    emptyReason: 'no_history',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // タイトルが表示されていることを確認
    await expect(canvas.getByText('おすすめ')).toBeInTheDocument();

    // 閲覧履歴なしのメッセージが表示されていることを確認
    await expect(canvas.getByText('もっと画像を見てみましょう。閲覧履歴に基づいておすすめが表示されます。')).toBeInTheDocument();
  },
};

export const EmptyNoEmbeddings: Story = {
  args: {
    recommendations: [],
    conversionMap: new Map<string, string>(),
    isLoading: false,
    error: null,
    emptyReason: 'no_embeddings',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // タイトルが表示されていることを確認
    await expect(canvas.getByText('おすすめ')).toBeInTheDocument();

    // 解析中のメッセージが表示されていることを確認
    await expect(canvas.getByText('画像の解析中です。しばらくお待ちください。')).toBeInTheDocument();
  },
};

export const EmptyNoSimilar: Story = {
  args: {
    recommendations: [],
    conversionMap: new Map<string, string>(),
    isLoading: false,
    error: null,
    emptyReason: 'no_similar',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // タイトルが表示されていることを確認
    await expect(canvas.getByText('おすすめ')).toBeInTheDocument();

    // 類似画像なしのメッセージが表示されていることを確認
    await expect(canvas.getByText('類似画像が見つかりませんでした。')).toBeInTheDocument();
  },
};

export const SingleRecommendation: Story = {
  args: {

    recommendations: [mockRecommendations[0]!],
    conversionMap: new Map<string, string>([['img-1', 'conv-1']]),
    isLoading: false,
    error: null,
    emptyReason: undefined,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // タイトルが表示されていることを確認
    await expect(canvas.getByText('おすすめ')).toBeInTheDocument();

    // 1つのおすすめ画像リンクが表示されていることを確認
    const links = canvas.getAllByRole('link');
    await expect(links).toHaveLength(1);
  },
};
