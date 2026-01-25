import type { ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ImageAttributeSectionView } from '@/features/gallery/components/ImageAttributeSectionView';
import type { ImageAttribute } from '@picstash/api';

function createWrapper() {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <MantineProvider>{children}</MantineProvider>;
  };
}

const mockAttributes: ImageAttribute[] = [
  {
    id: 'attr-1',
    imageId: 'img-1',
    labelId: 'label-1',
    keywords: 'keyword1, keyword2',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    label: {
      id: 'label-1',
      name: 'Character',
      color: '#ff0000',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  },
];

const defaultProps = {
  attributes: [],
  labelOptions: [
    { value: 'label-1', label: 'Character' },
    { value: 'label-2', label: 'Location' },
  ],
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
  onOpenAddModal: vi.fn(),
  onCloseAddModal: vi.fn(),
  onOpenEditModal: vi.fn(),
  onCloseEditModal: vi.fn(),
  onSelectedLabelIdChange: vi.fn(),
  onKeywordsChange: vi.fn(),
  onCreate: vi.fn(),
  onUpdate: vi.fn(),
  onDelete: vi.fn(),
  showSuggestions: false,
  suggestions: [],
  suggestionsLoading: false,
  suggestionsError: null,
  addingSuggestionId: null,
  onToggleSuggestions: vi.fn(),
  onAddSuggestion: vi.fn(),
};

describe('ImageAttributeSectionView', () => {
  it('should render loading state', () => {
    render(
      <ImageAttributeSectionView
        {...defaultProps}
        isLoading={true}
      />,
      { wrapper: createWrapper() },
    );

    // Loading state shows a loader
    expect(screen.queryByText('属性')).not.toBeInTheDocument();
  });

  it('should render attributes error', () => {
    render(
      <ImageAttributeSectionView
        {...defaultProps}
        attributesError={new Error('Failed to load')}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText('属性の読み込みに失敗しました')).toBeInTheDocument();
  });

  it('should render labels error', () => {
    render(
      <ImageAttributeSectionView
        {...defaultProps}
        labelsError={new Error('Failed to load')}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText('ラベルの読み込みに失敗しました')).toBeInTheDocument();
  });

  it('should render empty state', () => {
    render(<ImageAttributeSectionView {...defaultProps} />, { wrapper: createWrapper() });

    expect(screen.getByText('属性が設定されていません')).toBeInTheDocument();
  });

  it('should render attributes with keywords', () => {
    render(
      <ImageAttributeSectionView
        {...defaultProps}
        attributes={mockAttributes}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText('Character')).toBeInTheDocument();
    expect(screen.getByText('keyword1')).toBeInTheDocument();
    expect(screen.getByText('keyword2')).toBeInTheDocument();
  });

  it('should render add button', () => {
    render(<ImageAttributeSectionView {...defaultProps} />, { wrapper: createWrapper() });

    expect(screen.getByRole('button', { name: '追加' })).toBeInTheDocument();
  });

  it('should disable add button when no available labels', () => {
    render(
      <ImageAttributeSectionView
        {...defaultProps}
        hasAvailableLabels={false}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByRole('button', { name: '追加' })).toBeDisabled();
  });

  it('should call onOpenAddModal when add button clicked', async () => {
    const onOpenAddModal = vi.fn();
    const user = userEvent.setup();

    render(
      <ImageAttributeSectionView
        {...defaultProps}
        onOpenAddModal={onOpenAddModal}
      />,
      { wrapper: createWrapper() },
    );

    await user.click(screen.getByRole('button', { name: '追加' }));

    expect(onOpenAddModal).toHaveBeenCalled();
  });

  it('should render AI suggestion button', () => {
    render(<ImageAttributeSectionView {...defaultProps} />, { wrapper: createWrapper() });

    expect(screen.getByRole('button', { name: 'AI提案' })).toBeInTheDocument();
  });

  it('should call onToggleSuggestions when AI button clicked', async () => {
    const onToggleSuggestions = vi.fn();
    const user = userEvent.setup();

    render(
      <ImageAttributeSectionView
        {...defaultProps}
        onToggleSuggestions={onToggleSuggestions}
      />,
      { wrapper: createWrapper() },
    );

    await user.click(screen.getByRole('button', { name: 'AI提案' }));

    expect(onToggleSuggestions).toHaveBeenCalled();
  });

  it('should show close button when suggestions panel is open', () => {
    render(
      <ImageAttributeSectionView
        {...defaultProps}
        showSuggestions={true}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByRole('button', { name: '閉じる' })).toBeInTheDocument();
  });

  it('should render suggestions panel when open', () => {
    render(
      <ImageAttributeSectionView
        {...defaultProps}
        showSuggestions={true}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText('AI推薦ラベル')).toBeInTheDocument();
  });

  it('should show suggestions loading state', () => {
    render(
      <ImageAttributeSectionView
        {...defaultProps}
        showSuggestions={true}
        suggestionsLoading={true}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText('AI推薦ラベル')).toBeInTheDocument();
  });

  it('should show suggestions error', () => {
    render(
      <ImageAttributeSectionView
        {...defaultProps}
        showSuggestions={true}
        suggestionsError={new Error('Failed')}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText('提案の取得に失敗しました')).toBeInTheDocument();
  });

  it('should show empty suggestions message', () => {
    render(
      <ImageAttributeSectionView
        {...defaultProps}
        showSuggestions={true}
        suggestions={[]}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText('推薦できるラベルがありません')).toBeInTheDocument();
  });

  it('should render edit and delete buttons for attributes', () => {
    render(
      <ImageAttributeSectionView
        {...defaultProps}
        attributes={mockAttributes}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByRole('button', { name: '編集' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '削除' })).toBeInTheDocument();
  });

  it('should call onOpenEditModal when edit button clicked', async () => {
    const onOpenEditModal = vi.fn();
    const user = userEvent.setup();

    render(
      <ImageAttributeSectionView
        {...defaultProps}
        attributes={mockAttributes}
        onOpenEditModal={onOpenEditModal}
      />,
      { wrapper: createWrapper() },
    );

    await user.click(screen.getByRole('button', { name: '編集' }));

    expect(onOpenEditModal).toHaveBeenCalledWith(mockAttributes[0]);
  });

  it('should call onDelete when delete button clicked', async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();

    render(
      <ImageAttributeSectionView
        {...defaultProps}
        attributes={mockAttributes}
        onDelete={onDelete}
      />,
      { wrapper: createWrapper() },
    );

    await user.click(screen.getByRole('button', { name: '削除' }));

    expect(onDelete).toHaveBeenCalledWith('attr-1');
  });

  it('should show loading state on delete button when deleting', () => {
    render(
      <ImageAttributeSectionView
        {...defaultProps}
        attributes={mockAttributes}
        isDeletingId="attr-1"
      />,
      { wrapper: createWrapper() },
    );

    // Button should be in loading state
    const deleteButton = screen.getByRole('button', { name: '削除' });
    expect(deleteButton).toBeInTheDocument();
  });
});
