import { expect, fn, within } from 'storybook/test';
import { CollectionViewerPageView } from './CollectionViewerPageView';
import type { CollectionWithImages } from '@/entities/collection';
import type { Meta, StoryObj } from '@storybook/react-vite';

const mockCollection: CollectionWithImages = {
  id: 'col-1',
  name: 'お気に入り風景',
  description: '旅行で撮影した風景写真のコレクション',
  coverImageId: 'img-1',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-02T00:00:00Z',
  images: [
    { id: 'ci-1', imageId: 'img-1', order: 0, title: '富士山', thumbnailPath: '/thumbs/img-1.jpg' },
    { id: 'ci-2', imageId: 'img-2', order: 1, title: '桜並木', thumbnailPath: '/thumbs/img-2.jpg' },
    { id: 'ci-3', imageId: 'img-3', order: 2, title: '海岸', thumbnailPath: '/thumbs/img-3.jpg' },
  ],
};

const meta = {
  title: 'Pages/Collections/CollectionViewerPageView',
  component: CollectionViewerPageView,
  args: {
    id: 'col-1',
    collection: mockCollection,
    isLoading: false,
    error: null,
    currentIndex: 0,
    currentImage: mockCollection.images[0],
    canGoPrev: false,
    canGoNext: true,
    onGoPrev: fn(),
    onGoNext: fn(),
    onClose: fn(),
  },
} satisfies Meta<typeof CollectionViewerPageView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // コレクション名が表示されていることを確認
    await expect(canvas.getByText('お気に入り風景')).toBeInTheDocument();

    // ページインジケーターが表示されていることを確認（ヘッダーとフッターに存在）
    const indicators = canvas.getAllByText(/1 \/ 3/);
    await expect(indicators.length).toBeGreaterThanOrEqual(1);

    // ナビゲーションボタンが表示されていることを確認
    await expect(canvas.getByRole('button', { name: '前の画像' })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: '次の画像' })).toBeInTheDocument();

    // 前の画像ボタンが無効、次の画像ボタンが有効であることを確認
    await expect(canvas.getByRole('button', { name: '前の画像' })).toBeDisabled();
    await expect(canvas.getByRole('button', { name: '次の画像' })).toBeEnabled();

    // 閉じるボタンが表示されていることを確認
    await expect(canvas.getByRole('button', { name: 'ビューアを閉じる' })).toBeInTheDocument();

    // コレクションに戻るリンクが表示されていることを確認
    await expect(canvas.getByRole('link', { name: 'コレクションに戻る' })).toBeInTheDocument();
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
    collection: undefined,
    currentImage: null,
  },
  play: async ({ canvasElement }) => {
    // Mantine Loader は accessible role を持たないため CSS クラスで検証
    await expect(canvasElement.querySelector('.mantine-Loader-root')).toBeTruthy();
  },
};

export const Error: Story = {
  args: {
    error: new globalThis.Error('コレクションの取得に失敗しました'),
    collection: undefined,
    currentImage: null,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // エラータイトルが表示されていることを確認
    await expect(canvas.getByText('エラー')).toBeInTheDocument();

    // エラーメッセージが表示されていることを確認
    await expect(canvas.getByText('コレクションの取得に失敗しました')).toBeInTheDocument();
  },
};
