import { expect, fn, within } from 'storybook/test';
import { GalleryPageView } from './GalleryPageView';
import type { Image } from '@/entities/image';
import type { Meta, StoryObj } from '@storybook/react-vite';

const mockImages: Image[] = [
  {
    id: 'img-1',
    path: '/storage/originals/sample-1.jpg',
    thumbnailPath: '/storage/thumbnails/sample-1.jpg',
    mimeType: 'image/jpeg',
    size: 102400,
    width: 1920,
    height: 1080,
    title: '風景写真',
    description: '山と湖の風景写真',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'img-2',
    path: '/storage/originals/sample-2.png',
    thumbnailPath: '/storage/thumbnails/sample-2.jpg',
    mimeType: 'image/png',
    size: 204800,
    width: 1280,
    height: 720,
    title: 'ポートレート',
    description: null,
    createdAt: '2026-01-02T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  },
  {
    id: 'img-3',
    path: '/storage/originals/sample-3.gif',
    thumbnailPath: '/storage/thumbnails/sample-3.jpg',
    mimeType: 'image/gif',
    size: 51200,
    width: 800,
    height: 600,
    title: '無題の画像 (2026/01/03 00:00)',
    description: null,
    createdAt: '2026-01-03T00:00:00.000Z',
    updatedAt: '2026-01-03T00:00:00.000Z',
  },
];

const mockGetImageUrl = (imageId: string) => `/api/images/${imageId}/file`;
const mockGetThumbnailUrl = (imageId: string) => `/api/images/${imageId}/thumbnail`;

const meta = {
  title: 'Pages/Gallery/GalleryPageView',
  component: GalleryPageView,
  args: {
    getImageUrl: mockGetImageUrl,
    getThumbnailUrl: mockGetThumbnailUrl,
    onSearchChange: fn(),
    onDeleteAllHistory: fn(),
    onViewModeChange: fn(),
    onCarouselIndexChange: fn(),
  },
} satisfies Meta<typeof GalleryPageView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    query: '',
    viewMode: 'grid',
    allImages: mockImages,
    total: 3,
    isLoading: false,
    error: null,
    isFetchingNextPage: false,
    columns: 4,
    virtualRows: [],
    virtualTotalSize: 0,
    parentRef: { current: null },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // タイトルが表示されていることを確認
    await expect(canvas.getByText('ギャラリー')).toBeInTheDocument();

    // 画像総数が表示されていることを確認
    await expect(canvas.getByText(/3件/)).toBeInTheDocument();

    // ビューモード切替ボタンが表示されていることを確認
    await expect(canvas.getByRole('button', { name: 'グリッド表示' })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'カルーセル表示' })).toBeInTheDocument();
  },
};

export const Empty: Story = {
  args: {
    query: '',
    viewMode: 'grid',
    allImages: [],
    total: 0,
    isLoading: false,
    error: null,
    isFetchingNextPage: false,
    columns: 4,
    virtualRows: [],
    virtualTotalSize: 0,
    parentRef: { current: null },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 空状態のメッセージが表示されていることを確認
    await expect(canvas.getByText('画像がありません')).toBeInTheDocument();
    await expect(canvas.getByText('画像をアップロードしてください')).toBeInTheDocument();
  },
};

export const Loading: Story = {
  args: {
    query: '',
    viewMode: 'grid',
    allImages: [],
    total: 0,
    isLoading: true,
    error: null,
    isFetchingNextPage: false,
    columns: 4,
    virtualRows: [],
    virtualTotalSize: 0,
    parentRef: { current: null },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // ローディングメッセージが表示されていることを確認
    await expect(canvas.getByText('画像を読み込み中...')).toBeInTheDocument();
  },
};

export const Error: Story = {
  args: {
    query: '',
    viewMode: 'grid',
    allImages: [],
    total: 0,
    isLoading: false,
    error: new globalThis.Error('Network error'),
    isFetchingNextPage: false,
    columns: 4,
    virtualRows: [],
    virtualTotalSize: 0,
    parentRef: { current: null },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // エラーメッセージが表示されていることを確認
    await expect(canvas.getByText('エラー')).toBeInTheDocument();
    await expect(canvas.getByText(/Network error/)).toBeInTheDocument();
  },
};

export const SearchNoResults: Story = {
  args: {
    query: '存在しないキーワード',
    viewMode: 'grid',
    allImages: [],
    total: 0,
    isLoading: false,
    error: null,
    isFetchingNextPage: false,
    columns: 4,
    virtualRows: [],
    virtualTotalSize: 0,
    parentRef: { current: null },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 検索結果なしのメッセージが表示されていることを確認
    await expect(canvas.getByText('検索結果がありません')).toBeInTheDocument();
    await expect(canvas.getByText('別のキーワードで検索してください')).toBeInTheDocument();
  },
};
