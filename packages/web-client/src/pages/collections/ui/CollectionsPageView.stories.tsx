import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { CollectionsPageView } from './CollectionsPageView';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Pages/Collections/CollectionsPageView',
  component: CollectionsPageView,
  args: {
    createModalOpen: false,
    newName: '',
    newDescription: '',
    isCreating: false,
    isDeleting: false,
    createError: null,
    onOpenCreateModal: fn(),
    onCloseCreateModal: fn(),
    onNewNameChange: fn(),
    onNewDescriptionChange: fn(),
    onCreate: fn(),
    onDelete: fn(),
  },
} satisfies Meta<typeof CollectionsPageView>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockCollections = [
  {
    id: '1',
    name: 'お気に入り',
    description: 'お気に入りの画像コレクション',
    coverImageId: null,
    imageCount: 12,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    name: '風景写真',
    description: '美しい風景の写真集',
    coverImageId: null,
    imageCount: 8,
    createdAt: '2026-01-02T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  },
  {
    id: '3',
    name: 'イラスト',
    description: null,
    coverImageId: null,
    imageCount: 0,
    createdAt: '2026-01-03T00:00:00.000Z',
    updatedAt: '2026-01-03T00:00:00.000Z',
  },
];

export const Default: Story = {
  args: {
    collections: mockCollections,
    isLoading: false,
    error: null,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // ページタイトルが表示されていることを確認
    await expect(canvas.getByText('コレクション')).toBeInTheDocument();

    // 説明文が表示されていることを確認
    await expect(canvas.getByText('画像をコレクションに整理します')).toBeInTheDocument();

    // 新規コレクションボタンが表示されていることを確認
    await expect(canvas.getByRole('button', { name: /新規コレクション/ })).toBeInTheDocument();

    // 全てのコレクションが表示されていることを確認
    await expect(canvas.getByText('お気に入り')).toBeInTheDocument();
    await expect(canvas.getByText('風景写真')).toBeInTheDocument();
    await expect(canvas.getByText('イラスト')).toBeInTheDocument();

    // 画像件数が表示されていることを確認
    await expect(canvas.getByText(/12/)).toBeInTheDocument();
    await expect(canvas.getByText(/8/)).toBeInTheDocument();
  },
};

export const Empty: Story = {
  args: {
    collections: [],
    isLoading: false,
    error: null,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // ページタイトルが表示されていることを確認
    await expect(canvas.getByText('コレクション')).toBeInTheDocument();

    // 空状態のメッセージが表示されていることを確認
    await expect(canvas.getByText('コレクションがまだありません')).toBeInTheDocument();

    // 最初のコレクション作成ボタンが表示されていることを確認
    await expect(canvas.getByRole('button', { name: /最初のコレクションを作成/ })).toBeInTheDocument();
  },
};

export const Loading: Story = {
  args: {
    collections: undefined,
    isLoading: true,
    error: null,
  },
};

export const ErrorState: Story = {
  args: {
    collections: undefined,
    isLoading: false,
    error: new globalThis.Error('コレクションの読み込みに失敗しました'),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // エラーメッセージが表示されていることを確認
    await expect(canvas.getByText('エラー')).toBeInTheDocument();
    await expect(canvas.getByText('コレクションの読み込みに失敗しました')).toBeInTheDocument();
  },
};

export const CreateModalOpen: Story = {
  args: {
    collections: mockCollections,
    isLoading: false,
    error: null,
    createModalOpen: true,
    newName: '',
    newDescription: '',
  },
  play: async () => {
    // モーダルはドキュメント全体を検索
    const modal = within(document.body);

    // モーダルのタイトルが表示されていることを確認
    await waitFor(async () => {
      await expect(modal.getByText('新しいコレクションを作成')).toBeInTheDocument();
    });

    // 名前入力フィールドが表示されていることを確認
    await expect(modal.getByPlaceholderText('コレクション名を入力')).toBeInTheDocument();

    // 説明入力フィールドが表示されていることを確認
    await expect(modal.getByPlaceholderText('説明を入力（オプション）')).toBeInTheDocument();

    // キャンセル・作成ボタンが表示されていることを確認
    await expect(modal.getByRole('button', { name: 'キャンセル' })).toBeInTheDocument();
    await expect(modal.getByRole('button', { name: '作成' })).toBeInTheDocument();
  },
};

export const CreateModalWithInput: Story = {
  args: {
    collections: mockCollections,
    isLoading: false,
    error: null,
    createModalOpen: true,
    newName: '新しいコレクション',
    newDescription: 'コレクションの説明文',
  },
  play: async () => {
    // モーダルはドキュメント全体を検索
    const modal = within(document.body);

    // 入力値が反映されていることを確認
    await waitFor(async () => {
      await expect(modal.getByDisplayValue('新しいコレクション')).toBeInTheDocument();
    });
    await expect(modal.getByDisplayValue('コレクションの説明文')).toBeInTheDocument();

    // 作成ボタンが有効化されていることを確認
    await expect(modal.getByRole('button', { name: '作成' })).toBeEnabled();
  },
};

export const CreateModalWithError: Story = {
  args: {
    collections: mockCollections,
    isLoading: false,
    error: null,
    createModalOpen: true,
    newName: '重複名',
    newDescription: '',
    createError: 'このコレクション名は既に使用されています',
  },
  play: async () => {
    // モーダルはドキュメント全体を検索
    const modal = within(document.body);

    // エラーメッセージが表示されていることを確認
    await waitFor(async () => {
      await expect(modal.getByText('このコレクション名は既に使用されています')).toBeInTheDocument();
    });
  },
};

export const OpenCreateModalInteraction: Story = {
  args: {
    collections: mockCollections,
    isLoading: false,
    error: null,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // 新規コレクションボタンをクリック
    const createButton = canvas.getByRole('button', { name: /新規コレクション/ });
    await userEvent.click(createButton);

    // onOpenCreateModal が呼ばれていることを確認
    await expect(args.onOpenCreateModal).toHaveBeenCalled();
  },
};

export const EmptyOpenCreateModalInteraction: Story = {
  args: {
    collections: [],
    isLoading: false,
    error: null,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // 最初のコレクション作成ボタンをクリック
    const createButton = canvas.getByRole('button', { name: /最初のコレクションを作成/ });
    await userEvent.click(createButton);

    // onOpenCreateModal が呼ばれていることを確認
    await expect(args.onOpenCreateModal).toHaveBeenCalled();
  },
};
