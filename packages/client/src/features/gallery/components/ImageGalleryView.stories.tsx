import { expect, within } from 'storybook/test';
import { ImageGalleryView } from './ImageGalleryView';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Features/Gallery/ImageGalleryView',
  component: ImageGalleryView,
} satisfies Meta<typeof ImageGalleryView>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockImages = [
  {
    id: '1',
    path: '/storage/originals/sample-1.jpg',
    thumbnailPath: '/storage/thumbnails/sample-1.jpg',
    mimeType: 'image/jpeg',
    size: 102400,
    width: 1920,
    height: 1080,
    title: '無題の画像 (2026/01/01 00:00)',
    description: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    path: '/storage/originals/sample-2.png',
    thumbnailPath: '/storage/thumbnails/sample-2.jpg',
    mimeType: 'image/png',
    size: 204800,
    width: 1280,
    height: 720,
    title: 'A sample PNG image',
    description: 'A sample PNG image',
    createdAt: '2026-01-02T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  },
  {
    id: '3',
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

export const Default: Story = {
  args: {
    images: mockImages,
    isLoading: false,
    error: null,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 3つの画像カードが表示されていることを確認
    const cards = canvas.getAllByRole('link');
    await expect(cards).toHaveLength(3);
  },
};

export const Empty: Story = {
  args: {
    images: [],
    isLoading: false,
    error: null,
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
    images: undefined,
    isLoading: true,
    error: null,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // ローディングメッセージが表示されていることを確認
    await expect(canvas.getByText('画像を読み込み中...')).toBeInTheDocument();
  },
};

export const ErrorState: Story = {
  args: {
    images: undefined,
    isLoading: false,
    error: new globalThis.Error('Network error'),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // エラーメッセージが表示されていることを確認
    await expect(canvas.getByText('エラー')).toBeInTheDocument();
    await expect(canvas.getByText(/Network error/)).toBeInTheDocument();
  },
};

export const SingleImage: Story = {
  args: {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- test data is defined
    images: [mockImages[0]!],
    isLoading: false,
    error: null,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 1つの画像カードが表示されていることを確認
    const cards = canvas.getAllByRole('link');
    await expect(cards).toHaveLength(1);
  },
};
