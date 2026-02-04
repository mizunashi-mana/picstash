import { expect, fn, within } from 'storybook/test';
import { CollectionDetailPageView } from './CollectionDetailPageView';
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

const mockEmptyCollection: CollectionWithImages = {
  id: 'col-2',
  name: '空のコレクション',
  description: null,
  coverImageId: null,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  images: [],
};

const meta = {
  title: 'Pages/Collections/CollectionDetailPageView',
  component: CollectionDetailPageView,
  args: {
    id: 'col-1',
    collection: mockCollection,
    isLoading: false,
    error: null,
    editModalOpen: false,
    deleteModalOpen: false,
    editName: '',
    editDescription: '',
    isUpdating: false,
    isDeleting: false,
    isRemovingImage: false,
    updateError: null,
    onOpenEdit: fn(),
    onCloseEditModal: fn(),
    onEditNameChange: fn(),
    onEditDescriptionChange: fn(),
    onUpdate: fn(),
    onOpenDeleteModal: fn(),
    onCloseDeleteModal: fn(),
    onDelete: fn(),
    onRemoveImage: fn(),
  },
} satisfies Meta<typeof CollectionDetailPageView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // コレクション名が表示されていることを確認
    await expect(canvas.getByText('お気に入り風景')).toBeInTheDocument();

    // 説明が表示されていることを確認
    await expect(canvas.getByText('旅行で撮影した風景写真のコレクション')).toBeInTheDocument();

    // 画像件数が表示されていることを確認
    await expect(canvas.getByText(/3/)).toBeInTheDocument();
    await expect(canvas.getByText(/件の画像/)).toBeInTheDocument();

    // 編集・削除ボタンが表示されていることを確認
    await expect(canvas.getByRole('button', { name: '編集' })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: '削除' })).toBeInTheDocument();

    // 表示ボタンが表示されていることを確認
    await expect(canvas.getByRole('link', { name: '表示' })).toBeInTheDocument();
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
    collection: undefined,
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
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // エラータイトルが表示されていることを確認
    await expect(canvas.getByText('エラー')).toBeInTheDocument();

    // エラーメッセージが表示されていることを確認
    await expect(canvas.getByText('コレクションの取得に失敗しました')).toBeInTheDocument();
  },
};

export const Empty: Story = {
  args: {
    id: 'col-2',
    collection: mockEmptyCollection,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // コレクション名が表示されていることを確認
    await expect(canvas.getByText('空のコレクション')).toBeInTheDocument();

    // 空状態のメッセージが表示されていることを確認
    await expect(canvas.getByText('このコレクションには画像がありません')).toBeInTheDocument();
    await expect(canvas.getByText('画像の詳細ページから追加してください')).toBeInTheDocument();

    // 画像件数が 0 件であることを確認
    await expect(canvas.getByText(/0/)).toBeInTheDocument();
    await expect(canvas.getByText(/件の画像/)).toBeInTheDocument();

    // 表示ボタンが非表示であることを確認（画像がないため）
    await expect(canvas.queryByRole('link', { name: '表示' })).not.toBeInTheDocument();
  },
};

export const EditModalOpen: Story = {
  args: {
    editModalOpen: true,
    editName: 'お気に入り風景',
    editDescription: '旅行で撮影した風景写真のコレクション',
  },
  play: async ({ _canvasElement }) => {
    // Modal は portal でレンダリングされるため document.body から検索
    const body = within(document.body);

    // モーダルタイトルが表示されていることを確認
    await expect(body.getByText('コレクションを編集')).toBeInTheDocument();

    // フォームフィールドが表示されていることを確認
    await expect(body.getByLabelText(/名前/)).toBeInTheDocument();
    await expect(body.getByLabelText(/説明/)).toBeInTheDocument();

    // 保存・キャンセルボタンが表示されていることを確認
    await expect(body.getByRole('button', { name: '保存' })).toBeInTheDocument();
    await expect(body.getByRole('button', { name: 'キャンセル' })).toBeInTheDocument();
  },
};
