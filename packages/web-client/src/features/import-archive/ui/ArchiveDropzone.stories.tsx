import { expect, fn, within } from 'storybook/test';
import { ArchiveDropzone } from './ArchiveDropzone';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Features/ImportArchive/ArchiveDropzone',
  component: ArchiveDropzone,
  args: {
    onDrop: fn(),
  },
} satisfies Meta<typeof ArchiveDropzone>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isPending: false,
    isError: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // ドロップゾーンの説明が表示されていることを確認
    await expect(canvas.getByText('ZIP/RAR ファイルをドラッグ＆ドロップ')).toBeInTheDocument();
    await expect(canvas.getByText('またはクリックしてファイルを選択')).toBeInTheDocument();
  },
};

export const Loading: Story = {
  args: {
    isPending: true,
    isError: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // ドロップゾーンの説明が表示されていることを確認
    await expect(canvas.getByText('ZIP/RAR ファイルをドラッグ＆ドロップ')).toBeInTheDocument();
  },
};

export const ErrorState: Story = {
  args: {
    isPending: false,
    isError: true,
    errorMessage: 'ファイルの読み込みに失敗しました',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // エラーメッセージが表示されていることを確認
    await expect(canvas.getByText('ファイルの読み込みに失敗しました')).toBeInTheDocument();
  },
};

export const ErrorWithDefaultMessage: Story = {
  args: {
    isPending: false,
    isError: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // デフォルトのエラーメッセージが表示されていることを確認
    await expect(canvas.getByText('エラーが発生しました')).toBeInTheDocument();
  },
};
