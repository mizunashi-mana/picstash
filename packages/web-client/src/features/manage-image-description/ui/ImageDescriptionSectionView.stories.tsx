import { expect, fn, userEvent, within } from 'storybook/test';
import { ImageDescriptionSectionView } from './ImageDescriptionSectionView';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Features/ManageImageDescription/ImageDescriptionSectionView',
  component: ImageDescriptionSectionView,
  args: {
    onStartEdit: fn(),
    onCancel: fn(),
    onSave: fn(),
    onEditValueChange: fn(),
    onGenerate: fn(),
    isGenerating: false,
  },
} satisfies Meta<typeof ImageDescriptionSectionView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithDescription: Story = {
  args: {
    description: 'これはサンプルの説明文です。\n複数行の説明も可能です。',
    isEditing: false,
    editValue: '',
    isPending: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // タイトルが表示されていることを確認
    await expect(canvas.getByText('説明')).toBeInTheDocument();

    // 説明文が表示されていることを確認
    await expect(canvas.getByText(/これはサンプルの説明文です/)).toBeInTheDocument();

    // 編集ボタンが表示されていることを確認
    await expect(canvas.getByRole('button', { name: '説明を編集' })).toBeInTheDocument();
  },
};

export const WithoutDescription: Story = {
  args: {
    description: null,
    isEditing: false,
    editValue: '',
    isPending: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 空状態のメッセージが表示されていることを確認
    await expect(canvas.getByText('説明がありません')).toBeInTheDocument();

    // 追加ボタンが表示されていることを確認
    await expect(canvas.getByRole('button', { name: '説明を追加' })).toBeInTheDocument();
  },
};

export const Editing: Story = {
  args: {
    description: '既存の説明文',
    isEditing: true,
    editValue: '既存の説明文',
    isPending: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // テキストエリアが表示されていることを確認
    await expect(canvas.getByPlaceholderText('画像の説明を入力...')).toBeInTheDocument();

    // 保存・キャンセルボタンが表示されていることを確認
    await expect(canvas.getByRole('button', { name: '保存' })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'キャンセル' })).toBeInTheDocument();
  },
};

export const EditingEmpty: Story = {
  args: {
    description: null,
    isEditing: true,
    editValue: '',
    isPending: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // テキストエリアが空であることを確認
    const textarea = canvas.getByPlaceholderText('画像の説明を入力...');
    await expect(textarea).toHaveValue('');
  },
};

export const Saving: Story = {
  args: {
    description: '既存の説明文',
    isEditing: true,
    editValue: '編集中の説明文',
    isPending: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // キャンセルボタンが無効化されていることを確認
    await expect(canvas.getByRole('button', { name: 'キャンセル' })).toBeDisabled();
  },
};

export const StartEditInteraction: Story = {
  args: {
    description: '既存の説明文',
    isEditing: false,
    editValue: '',
    isPending: false,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // 編集ボタンをクリック
    const editButton = canvas.getByRole('button', { name: '説明を編集' });
    await userEvent.click(editButton);

    // onStartEdit が呼ばれていることを確認
    await expect(args.onStartEdit).toHaveBeenCalled();
  },
};

export const CancelEditInteraction: Story = {
  args: {
    description: '既存の説明文',
    isEditing: true,
    editValue: '編集中の説明文',
    isPending: false,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // キャンセルボタンをクリック
    const cancelButton = canvas.getByRole('button', { name: 'キャンセル' });
    await userEvent.click(cancelButton);

    // onCancel が呼ばれていることを確認
    await expect(args.onCancel).toHaveBeenCalled();
  },
};

export const SaveEditInteraction: Story = {
  args: {
    description: '既存の説明文',
    isEditing: true,
    editValue: '編集中の説明文',
    isPending: false,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // 保存ボタンをクリック
    const saveButton = canvas.getByRole('button', { name: '保存' });
    await userEvent.click(saveButton);

    // onSave が呼ばれていることを確認
    await expect(args.onSave).toHaveBeenCalled();
  },
};

export const TypeDescriptionInteraction: Story = {
  args: {
    description: null,
    isEditing: true,
    editValue: '',
    isPending: false,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // テキストエリアに入力
    const textarea = canvas.getByPlaceholderText('画像の説明を入力...');
    await userEvent.type(textarea, '新しい説明文');

    // onEditValueChange が呼ばれていることを確認
    await expect(args.onEditValueChange).toHaveBeenCalled();
  },
};

export const EditingWithAIButton: Story = {
  args: {
    description: null,
    isEditing: true,
    editValue: '',
    isPending: false,
    isGenerating: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // AI生成ボタンが表示されていることを確認
    await expect(canvas.getByRole('button', { name: 'AI で生成' })).toBeInTheDocument();
  },
};

export const Generating: Story = {
  args: {
    description: null,
    isEditing: true,
    editValue: '',
    isPending: false,
    isGenerating: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // テキストエリアが無効化されていることを確認
    await expect(canvas.getByPlaceholderText('画像の説明を入力...')).toBeDisabled();

    // キャンセル・保存ボタンが無効化されていることを確認
    await expect(canvas.getByRole('button', { name: 'キャンセル' })).toBeDisabled();
    await expect(canvas.getByRole('button', { name: '保存' })).toBeDisabled();
  },
};

export const GenerateInteraction: Story = {
  args: {
    description: null,
    isEditing: true,
    editValue: '',
    isPending: false,
    isGenerating: false,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // AI生成ボタンをクリック
    const generateButton = canvas.getByRole('button', { name: 'AI で生成' });
    await userEvent.click(generateButton);

    // onGenerate が呼ばれていることを確認
    await expect(args.onGenerate).toHaveBeenCalled();
  },
};

export const GenerateError: Story = {
  args: {
    description: null,
    isEditing: true,
    editValue: '',
    isPending: false,
    isGenerating: false,
    generateError: '説明の生成に失敗しました',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // エラーメッセージが表示されていることを確認
    await expect(canvas.getByText('説明の生成に失敗しました')).toBeInTheDocument();
  },
};
