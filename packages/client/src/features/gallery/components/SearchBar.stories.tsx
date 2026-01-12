import { expect, fn, userEvent, within } from 'storybook/test';
import { SearchBar } from './SearchBar';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Features/Gallery/SearchBar',
  component: SearchBar,
  args: {
    onChange: fn(),
  },
} satisfies Meta<typeof SearchBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: '',
    isLoading: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 検索ボックスが表示されていることを確認
    const input = canvas.getByPlaceholderText('検索...');
    await expect(input).toBeInTheDocument();

    // クリアボタンが表示されていないことを確認
    await expect(canvas.queryByRole('button', { name: '検索をクリア' })).not.toBeInTheDocument();
  },
};

export const WithValue: Story = {
  args: {
    value: 'サンプル検索',
    isLoading: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 検索ボックスに値が入っていることを確認
    const input = canvas.getByPlaceholderText('検索...');
    await expect(input).toHaveValue('サンプル検索');

    // クリアボタンが表示されていることを確認
    await expect(canvas.getByRole('button', { name: '検索をクリア' })).toBeInTheDocument();
  },
};

export const Loading: Story = {
  args: {
    value: '',
    isLoading: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 検索ボックスが無効化されていることを確認
    const input = canvas.getByPlaceholderText('検索...');
    await expect(input).toBeDisabled();
  },
};

export const TypeAndClear: Story = {
  args: {
    value: '',
    isLoading: false,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // 検索ボックスに入力
    const input = canvas.getByPlaceholderText('検索...');
    await userEvent.type(input, 'テスト入力');

    // 入力値が反映されていることを確認
    await expect(input).toHaveValue('テスト入力');

    // クリアボタンが表示されていることを確認
    const clearButton = canvas.getByRole('button', { name: '検索をクリア' });
    await expect(clearButton).toBeInTheDocument();

    // クリアボタンをクリック
    await userEvent.click(clearButton);

    // 入力値がクリアされていることを確認
    await expect(input).toHaveValue('');

    // onChange が呼ばれていることを確認（クリア時）
    await expect(args.onChange).toHaveBeenCalledWith('');
  },
};
