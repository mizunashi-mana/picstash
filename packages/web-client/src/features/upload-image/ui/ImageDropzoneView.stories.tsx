import { expect, fn, within } from 'storybook/test';
import { ImageDropzoneView } from './ImageDropzoneView';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Features/UploadImage/ImageDropzoneView',
  component: ImageDropzoneView,
  args: {
    onDrop: fn(),
  },
} satisfies Meta<typeof ImageDropzoneView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isPending: false,
    isError: false,
    isSuccess: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // デフォルトのテキストが表示されていることを確認
    await expect(canvas.getByText('ここに画像をドラッグ＆ドロップ')).toBeInTheDocument();
    await expect(canvas.getByText('またはクリックしてファイルを選択')).toBeInTheDocument();
  },
};

export const Loading: Story = {
  args: {
    isPending: true,
    isError: false,
    isSuccess: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // テキストが表示されていることを確認
    await expect(canvas.getByText('ここに画像をドラッグ＆ドロップ')).toBeInTheDocument();
  },
};

export const Success: Story = {
  args: {
    isPending: false,
    isError: false,
    isSuccess: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 成功メッセージが表示されていることを確認
    await expect(canvas.getByText('アップロード完了')).toBeInTheDocument();
  },
};

export const Error: Story = {
  args: {
    isPending: false,
    isError: true,
    isSuccess: false,
    errorMessage: 'ファイルサイズが大きすぎます',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // エラーメッセージが表示されていることを確認
    await expect(canvas.getByText('ファイルサイズが大きすぎます')).toBeInTheDocument();
  },
};

export const ErrorWithDefaultMessage: Story = {
  args: {
    isPending: false,
    isError: true,
    isSuccess: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // デフォルトエラーメッセージが表示されていることを確認
    await expect(canvas.getByText('エラーが発生しました')).toBeInTheDocument();
  },
};
