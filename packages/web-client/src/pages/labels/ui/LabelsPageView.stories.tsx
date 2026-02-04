import { expect, fn, userEvent, within } from 'storybook/test';
import { LabelsPageView } from './LabelsPageView';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Pages/Labels/LabelsPageView',
  component: LabelsPageView,
  args: {
    onCreate: fn(),
    onUpdate: fn(async () => { await Promise.resolve(); }),
    onDelete: fn(async () => { await Promise.resolve(); }),
    existingColors: [],
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
    createError: null,
  },
} satisfies Meta<typeof LabelsPageView>;

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
    isLoading: false,
    error: null,
    existingColors: ['#e64980', '#228be6', '#40c057'],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // ページタイトルが表示されていることを確認
    await expect(canvas.getByText('ラベル管理')).toBeInTheDocument();

    // 説明文が表示されていることを確認
    await expect(canvas.getByText('画像を整理するためのラベルを作成・管理します')).toBeInTheDocument();

    // 作成フォームのタイトルが表示されていることを確認
    await expect(canvas.getByText('新しいラベルを作成')).toBeInTheDocument();

    // ラベル一覧のタイトルが表示されていることを確認
    await expect(canvas.getByText('ラベル一覧')).toBeInTheDocument();

    // 全てのラベルが表示されていることを確認
    await expect(canvas.getByText('キャラクター')).toBeInTheDocument();
    await expect(canvas.getByText('背景')).toBeInTheDocument();
    await expect(canvas.getByText('風景')).toBeInTheDocument();
  },
};

export const Empty: Story = {
  args: {
    labels: [],
    isLoading: false,
    error: null,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // ページタイトルが表示されていることを確認
    await expect(canvas.getByText('ラベル管理')).toBeInTheDocument();

    // ラベル一覧のタイトルが表示されていることを確認
    await expect(canvas.getByText('ラベル一覧')).toBeInTheDocument();

    // 空状態のメッセージが表示されていることを確認
    await expect(canvas.getByText('ラベルがまだありません。上のフォームで作成してください。')).toBeInTheDocument();
  },
};

export const Loading: Story = {
  args: {
    labels: undefined,
    isLoading: true,
    error: null,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // ページタイトルが表示されていることを確認
    await expect(canvas.getByText('ラベル管理')).toBeInTheDocument();

    // ラベル一覧のタイトルが表示されていることを確認
    await expect(canvas.getByText('ラベル一覧')).toBeInTheDocument();
  },
};

export const ErrorState: Story = {
  args: {
    labels: undefined,
    isLoading: false,
    error: new globalThis.Error('ラベルの読み込みに失敗しました'),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // エラーメッセージが表示されていることを確認
    await expect(canvas.getByText('ラベルの読み込みエラー')).toBeInTheDocument();
    await expect(canvas.getByText('ラベルの読み込みに失敗しました')).toBeInTheDocument();
  },
};

export const Creating: Story = {
  args: {
    labels: mockLabels,
    isLoading: false,
    error: null,
    isCreating: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // ページタイトルが表示されていることを確認
    await expect(canvas.getByText('ラベル管理')).toBeInTheDocument();

    // 作成フォームのタイトルが表示されていることを確認
    await expect(canvas.getByText('新しいラベルを作成')).toBeInTheDocument();
  },
};

export const CreateError: Story = {
  args: {
    labels: mockLabels,
    isLoading: false,
    error: null,
    createError: 'このラベル名は既に使用されています',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 作成エラーメッセージが表示されていることを確認
    await expect(canvas.getByText('ラベルの作成エラー')).toBeInTheDocument();
    await expect(canvas.getByText('このラベル名は既に使用されています')).toBeInTheDocument();
  },
};

export const CreateLabelInteraction: Story = {
  args: {
    labels: mockLabels,
    isLoading: false,
    error: null,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // 名前を入力
    const nameInput = canvas.getByRole('textbox', { name: /ラベル名/ });
    await userEvent.type(nameInput, '新しいラベル');

    // 名前が入力されていることを確認
    await expect(nameInput).toHaveValue('新しいラベル');

    // フォームを送信
    const submitButton = canvas.getByRole('button', { name: 'ラベルを作成' });
    await userEvent.click(submitButton);

    // onCreate が呼ばれていることを確認
    await expect(args.onCreate).toHaveBeenCalled();
  },
};
