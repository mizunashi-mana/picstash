import { expect, within } from 'storybook/test';
import { SimilarImagesSectionView } from './SimilarImagesSectionView';
import type { SimilarImage } from '@/features/find-similar-images/api/similar';
import type { Meta, StoryObj } from '@storybook/react-vite';

const mockSimilarImages: SimilarImage[] = [
  { id: 'img-1', title: '富士山', thumbnailPath: '/thumbs/img-1.jpg', distance: 0.2 },
  { id: 'img-2', title: '桜並木', thumbnailPath: '/thumbs/img-2.jpg', distance: 0.5 },
  { id: 'img-3', title: '海岸', thumbnailPath: null, distance: 0.8 },
  { id: 'img-4', title: '夕焼け', thumbnailPath: '/thumbs/img-4.jpg', distance: 1.0 },
];

const mockGetThumbnailUrl = (imageId: string) => `/api/images/${imageId}/thumbnail`;

const meta = {
  title: 'Features/FindSimilarImages/SimilarImagesSectionView',
  component: SimilarImagesSectionView,
  args: {
    similarImages: [],
    isLoading: false,
    error: null,
    getThumbnailUrl: mockGetThumbnailUrl,
  },
} satisfies Meta<typeof SimilarImagesSectionView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    similarImages: mockSimilarImages,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // タイトルが表示されていることを確認
    await expect(canvas.getByText('類似画像')).toBeInTheDocument();

    // 類似度スコアが表示されていることを確認（90% = 1 - 0.2/2）
    await expect(canvas.getByText(/90/)).toBeInTheDocument();

    // サムネイルがないアイテムも表示されていることを確認
    await expect(canvas.getAllByRole('link').length).toBe(mockSimilarImages.length);
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // タイトルが表示されていることを確認
    await expect(canvas.getByText('類似画像')).toBeInTheDocument();

    // ローディングメッセージが表示されていることを確認
    await expect(canvas.getByText('類似画像を検索中...')).toBeInTheDocument();
  },
};

export const Error: Story = {
  args: {
    error: new globalThis.Error('類似画像の取得に失敗しました'),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // タイトルが表示されていることを確認
    await expect(canvas.getByText('類似画像')).toBeInTheDocument();

    // エラーメッセージが表示されていることを確認
    await expect(canvas.getByText('類似画像の取得に失敗しました。')).toBeInTheDocument();
  },
};

export const Empty: Story = {
  args: {
    similarImages: [],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // タイトルが表示されていることを確認
    await expect(canvas.getByText('類似画像')).toBeInTheDocument();

    // 空状態のメッセージが表示されていることを確認
    await expect(canvas.getByText('類似画像が見つかりませんでした')).toBeInTheDocument();
  },
};
