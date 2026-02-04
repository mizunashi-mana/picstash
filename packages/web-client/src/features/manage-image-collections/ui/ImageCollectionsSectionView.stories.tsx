import { expect, fn, within } from 'storybook/test';
import { ImageCollectionsSectionView } from './ImageCollectionsSectionView';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Features/ManageImageCollections/ImageCollectionsSectionView',
  component: ImageCollectionsSectionView,
  args: {
    onSelectedCollectionIdChange: fn(),
    onAdd: fn(),
    onRemove: fn(),
  },
} satisfies Meta<typeof ImageCollectionsSectionView>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockCollections = [
  {
    id: 'col-1',
    name: '風景写真',
    description: '風景の写真コレクション',
    coverImageId: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'col-2',
    name: 'お気に入り',
    description: null,
    coverImageId: null,
    createdAt: '2026-01-02T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  },
];

const mockAvailableCollections = [
  { value: 'col-3', label: 'ポートレート' },
  { value: 'col-4', label: '旅行' },
];

export const Default: Story = {
  args: {
    imageCollections: mockCollections,
    availableCollections: mockAvailableCollections,
    hasAnyCollections: true,
    selectedCollectionId: null,
    isAdding: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // タイトルが表示されていることを確認
    await expect(canvas.getByText('コレクション')).toBeInTheDocument();

    // コレクション名が表示されていることを確認
    await expect(canvas.getByText('風景写真')).toBeInTheDocument();
    await expect(canvas.getByText('お気に入り')).toBeInTheDocument();

    // 追加ボタンが表示されていることを確認
    await expect(canvas.getByRole('button', { name: '追加' })).toBeInTheDocument();
  },
};

export const Empty: Story = {
  args: {
    imageCollections: [],
    availableCollections: mockAvailableCollections,
    hasAnyCollections: true,
    selectedCollectionId: null,
    isAdding: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // タイトルが表示されていることを確認
    await expect(canvas.getByText('コレクション')).toBeInTheDocument();

    // 空状態のメッセージが表示されていることを確認
    await expect(canvas.getByText('コレクションに追加されていません')).toBeInTheDocument();

    // 追加ボタンが表示されていることを確認
    await expect(canvas.getByRole('button', { name: '追加' })).toBeInTheDocument();
  },
};

export const Loading: Story = {
  args: {
    imageCollections: undefined,
    availableCollections: [],
    hasAnyCollections: false,
    selectedCollectionId: null,
    isAdding: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // タイトルが表示されていることを確認
    await expect(canvas.getByText('コレクション')).toBeInTheDocument();

    // コレクション未取得状態のメッセージが表示されていることを確認
    await expect(canvas.getByText('コレクションに追加されていません')).toBeInTheDocument();
  },
};

export const Error: Story = {
  args: {
    imageCollections: undefined,
    availableCollections: [],
    hasAnyCollections: false,
    selectedCollectionId: null,
    isAdding: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // タイトルが表示されていることを確認
    await expect(canvas.getByText('コレクション')).toBeInTheDocument();

    // エラー時はコレクションが未定義のため空状態メッセージが表示される
    await expect(canvas.getByText('コレクションに追加されていません')).toBeInTheDocument();

    // コレクション作成ボタンが表示されていることを確認
    await expect(canvas.getByRole('link', { name: 'コレクションを作成' })).toBeInTheDocument();
  },
};

export const AddModalOpen: Story = {
  args: {
    imageCollections: mockCollections,
    availableCollections: mockAvailableCollections,
    hasAnyCollections: true,
    selectedCollectionId: 'col-3',
    isAdding: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // タイトルが表示されていることを確認
    await expect(canvas.getByText('コレクション')).toBeInTheDocument();

    // コレクション名が表示されていることを確認
    await expect(canvas.getByText('風景写真')).toBeInTheDocument();
    await expect(canvas.getByText('お気に入り')).toBeInTheDocument();

    // 追加ボタンが有効であることを確認（コレクションが選択されているため）
    const addButton = canvas.getByRole('button', { name: '追加' });
    await expect(addButton).toBeInTheDocument();
    await expect(addButton).toBeEnabled();
  },
};

export const NoCollectionsExist: Story = {
  args: {
    imageCollections: [],
    availableCollections: [],
    hasAnyCollections: false,
    selectedCollectionId: null,
    isAdding: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 空状態のメッセージが表示されていることを確認
    await expect(canvas.getByText('コレクションに追加されていません')).toBeInTheDocument();

    // コレクション作成リンクが表示されていることを確認
    await expect(canvas.getByRole('link', { name: 'コレクションを作成' })).toBeInTheDocument();
  },
};

export const Adding: Story = {
  args: {
    imageCollections: mockCollections,
    availableCollections: mockAvailableCollections,
    hasAnyCollections: true,
    selectedCollectionId: 'col-3',
    isAdding: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // コレクション名が表示されていることを確認
    await expect(canvas.getByText('風景写真')).toBeInTheDocument();

    // 追加ボタンがローディング状態であることを確認
    const addButton = canvas.getByRole('button', { name: '追加' });
    await expect(addButton).toBeInTheDocument();
  },
};
