import { expect, within } from 'storybook/test';
import { LabelBadge } from './LabelBadge';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Features/Labels/LabelBadge',
  component: LabelBadge,
} satisfies Meta<typeof LabelBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockLabel = {
  id: '1',
  name: 'キャラクター',
  color: '#e64980',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

export const Default: Story = {
  args: {
    label: mockLabel,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // ラベル名が表示されていることを確認
    await expect(canvas.getByText('キャラクター')).toBeInTheDocument();
  },
};

export const WithoutColor: Story = {
  args: {
    label: {
      ...mockLabel,
      color: null,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // ラベル名が表示されていることを確認
    await expect(canvas.getByText('キャラクター')).toBeInTheDocument();
  },
};

export const SmallSize: Story = {
  args: {
    label: mockLabel,
    size: 'xs',
  },
};

export const LargeSize: Story = {
  args: {
    label: mockLabel,
    size: 'xl',
  },
};

export const DifferentColors: Story = {
  args: {
    label: mockLabel,
  },
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <LabelBadge
        label={{ ...mockLabel, name: '赤', color: '#e64980' }}
      />
      <LabelBadge
        label={{ ...mockLabel, name: '青', color: '#228be6' }}
      />
      <LabelBadge
        label={{ ...mockLabel, name: '緑', color: '#40c057' }}
      />
      <LabelBadge
        label={{ ...mockLabel, name: 'オレンジ', color: '#fd7e14' }}
      />
      <LabelBadge
        label={{ ...mockLabel, name: '紫', color: '#7950f2' }}
      />
      <LabelBadge
        label={{ ...mockLabel, name: 'グレー', color: null }}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 全てのラベルが表示されていることを確認
    await expect(canvas.getByText('赤')).toBeInTheDocument();
    await expect(canvas.getByText('青')).toBeInTheDocument();
    await expect(canvas.getByText('緑')).toBeInTheDocument();
    await expect(canvas.getByText('オレンジ')).toBeInTheDocument();
    await expect(canvas.getByText('紫')).toBeInTheDocument();
    await expect(canvas.getByText('グレー')).toBeInTheDocument();
  },
};
