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
    filename: 'sample-image-1.jpg',
    path: '/storage/originals/sample-1.jpg',
    thumbnailPath: '/storage/thumbnails/sample-1.jpg',
    mimeType: 'image/jpeg',
    size: 102400,
    width: 1920,
    height: 1080,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    filename: 'sample-image-2.png',
    path: '/storage/originals/sample-2.png',
    thumbnailPath: '/storage/thumbnails/sample-2.jpg',
    mimeType: 'image/png',
    size: 204800,
    width: 1280,
    height: 720,
    createdAt: '2026-01-02T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  },
  {
    id: '3',
    filename: 'sample-image-3.gif',
    path: '/storage/originals/sample-3.gif',
    thumbnailPath: '/storage/thumbnails/sample-3.jpg',
    mimeType: 'image/gif',
    size: 51200,
    width: 800,
    height: 600,
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

    // ファイル名が表示されていることを確認
    await expect(canvas.getByText('sample-image-1.jpg')).toBeInTheDocument();
    await expect(canvas.getByText('sample-image-2.png')).toBeInTheDocument();
    await expect(canvas.getByText('sample-image-3.gif')).toBeInTheDocument();
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
    await expect(canvas.getByText('No images yet')).toBeInTheDocument();
    await expect(canvas.getByText('Upload your first image to get started')).toBeInTheDocument();
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
    await expect(canvas.getByText('Loading images...')).toBeInTheDocument();
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
    await expect(canvas.getByText('Error')).toBeInTheDocument();
    await expect(canvas.getByText(/Network error/)).toBeInTheDocument();
  },
};

export const SingleImage: Story = {
  args: {
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
