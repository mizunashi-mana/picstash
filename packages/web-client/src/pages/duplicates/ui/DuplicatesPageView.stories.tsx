import { expect, fn, within } from 'storybook/test';
import { DuplicatesPageView } from './DuplicatesPageView';
import type { DuplicateGroup, DuplicatesResponse } from '@/features/find-duplicates/api/duplicates';
import type { Meta, StoryObj } from '@storybook/react-vite';

const mockGroup: DuplicateGroup = {
  original: {
    id: 'orig-1',
    title: 'オリジナル画像',
    thumbnailPath: '/storage/thumbnails/orig-1.jpg',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  duplicates: [
    {
      id: 'dup-1',
      title: '重複画像 1',
      thumbnailPath: '/storage/thumbnails/dup-1.jpg',
      createdAt: '2026-01-02T00:00:00.000Z',
      distance: 0.05,
    },
    {
      id: 'dup-2',
      title: '重複画像 2',
      thumbnailPath: '/storage/thumbnails/dup-2.jpg',
      createdAt: '2026-01-03T00:00:00.000Z',
      distance: 0.08,
    },
  ],
};

const mockData: DuplicatesResponse = {
  groups: [mockGroup],
  totalGroups: 1,
  totalDuplicates: 2,
};

const mockEmptyData: DuplicatesResponse = {
  groups: [],
  totalGroups: 0,
  totalDuplicates: 0,
};

const meta = {
  title: 'Pages/Duplicates/DuplicatesPageView',
  component: DuplicatesPageView,
  args: {
    onThresholdChange: fn(),
    onSelectToggle: fn(),
    onSelectAllDuplicates: fn(),
    onDeleteSelected: fn(),
    onConfirmDelete: fn(),
    onCloseDeleteModal: fn(),
    onClearDeleteError: fn(),
  },
} satisfies Meta<typeof DuplicatesPageView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    threshold: 0.1,
    selectedIds: new Set<string>(),
    deleteModalOpen: false,
    deleteError: null,
    data: mockData,
    isLoading: false,
    error: null,
    isDeleting: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // タイトルが表示されていることを確認
    await expect(canvas.getByText('重複画像')).toBeInTheDocument();

    // グループ情報が表示されていることを確認
    await expect(canvas.getByText(/1グループ/)).toBeInTheDocument();
  },
};

export const Loading: Story = {
  args: {
    threshold: 0.1,
    selectedIds: new Set<string>(),
    deleteModalOpen: false,
    deleteError: null,
    data: undefined,
    isLoading: true,
    error: null,
    isDeleting: false,
  },
  play: async ({ canvasElement }) => {
    // Mantine Loader は accessible role を持たないため CSS クラスで検証
    await expect(canvasElement.querySelector('.mantine-Loader-root')).toBeTruthy();
  },
};

export const Error: Story = {
  args: {
    threshold: 0.1,
    selectedIds: new Set<string>(),
    deleteModalOpen: false,
    deleteError: null,
    data: undefined,
    isLoading: false,
    error: new globalThis.Error('サーバーエラー'),
    isDeleting: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // エラーメッセージが表示されていることを確認
    await expect(canvas.getByText('エラー')).toBeInTheDocument();
    await expect(canvas.getByText('重複画像の読み込みに失敗しました')).toBeInTheDocument();
  },
};

export const Empty: Story = {
  args: {
    threshold: 0.1,
    selectedIds: new Set<string>(),
    deleteModalOpen: false,
    deleteError: null,
    data: mockEmptyData,
    isLoading: false,
    error: null,
    isDeleting: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 重複なしメッセージが表示されていることを確認
    await expect(canvas.getByText('重複なし')).toBeInTheDocument();
    await expect(
      canvas.getByText(/現在のしきい値では重複画像が見つかりませんでした/),
    ).toBeInTheDocument();
  },
};

export const WithSelection: Story = {
  args: {
    threshold: 0.1,
    selectedIds: new Set<string>(['dup-1']),
    deleteModalOpen: false,
    deleteError: null,
    data: mockData,
    isLoading: false,
    error: null,
    isDeleting: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 削除ボタンが表示されていることを確認
    await expect(canvas.getByRole('button', { name: /選択した.*件を削除/ })).toBeInTheDocument();
  },
};

export const DeleteModalOpen: Story = {
  args: {
    threshold: 0.1,
    selectedIds: new Set<string>(['dup-1', 'dup-2']),
    deleteModalOpen: true,
    deleteError: null,
    data: mockData,
    isLoading: false,
    error: null,
    isDeleting: false,
  },
  play: async () => {
    // モーダルは document.body にレンダリングされる
    const body = within(document.body);

    // モーダルタイトルが表示されていることを確認
    await expect(body.getByText('削除の確認')).toBeInTheDocument();

    // 確認メッセージが表示されていることを確認
    await expect(
      body.getByText(/2件の画像を削除/),
    ).toBeInTheDocument();

    // キャンセル・削除ボタンが表示されていることを確認
    await expect(body.getByRole('button', { name: 'キャンセル' })).toBeInTheDocument();
    await expect(body.getByRole('button', { name: '削除' })).toBeInTheDocument();
  },
};

export const DeleteError: Story = {
  args: {
    threshold: 0.1,
    selectedIds: new Set<string>(),
    deleteModalOpen: false,
    deleteError: '一部の画像の削除に失敗しました',
    data: mockData,
    isLoading: false,
    error: null,
    isDeleting: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 削除エラーメッセージが表示されていることを確認
    await expect(canvas.getByText('一部削除失敗')).toBeInTheDocument();
    await expect(canvas.getByText('一部の画像の削除に失敗しました')).toBeInTheDocument();
  },
};
