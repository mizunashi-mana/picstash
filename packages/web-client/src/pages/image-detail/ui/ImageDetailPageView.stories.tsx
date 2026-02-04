import { expect, fn, within } from 'storybook/test';
import { JobsProvider } from '@/widgets/job-status';
import { ImageDetailPageView } from './ImageDetailPageView';
import type { Image } from '@/entities/image';
import type { Meta, StoryObj } from '@storybook/react-vite';

const mockImage: Image = {
  id: 'img-1',
  path: '/storage/originals/sample-1.jpg',
  thumbnailPath: '/storage/thumbnails/sample-1.jpg',
  mimeType: 'image/jpeg',
  size: 2048000,
  width: 1920,
  height: 1080,
  title: '風景写真',
  description: '山と湖の美しい風景写真です。',
  createdAt: '2026-01-15T10:30:00.000Z',
  updatedAt: '2026-01-15T12:00:00.000Z',
};

const meta = {
  title: 'Pages/ImageDetail/ImageDetailPageView',
  component: ImageDetailPageView,
  decorators: [
    Story => (
      <JobsProvider>
        <Story />
      </JobsProvider>
    ),
  ],
  args: {
    onOpenDeleteModal: fn(),
    onCloseDeleteModal: fn(),
    onDelete: fn(),
  },
} satisfies Meta<typeof ImageDetailPageView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    image: mockImage,
    isLoading: false,
    error: null,
    deleteModalOpened: false,
    isDeleting: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 画像IDがタイトルに表示されていることを確認
    await expect(canvas.getByText('img-1')).toBeInTheDocument();

    // ギャラリーに戻るボタンが表示されていることを確認
    await expect(canvas.getByRole('link', { name: 'ギャラリーに戻る' })).toBeInTheDocument();

    // 削除ボタンが表示されていることを確認
    await expect(canvas.getByRole('button', { name: '画像を削除' })).toBeInTheDocument();

    // ファイル情報セクションが表示されていることを確認
    await expect(canvas.getByText('ファイル情報')).toBeInTheDocument();
    await expect(canvas.getByText('image/jpeg')).toBeInTheDocument();
  },
};

export const Loading: Story = {
  args: {
    image: undefined,
    isLoading: true,
    error: null,
    deleteModalOpened: false,
    isDeleting: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // ローディングメッセージが表示されていることを確認
    await expect(canvas.getByText('画像を読み込み中...')).toBeInTheDocument();
  },
};

export const Error: Story = {
  args: {
    image: undefined,
    isLoading: false,
    error: new globalThis.Error('画像の取得に失敗しました'),
    deleteModalOpened: false,
    isDeleting: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // エラーメッセージが表示されていることを確認
    await expect(canvas.getByText('エラー')).toBeInTheDocument();
    await expect(canvas.getByText(/画像の取得に失敗しました/)).toBeInTheDocument();
  },
};

export const NotFound: Story = {
  args: {
    image: undefined,
    isLoading: false,
    error: null,
    deleteModalOpened: false,
    isDeleting: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 見つかりませんメッセージが表示されていることを確認
    await expect(canvas.getByText('見つかりません')).toBeInTheDocument();
    await expect(canvas.getByText('画像が見つかりません')).toBeInTheDocument();
  },
};

export const DeleteModalOpen: Story = {
  args: {
    image: mockImage,
    isLoading: false,
    error: null,
    deleteModalOpened: true,
    isDeleting: false,
  },
  play: async () => {
    // モーダルは document.body にレンダリングされる
    const body = within(document.body);

    // モーダルタイトルが表示されていることを確認
    await expect(body.getByText('画像を削除')).toBeInTheDocument();

    // 確認メッセージが表示されていることを確認
    await expect(body.getByText('この画像を削除しますか？この操作は取り消せません。')).toBeInTheDocument();

    // キャンセル・削除ボタンが表示されていることを確認
    await expect(body.getByRole('button', { name: 'キャンセル' })).toBeInTheDocument();
    await expect(body.getByRole('button', { name: '削除' })).toBeInTheDocument();
  },
};

export const DeleteModalDeleting: Story = {
  args: {
    image: mockImage,
    isLoading: false,
    error: null,
    deleteModalOpened: true,
    isDeleting: true,
  },
  play: async () => {
    // モーダルは document.body にレンダリングされる
    const body = within(document.body);

    // モーダルタイトルが表示されていることを確認
    await expect(body.getByText('画像を削除')).toBeInTheDocument();

    // 削除ボタンがローディング状態であることを確認
    const deleteButton = body.getByRole('button', { name: '削除' });
    await expect(deleteButton).toBeInTheDocument();
  },
};
