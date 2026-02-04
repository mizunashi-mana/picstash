import { expect, fn, within } from 'storybook/test';
import { CrawlPreviewGalleryView } from './CrawlPreviewGalleryView';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Features/ImportUrl/CrawlPreviewGalleryView',
  component: CrawlPreviewGalleryView,
  args: {
    onSelectionToggle: fn(),
    onPreviewClick: fn(),
    onPreviewClose: fn(),
  },
} satisfies Meta<typeof CrawlPreviewGalleryView>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockImages = [
  {
    index: 0,
    url: 'https://example.com/images/photo-001.jpg',
    filename: 'photo-001.jpg',
    alt: '風景写真',
  },
  {
    index: 1,
    url: 'https://example.com/images/photo-002.png',
    filename: 'photo-002.png',
    alt: 'ポートレート',
  },
  {
    index: 2,
    url: 'https://example.com/images/photo-003.jpg',
    filename: 'photo-003.jpg',
  },
  {
    index: 3,
    url: 'https://example.com/images/long-filename-image.jpg',
    filename: 'very-long-filename-that-should-be-truncated.jpg',
    alt: '長いファイル名の画像',
  },
];

export const Default: Story = {
  args: {
    sessionId: 'test-session-id',
    images: mockImages,
    selectedIndices: new Set([0, 2]),
    previewImage: null,
    previewOpened: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 全ての画像のファイル名が表示されていることを確認
    await expect(canvas.getByText('photo-001.jpg')).toBeInTheDocument();
    await expect(canvas.getByText('photo-002.png')).toBeInTheDocument();
    await expect(canvas.getByText('photo-003.jpg')).toBeInTheDocument();

    // チェックボックスが表示されていることを確認
    const checkboxes = canvas.getAllByRole('checkbox');
    await expect(checkboxes).toHaveLength(4);

    // 選択状態を確認
    await expect(checkboxes[0]).toBeChecked();
    await expect(checkboxes[1]).not.toBeChecked();
    await expect(checkboxes[2]).toBeChecked();
    await expect(checkboxes[3]).not.toBeChecked();
  },
};

export const Empty: Story = {
  args: {
    sessionId: 'test-session-id',
    images: [],
    selectedIndices: new Set<number>(),
    previewImage: null,
    previewOpened: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 空状態のメッセージが表示されていることを確認
    await expect(canvas.getByText('画像がありません')).toBeInTheDocument();
  },
};

export const PreviewOpen: Story = {
  args: {
    sessionId: 'test-session-id',
    images: mockImages,
    selectedIndices: new Set([0]),
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- mockImages is defined with elements
    previewImage: mockImages[0]!,
    previewOpened: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 画像のファイル名が表示されていることを確認
    await expect(canvas.getByText('photo-001.jpg')).toBeInTheDocument();

    // チェックボックスが表示されていることを確認
    const checkboxes = canvas.getAllByRole('checkbox');
    await expect(checkboxes).toHaveLength(4);
  },
};

export const NoneSelected: Story = {
  args: {
    sessionId: 'test-session-id',
    images: mockImages,
    selectedIndices: new Set<number>(),
    previewImage: null,
    previewOpened: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 全てのチェックボックスが未選択であることを確認
    const checkboxes = canvas.getAllByRole('checkbox');
    await expect(checkboxes).toHaveLength(4);
    for (const checkbox of checkboxes) {
      await expect(checkbox).not.toBeChecked();
    }
  },
};

export const AllSelected: Story = {
  args: {
    sessionId: 'test-session-id',
    images: mockImages,
    selectedIndices: new Set([0, 1, 2, 3]),
    previewImage: null,
    previewOpened: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 全てのチェックボックスがチェックされていることを確認
    const checkboxes = canvas.getAllByRole('checkbox');
    await expect(checkboxes).toHaveLength(4);
    for (const checkbox of checkboxes) {
      await expect(checkbox).toBeChecked();
    }
  },
};

export const SingleImage: Story = {
  args: {
    sessionId: 'test-session-id',
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- mockImages is defined with elements
    images: [mockImages[0]!],
    selectedIndices: new Set<number>(),
    previewImage: null,
    previewOpened: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 1つの画像が表示されていることを確認
    await expect(canvas.getByText('photo-001.jpg')).toBeInTheDocument();
    await expect(canvas.getAllByRole('checkbox')).toHaveLength(1);
  },
};
