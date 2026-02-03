import type { ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ImageDescriptionSectionView } from '@/features/manage-image-description';

function createWrapper() {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <MantineProvider>{children}</MantineProvider>;
  };
}

describe('ImageDescriptionSectionView', () => {
  const defaultProps = {
    description: null,
    isEditing: false,
    editValue: '',
    isPending: false,
    isGenerating: false,
    onStartEdit: vi.fn(),
    onCancel: vi.fn(),
    onSave: vi.fn(),
    onEditValueChange: vi.fn(),
    onGenerate: vi.fn(),
  };

  it('should render empty state when no description', () => {
    render(<ImageDescriptionSectionView {...defaultProps} />, { wrapper: createWrapper() });

    expect(screen.getByText('説明がありません')).toBeInTheDocument();
  });

  it('should render description when provided', () => {
    render(
      <ImageDescriptionSectionView
        {...defaultProps}
        description="This is a test description"
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText('This is a test description')).toBeInTheDocument();
  });

  it('should show add button when no description', () => {
    render(<ImageDescriptionSectionView {...defaultProps} />, { wrapper: createWrapper() });

    expect(screen.getByRole('button', { name: '説明を追加' })).toBeInTheDocument();
  });

  it('should show edit button when description exists', () => {
    render(
      <ImageDescriptionSectionView
        {...defaultProps}
        description="Existing description"
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByRole('button', { name: '説明を編集' })).toBeInTheDocument();
  });

  it('should call onStartEdit when edit button clicked', async () => {
    const onStartEdit = vi.fn();
    const user = userEvent.setup();

    render(
      <ImageDescriptionSectionView
        {...defaultProps}
        description="Existing description"
        onStartEdit={onStartEdit}
      />,
      { wrapper: createWrapper() },
    );

    await user.click(screen.getByRole('button', { name: '説明を編集' }));

    expect(onStartEdit).toHaveBeenCalled();
  });

  it('should render editing mode with textarea', () => {
    render(
      <ImageDescriptionSectionView
        {...defaultProps}
        isEditing={true}
        editValue="editing..."
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByPlaceholderText('画像の説明を入力...')).toBeInTheDocument();
    expect(screen.getByDisplayValue('editing...')).toBeInTheDocument();
  });

  it('should render cancel and save buttons in editing mode', () => {
    render(
      <ImageDescriptionSectionView
        {...defaultProps}
        isEditing={true}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByRole('button', { name: 'キャンセル' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '保存' })).toBeInTheDocument();
  });

  it('should render AI generate button in editing mode', () => {
    render(
      <ImageDescriptionSectionView
        {...defaultProps}
        isEditing={true}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByRole('button', { name: 'AI で生成' })).toBeInTheDocument();
  });

  it('should call onCancel when cancel button clicked', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();

    render(
      <ImageDescriptionSectionView
        {...defaultProps}
        isEditing={true}
        onCancel={onCancel}
      />,
      { wrapper: createWrapper() },
    );

    await user.click(screen.getByRole('button', { name: 'キャンセル' }));

    expect(onCancel).toHaveBeenCalled();
  });

  it('should call onSave when save button clicked', async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();

    render(
      <ImageDescriptionSectionView
        {...defaultProps}
        isEditing={true}
        onSave={onSave}
      />,
      { wrapper: createWrapper() },
    );

    await user.click(screen.getByRole('button', { name: '保存' }));

    expect(onSave).toHaveBeenCalled();
  });

  it('should call onGenerate when AI generate button clicked', async () => {
    const onGenerate = vi.fn();
    const user = userEvent.setup();

    render(
      <ImageDescriptionSectionView
        {...defaultProps}
        isEditing={true}
        onGenerate={onGenerate}
      />,
      { wrapper: createWrapper() },
    );

    await user.click(screen.getByRole('button', { name: 'AI で生成' }));

    expect(onGenerate).toHaveBeenCalled();
  });

  it('should show generating state with progress', () => {
    render(
      <ImageDescriptionSectionView
        {...defaultProps}
        isEditing={true}
        isGenerating={true}
        generateProgress={50}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByRole('button', { name: '生成中... (50%)' })).toBeInTheDocument();
  });

  it('should show generate error message', () => {
    render(
      <ImageDescriptionSectionView
        {...defaultProps}
        isEditing={true}
        generateError="Generation failed"
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText('Generation failed')).toBeInTheDocument();
  });

  it('should disable cancel and save buttons when isPending', () => {
    render(
      <ImageDescriptionSectionView
        {...defaultProps}
        isEditing={true}
        isPending={true}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByRole('button', { name: 'キャンセル' })).toBeDisabled();
  });

  it('should disable textarea when generating', () => {
    render(
      <ImageDescriptionSectionView
        {...defaultProps}
        isEditing={true}
        isGenerating={true}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByPlaceholderText('画像の説明を入力...')).toBeDisabled();
  });
});
