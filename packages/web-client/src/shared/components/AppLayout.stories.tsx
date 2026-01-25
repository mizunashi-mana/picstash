import { expect, userEvent, within } from 'storybook/test';
import { AppLayout } from './AppLayout';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Shared/AppLayout',
  component: AppLayout,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof AppLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <div style={{ padding: '20px' }}>
        <h1>Page Content</h1>
        <p>This is the main content area.</p>
      </div>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // サイドバーのタイトルが表示されていることを確認
    await expect(canvas.getByText('Picstash')).toBeInTheDocument();

    // ナビゲーションリンクが表示されていることを確認
    await expect(canvas.getByRole('link', { name: 'ホーム' })).toBeInTheDocument();
    await expect(canvas.getByRole('link', { name: 'ラベル' })).toBeInTheDocument();
    await expect(canvas.getByRole('link', { name: 'インポート' })).toBeInTheDocument();

    // コンテンツが表示されていることを確認
    await expect(canvas.getByText('Page Content')).toBeInTheDocument();
  },
};

export const CollapseSidebar: Story = {
  args: {
    children: (
      <div style={{ padding: '20px' }}>
        <h1>Page Content</h1>
        <p>This is the main content area.</p>
      </div>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // サイドバーを折りたたむ
    const collapseButton = canvas.getByRole('button', { name: 'サイドバーを折りたたむ' });
    await userEvent.click(collapseButton);

    // タイトルが非表示になっていることを確認
    await expect(canvas.queryByText('Picstash')).not.toBeInTheDocument();

    // 展開ボタンが表示されていることを確認
    await expect(canvas.getByRole('button', { name: 'サイドバーを展開' })).toBeInTheDocument();
  },
};

export const ExpandSidebarAfterCollapse: Story = {
  args: {
    children: (
      <div style={{ padding: '20px' }}>
        <h1>Page Content</h1>
        <p>This is the main content area.</p>
      </div>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // サイドバーを折りたたむ
    const collapseButton = canvas.getByRole('button', { name: 'サイドバーを折りたたむ' });
    await userEvent.click(collapseButton);

    // サイドバーを展開する
    const expandButton = canvas.getByRole('button', { name: 'サイドバーを展開' });
    await userEvent.click(expandButton);

    // タイトルが表示されていることを確認
    await expect(canvas.getByText('Picstash')).toBeInTheDocument();
  },
};

export const WithLongContent: Story = {
  args: {
    children: (
      <div style={{ padding: '20px' }}>
        <h1>Long Content Page</h1>
        {Array.from({ length: 50 }).map((_, i) => (
          <p key={i}>
            This is paragraph
            {i + 1}
            . Lorem ipsum dolor sit amet.
          </p>
        ))}
      </div>
    ),
  },
};
