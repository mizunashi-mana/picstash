import { LabelBadge } from './LabelBadge';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof LabelBadge> = {
  title: 'Features/Labels/LabelBadge',
  component: LabelBadge,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof LabelBadge>;

export const Default: Story = {
  args: {
    label: {
      id: '1',
      name: 'Sample Label',
      color: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    size: 'md',
  },
};

export const WithColor: Story = {
  args: {
    label: {
      id: '2',
      name: 'Colored Label',
      color: '#3b82f6',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    size: 'md',
  },
};

export const Small: Story = {
  args: {
    label: {
      id: '3',
      name: 'Small Label',
      color: '#10b981',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    label: {
      id: '4',
      name: 'Large Label',
      color: '#f59e0b',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    size: 'lg',
  },
};
