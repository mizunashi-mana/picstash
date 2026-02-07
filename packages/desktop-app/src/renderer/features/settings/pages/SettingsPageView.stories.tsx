import { expect, fn, userEvent, within } from 'storybook/test';
import { SettingsPageView } from './SettingsPageView';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Pages/Settings/SettingsPageView',
  component: SettingsPageView,
  args: {
    onChangeFolder: fn(),
  },
} satisfies Meta<typeof SettingsPageView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    storagePath: '/Users/example/Documents/picstash-library.pstlib',
    isLoading: false,
    isChanging: false,
    error: null,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // ページタイトルが表示されていることを確認
    await expect(canvas.getByText('設定')).toBeInTheDocument();

    // ストレージフォルダセクションが表示されていることを確認
    await expect(canvas.getByText('ストレージフォルダ')).toBeInTheDocument();

    // 説明文が表示されていることを確認
    await expect(canvas.getByText('画像ファイルとデータベースが保存されるフォルダです。')).toBeInTheDocument();

    // ストレージパスが表示されていることを確認
    await expect(canvas.getByText('/Users/example/Documents/picstash-library.pstlib')).toBeInTheDocument();

    // 警告メッセージが表示されていることを確認
    await expect(canvas.getByText(/フォルダを変更すると/)).toBeInTheDocument();

    // フォルダ変更ボタンが表示されていることを確認
    await expect(canvas.getByRole('button', { name: 'フォルダを変更' })).toBeInTheDocument();
  },
};

export const Loading: Story = {
  args: {
    storagePath: null,
    isLoading: true,
    isChanging: false,
    error: null,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 読み込み中メッセージが表示されていることを確認
    await expect(canvas.getByText('読み込み中...')).toBeInTheDocument();
  },
};

export const NoStoragePath: Story = {
  args: {
    storagePath: null,
    isLoading: false,
    isChanging: false,
    error: null,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 未設定メッセージが表示されていることを確認
    await expect(canvas.getByText('未設定')).toBeInTheDocument();
  },
};

export const Changing: Story = {
  args: {
    storagePath: '/Users/example/Documents/picstash-library.pstlib',
    isLoading: false,
    isChanging: true,
    error: null,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // ボタンがローディング状態であることを確認
    const button = canvas.getByRole('button', { name: 'フォルダを変更' });
    await expect(button).toBeInTheDocument();
  },
};

export const ErrorState: Story = {
  args: {
    storagePath: '/Users/example/Documents/picstash-library.pstlib',
    isLoading: false,
    isChanging: false,
    error: 'フォルダの変更に失敗しました',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // エラーメッセージが表示されていることを確認
    await expect(canvas.getByText('フォルダの変更に失敗しました')).toBeInTheDocument();
  },
};

export const ChangeFolderInteraction: Story = {
  args: {
    storagePath: '/Users/example/Documents/picstash-library.pstlib',
    isLoading: false,
    isChanging: false,
    error: null,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // フォルダ変更ボタンをクリック
    const button = canvas.getByRole('button', { name: 'フォルダを変更' });
    await userEvent.click(button);

    // onChangeFolder が呼ばれていることを確認
    await expect(args.onChangeFolder).toHaveBeenCalled();
  },
};
