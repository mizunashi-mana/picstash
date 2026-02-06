import { expect, fn, userEvent, within } from 'storybook/test';
import { ArchivePreviewGallery } from './ArchivePreviewGallery';
import type { Meta, StoryObj } from '@storybook/react-vite';

const mockGetThumbnailUrl = (sessionId: string, fileIndex: number) =>
  `/api/archives/${sessionId}/files/${fileIndex}/thumbnail`;
const mockGetImageUrl = (sessionId: string, fileIndex: number) =>
  `/api/archives/${sessionId}/files/${fileIndex}/file`;

const meta = {
  title: 'Features/ImportArchive/ArchivePreviewGallery',
  component: ArchivePreviewGallery,
  args: {
    onSelectionChange: fn(),
    getThumbnailUrl: mockGetThumbnailUrl,
    getImageUrl: mockGetImageUrl,
  },
} satisfies Meta<typeof ArchivePreviewGallery>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockImages = [
  {
    index: 0,
    filename: 'image-001.jpg',
    path: 'folder/image-001.jpg',
    size: 102400,
  },
  {
    index: 1,
    filename: 'image-002.png',
    path: 'folder/image-002.png',
    size: 204800,
  },
  {
    index: 2,
    filename: 'image-003.gif',
    path: 'image-003.gif',
    size: 51200,
  },
  {
    index: 3,
    filename: 'very-long-filename-that-should-be-truncated.jpg',
    path: 'very-long-filename-that-should-be-truncated.jpg',
    size: 153600,
  },
];

export const Default: Story = {
  args: {
    sessionId: 'test-session-id',
    images: mockImages,
    selectedIndices: new Set<number>(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 全ての画像のファイル名が表示されていることを確認
    await expect(canvas.getByText('image-001.jpg')).toBeInTheDocument();
    await expect(canvas.getByText('image-002.png')).toBeInTheDocument();
    await expect(canvas.getByText('image-003.gif')).toBeInTheDocument();

    // チェックボックスが表示されていることを確認
    const checkboxes = canvas.getAllByRole('checkbox');
    await expect(checkboxes).toHaveLength(4);
  },
};

export const WithSelection: Story = {
  args: {
    sessionId: 'test-session-id',
    images: mockImages,
    selectedIndices: new Set([0, 2]),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 選択されているチェックボックスを確認
    const checkboxes = canvas.getAllByRole('checkbox');
    await expect(checkboxes[0]).toBeChecked();
    await expect(checkboxes[1]).not.toBeChecked();
    await expect(checkboxes[2]).toBeChecked();
    await expect(checkboxes[3]).not.toBeChecked();
  },
};

export const AllSelected: Story = {
  args: {
    sessionId: 'test-session-id',
    images: mockImages,
    selectedIndices: new Set([0, 1, 2, 3]),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 全てのチェックボックスがチェックされていることを確認
    const checkboxes = canvas.getAllByRole('checkbox');
    for (const checkbox of checkboxes) {
      await expect(checkbox).toBeChecked();
    }
  },
};

export const Empty: Story = {
  args: {
    sessionId: 'test-session-id',
    images: [],
    selectedIndices: new Set<number>(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 空状態のメッセージが表示されていることを確認
    await expect(canvas.getByText('画像がありません')).toBeInTheDocument();
  },
};

export const ToggleSelection: Story = {
  args: {
    sessionId: 'test-session-id',
    images: mockImages,
    selectedIndices: new Set<number>(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // 最初のチェックボックスをクリック
    const checkboxes = canvas.getAllByRole('checkbox');
    const firstCheckbox = checkboxes[0];
    if (firstCheckbox !== undefined) {
      await userEvent.click(firstCheckbox);
    }

    // onSelectionChange が呼ばれていることを確認
    await expect(args.onSelectionChange).toHaveBeenCalledWith(new Set([0]));
  },
};

export const SingleImage: Story = {
  args: {
    sessionId: 'test-session-id',

    images: [mockImages[0]!],
    selectedIndices: new Set<number>(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 1つの画像が表示されていることを確認
    await expect(canvas.getByText('image-001.jpg')).toBeInTheDocument();
    await expect(canvas.getAllByRole('checkbox')).toHaveLength(1);
  },
};
