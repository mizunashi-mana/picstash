import { expect, fn, within } from 'storybook/test';
import { ImageUploadTabView } from './ImageUploadTabView';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Features/Import/ImageUploadTabView',
  component: ImageUploadTabView,
  args: {
    onDrop: fn(),
    onClearResult: fn(),
  },
} satisfies Meta<typeof ImageUploadTabView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    uploadResult: null,
    isPending: false,
    isError: false,
    errorMessage: undefined,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // ドロップゾーンの説明が表示されていることを確認
    await expect(
      canvas.getByText('画像ファイルをドラッグ＆ドロップまたはクリックして選択'),
    ).toBeInTheDocument();
  },
};

export const Uploading: Story = {
  args: {
    uploadResult: null,
    isPending: true,
    isError: false,
    errorMessage: undefined,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // ドロップゾーンの説明が表示されていることを確認
    await expect(
      canvas.getByText('画像ファイルをドラッグ＆ドロップまたはクリックして選択'),
    ).toBeInTheDocument();
  },
};

export const UploadSuccess: Story = {
  args: {
    uploadResult: {
      successCount: 3,
      failedCount: 0,
    },
    isPending: false,
    isError: false,
    errorMessage: undefined,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // アップロード完了のアラートが表示されていることを確認
    await expect(canvas.getByText('アップロード完了')).toBeInTheDocument();
    await expect(canvas.getByText(/3/)).toBeInTheDocument();
    await expect(canvas.getByText(/件アップロード成功/)).toBeInTheDocument();

    // ギャラリーリンクが表示されていることを確認
    await expect(canvas.getByText('ギャラリーを見る')).toBeInTheDocument();
  },
};

export const UploadPartialFailure: Story = {
  args: {
    uploadResult: {
      successCount: 2,
      failedCount: 1,
    },
    isPending: false,
    isError: false,
    errorMessage: undefined,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // アップロード完了のアラートが表示されていることを確認
    await expect(canvas.getByText('アップロード完了')).toBeInTheDocument();
    await expect(canvas.getByText(/2/)).toBeInTheDocument();
    await expect(canvas.getByText(/件アップロード成功/)).toBeInTheDocument();
    await expect(canvas.getByText(/1/)).toBeInTheDocument();
    await expect(canvas.getByText(/件失敗/)).toBeInTheDocument();
  },
};

export const ErrorState: Story = {
  args: {
    uploadResult: null,
    isPending: false,
    isError: true,
    errorMessage: 'ファイルサイズが大きすぎます',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // ドロップゾーンの説明が表示されていることを確認
    await expect(
      canvas.getByText('画像ファイルをドラッグ＆ドロップまたはクリックして選択'),
    ).toBeInTheDocument();
  },
};
