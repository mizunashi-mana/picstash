import { expect, fn, userEvent, within } from 'storybook/test';
import { LabelForm } from './LabelForm';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Features/Labels/LabelForm',
  component: LabelForm,
  args: {
    onSubmit: fn(),
    onCancel: fn(),
  },
} satisfies Meta<typeof LabelForm>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockLabel = {
  id: '1',
  name: 'キャラクター',
  color: '#e64980',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

export const CreateMode: Story = {
  args: {
    mode: 'create',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // フォームが表示されていることを確認
    await expect(canvas.getByRole('textbox', { name: /ラベル名/ })).toBeInTheDocument();
    await expect(canvas.getByLabelText('カラー')).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'ラベルを作成' })).toBeInTheDocument();
  },
};

export const EditMode: Story = {
  args: {
    mode: 'edit',
    label: mockLabel,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 既存の値が入力されていることを確認
    await expect(canvas.getByLabelText('ラベル名')).toHaveValue('キャラクター');
    await expect(canvas.getByRole('button', { name: 'ラベルを更新' })).toBeInTheDocument();
  },
};

export const WithExistingColors: Story = {
  args: {
    mode: 'create',
    existingColors: ['#e03131', '#f76707', '#fab005'],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // フォームが表示されていることを確認
    await expect(canvas.getByRole('textbox', { name: /ラベル名/ })).toBeInTheDocument();
  },
};

export const Submitting: Story = {
  args: {
    mode: 'create',
    isSubmitting: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // フォームが無効化されていることを確認
    await expect(canvas.getByRole('textbox', { name: /ラベル名/ })).toBeDisabled();
  },
};

export const CreateLabelInteraction: Story = {
  args: {
    mode: 'create',
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

    // onSubmit が呼ばれていることを確認
    await expect(args.onSubmit).toHaveBeenCalled();
  },
};

export const CancelInteraction: Story = {
  args: {
    mode: 'edit',
    label: mockLabel,
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

export const ValidationDisabledWhenEmpty: Story = {
  args: {
    mode: 'create',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 名前が空の場合、送信ボタンが無効化されていることを確認
    const submitButton = canvas.getByRole('button', { name: 'ラベルを作成' });
    await expect(submitButton).toBeDisabled();
  },
};
