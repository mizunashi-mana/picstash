import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { LabelList } from './LabelList';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Entities/Label/LabelList',
  component: LabelList,
  args: {
    onUpdate: fn(async () => { await Promise.resolve(); }),
    onDelete: fn(async () => { await Promise.resolve(); }),
  },
} satisfies Meta<typeof LabelList>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockLabels = [
  {
    id: '1',
    name: 'キャラクター',
    color: '#e64980',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    name: '背景',
    color: '#228be6',
    createdAt: '2026-01-02T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  },
  {
    id: '3',
    name: '風景',
    color: '#40c057',
    createdAt: '2026-01-03T00:00:00.000Z',
    updatedAt: '2026-01-03T00:00:00.000Z',
  },
];

export const Default: Story = {
  args: {
    labels: mockLabels,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 全てのラベルが表示されていることを確認
    await expect(canvas.getByText('キャラクター')).toBeInTheDocument();
    await expect(canvas.getByText('背景')).toBeInTheDocument();
    await expect(canvas.getByText('風景')).toBeInTheDocument();

    // 編集・削除ボタンが表示されていることを確認
    await expect(canvas.getAllByRole('button', { name: /を編集/ })).toHaveLength(3);
    await expect(canvas.getAllByRole('button', { name: /を削除/ })).toHaveLength(3);
  },
};

export const Empty: Story = {
  args: {
    labels: [],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 空状態のメッセージが表示されていることを確認
    await expect(canvas.getByText('ラベルがまだありません。上のフォームで作成してください。')).toBeInTheDocument();
  },
};

export const SingleLabel: Story = {
  args: {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- test data is defined
    labels: [mockLabels[0]!],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 1つのラベルが表示されていることを確認
    await expect(canvas.getByText('キャラクター')).toBeInTheDocument();
  },
};

export const OpenEditModal: Story = {
  args: {
    labels: mockLabels,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 編集ボタンをクリック
    const editButtons = canvas.getAllByRole('button', { name: /を編集/ });
    const firstEditButton = editButtons[0];
    if (firstEditButton !== undefined) {
      await userEvent.click(firstEditButton);
    }

    // モーダルが開いていることを確認（ドキュメント全体を検索）
    const modal = within(document.body);
    await waitFor(async () => {
      await expect(modal.getByText('ラベルを編集')).toBeInTheDocument();
    });
  },
};

export const OpenDeleteModal: Story = {
  args: {
    labels: mockLabels,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 削除ボタンをクリック
    const deleteButtons = canvas.getAllByRole('button', { name: /を削除/ });
    const firstDeleteButton = deleteButtons[0];
    if (firstDeleteButton !== undefined) {
      await userEvent.click(firstDeleteButton);
    }

    // 削除確認モーダルが開いていることを確認（ドキュメント全体を検索）
    const modal = within(document.body);
    await waitFor(async () => {
      await expect(modal.getByText('このラベルを削除しますか？')).toBeInTheDocument();
    });
  },
};

export const Updating: Story = {
  args: {
    labels: mockLabels,
    isUpdating: true,
  },
};

export const Deleting: Story = {
  args: {
    labels: mockLabels,
    isDeleting: true,
  },
};
