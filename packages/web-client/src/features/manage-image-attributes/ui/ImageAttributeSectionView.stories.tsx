import { expect, fn, userEvent, within } from 'storybook/test';
import { ImageAttributeSectionView } from './ImageAttributeSectionView';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Features/ManageImageAttributes/ImageAttributeSectionView',
  component: ImageAttributeSectionView,
  args: {
    onOpenAddModal: fn(),
    onCloseAddModal: fn(),
    onOpenEditModal: fn(),
    onCloseEditModal: fn(),
    onSelectedLabelIdChange: fn(),
    onKeywordsChange: fn(),
    onCreate: fn(),
    onUpdate: fn(),
    onDelete: fn(),
    // Suggestion defaults
    showSuggestions: false,
    suggestions: [],
    suggestionsLoading: false,
    suggestionsError: null,
    addingSuggestionId: null,
    onToggleSuggestions: fn(),
    onAddSuggestion: fn(),
  },
} satisfies Meta<typeof ImageAttributeSectionView>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockAttributes = [
  {
    id: 'attr-1',
    imageId: 'img-1',
    labelId: 'label-1',
    keywords: 'キーワード1,キーワード2',
    label: {
      id: 'label-1',
      name: 'キャラクター',
      color: '#e64980',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'attr-2',
    imageId: 'img-1',
    labelId: 'label-2',
    keywords: null,
    label: {
      id: 'label-2',
      name: '背景',
      color: '#228be6',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    createdAt: '2026-01-02T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  },
];

const mockLabelOptions = [
  { value: 'label-3', label: '風景' },
  { value: 'label-4', label: 'アイテム' },
];

export const Default: Story = {
  args: {
    attributes: mockAttributes,
    labelOptions: mockLabelOptions,
    isLoading: false,
    attributesError: null,
    labelsError: null,
    addModalOpen: false,
    editingAttribute: null,
    selectedLabelId: null,
    keywords: [],
    isCreating: false,
    isUpdating: false,
    isDeletingId: null,
    hasAvailableLabels: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // タイトルが表示されていることを確認
    await expect(canvas.getByText('属性')).toBeInTheDocument();

    // 属性が表示されていることを確認
    await expect(canvas.getByText('キャラクター')).toBeInTheDocument();
    await expect(canvas.getByText('背景')).toBeInTheDocument();

    // キーワードが表示されていることを確認
    await expect(canvas.getByText('キーワード1')).toBeInTheDocument();
    await expect(canvas.getByText('キーワード2')).toBeInTheDocument();

    // 追加ボタンが表示されていることを確認
    await expect(canvas.getByRole('button', { name: '追加' })).toBeInTheDocument();
  },
};

export const Empty: Story = {
  args: {
    attributes: [],
    labelOptions: mockLabelOptions,
    isLoading: false,
    attributesError: null,
    labelsError: null,
    addModalOpen: false,
    editingAttribute: null,
    selectedLabelId: null,
    keywords: [],
    isCreating: false,
    isUpdating: false,
    isDeletingId: null,
    hasAvailableLabels: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 空状態のメッセージが表示されていることを確認
    await expect(canvas.getByText('属性が設定されていません')).toBeInTheDocument();
  },
};

export const Loading: Story = {
  args: {
    attributes: undefined,
    labelOptions: [],
    isLoading: true,
    attributesError: null,
    labelsError: null,
    addModalOpen: false,
    editingAttribute: null,
    selectedLabelId: null,
    keywords: [],
    isCreating: false,
    isUpdating: false,
    isDeletingId: null,
    hasAvailableLabels: false,
  },
};

export const AttributesError: Story = {
  args: {
    attributes: undefined,
    labelOptions: [],
    isLoading: false,
    attributesError: new Error('Failed to load'),
    labelsError: null,
    addModalOpen: false,
    editingAttribute: null,
    selectedLabelId: null,
    keywords: [],
    isCreating: false,
    isUpdating: false,
    isDeletingId: null,
    hasAvailableLabels: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // エラーメッセージが表示されていることを確認
    await expect(canvas.getByText('属性の読み込みに失敗しました')).toBeInTheDocument();
  },
};

export const LabelsError: Story = {
  args: {
    attributes: [],
    labelOptions: [],
    isLoading: false,
    attributesError: null,
    labelsError: new Error('Failed to load'),
    addModalOpen: false,
    editingAttribute: null,
    selectedLabelId: null,
    keywords: [],
    isCreating: false,
    isUpdating: false,
    isDeletingId: null,
    hasAvailableLabels: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // エラーメッセージが表示されていることを確認
    await expect(canvas.getByText('ラベルの読み込みに失敗しました')).toBeInTheDocument();
  },
};

export const NoAvailableLabels: Story = {
  args: {
    attributes: mockAttributes,
    labelOptions: [],
    isLoading: false,
    attributesError: null,
    labelsError: null,
    addModalOpen: false,
    editingAttribute: null,
    selectedLabelId: null,
    keywords: [],
    isCreating: false,
    isUpdating: false,
    isDeletingId: null,
    hasAvailableLabels: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 追加ボタンが無効化されていることを確認
    await expect(canvas.getByRole('button', { name: '追加' })).toBeDisabled();
  },
};

export const AddModalOpen: Story = {
  args: {
    attributes: mockAttributes,
    labelOptions: mockLabelOptions,
    isLoading: false,
    attributesError: null,
    labelsError: null,
    addModalOpen: true,
    editingAttribute: null,
    selectedLabelId: null,
    keywords: [],
    isCreating: false,
    isUpdating: false,
    isDeletingId: null,
    hasAvailableLabels: true,
  },
  play: async () => {
    // モーダルが開いていることを確認（ドキュメント全体を検索）
    const modal = within(document.body);
    await expect(modal.getByText('属性を追加')).toBeInTheDocument();
    await expect(modal.getByText('ラベル')).toBeInTheDocument();
  },
};

export const EditModalOpen: Story = {
  args: {
    attributes: mockAttributes,
    labelOptions: mockLabelOptions,
    isLoading: false,
    attributesError: null,
    labelsError: null,
    addModalOpen: false,

    editingAttribute: mockAttributes[0]!,
    selectedLabelId: null,
    keywords: ['キーワード1', 'キーワード2'],
    isCreating: false,
    isUpdating: false,
    isDeletingId: null,
    hasAvailableLabels: true,
  },
  play: async () => {
    // モーダルが開いていることを確認（ドキュメント全体を検索）
    const modal = within(document.body);
    await expect(modal.getByText('属性を編集')).toBeInTheDocument();
  },
};

export const Deleting: Story = {
  args: {
    attributes: mockAttributes,
    labelOptions: mockLabelOptions,
    isLoading: false,
    attributesError: null,
    labelsError: null,
    addModalOpen: false,
    editingAttribute: null,
    selectedLabelId: null,
    keywords: [],
    isCreating: false,
    isUpdating: false,
    isDeletingId: 'attr-1',
    hasAvailableLabels: true,
  },
};

export const OpenAddModalInteraction: Story = {
  args: {
    attributes: mockAttributes,
    labelOptions: mockLabelOptions,
    isLoading: false,
    attributesError: null,
    labelsError: null,
    addModalOpen: false,
    editingAttribute: null,
    selectedLabelId: null,
    keywords: [],
    isCreating: false,
    isUpdating: false,
    isDeletingId: null,
    hasAvailableLabels: true,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // 追加ボタンをクリック
    const addButton = canvas.getByRole('button', { name: '追加' });
    await userEvent.click(addButton);

    // onOpenAddModal が呼ばれていることを確認
    await expect(args.onOpenAddModal).toHaveBeenCalled();
  },
};

export const DeleteAttributeInteraction: Story = {
  args: {
    attributes: mockAttributes,
    labelOptions: mockLabelOptions,
    isLoading: false,
    attributesError: null,
    labelsError: null,
    addModalOpen: false,
    editingAttribute: null,
    selectedLabelId: null,
    keywords: [],
    isCreating: false,
    isUpdating: false,
    isDeletingId: null,
    hasAvailableLabels: true,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // 削除ボタンをクリック
    const deleteButtons = canvas.getAllByRole('button', { name: '削除' });
    const firstDeleteButton = deleteButtons[0];
    if (firstDeleteButton !== undefined) {
      await userEvent.click(firstDeleteButton);
    }

    // onDelete が呼ばれていることを確認
    await expect(args.onDelete).toHaveBeenCalledWith('attr-1');
  },
};

// Suggestion Stories
const mockSuggestions = [
  { labelId: 'label-5', labelName: '自然', score: 0.85, suggestedKeywords: [{ keyword: '森林', count: 3 }, { keyword: '山', count: 2 }] },
  { labelId: 'label-6', labelName: '動物', score: 0.72, suggestedKeywords: [{ keyword: '猫', count: 5 }] },
  { labelId: 'label-7', labelName: '水彩', score: 0.58, suggestedKeywords: [] },
];

export const WithSuggestions: Story = {
  args: {
    attributes: mockAttributes,
    labelOptions: mockLabelOptions,
    isLoading: false,
    attributesError: null,
    labelsError: null,
    addModalOpen: false,
    editingAttribute: null,
    selectedLabelId: null,
    keywords: [],
    isCreating: false,
    isUpdating: false,
    isDeletingId: null,
    hasAvailableLabels: true,
    showSuggestions: true,
    suggestions: mockSuggestions,
    suggestionsLoading: false,
    suggestionsError: null,
    addingSuggestionId: null,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // AI提案セクションが表示されていることを確認
    await expect(canvas.getByText('AI推薦ラベル')).toBeInTheDocument();
    await expect(canvas.getByText('自然')).toBeInTheDocument();
    await expect(canvas.getByText('動物')).toBeInTheDocument();
    await expect(canvas.getByText('水彩')).toBeInTheDocument();
  },
};

export const SuggestionsLoading: Story = {
  args: {
    attributes: mockAttributes,
    labelOptions: mockLabelOptions,
    isLoading: false,
    attributesError: null,
    labelsError: null,
    addModalOpen: false,
    editingAttribute: null,
    selectedLabelId: null,
    keywords: [],
    isCreating: false,
    isUpdating: false,
    isDeletingId: null,
    hasAvailableLabels: true,
    showSuggestions: true,
    suggestions: [],
    suggestionsLoading: true,
    suggestionsError: null,
    addingSuggestionId: null,
  },
};
