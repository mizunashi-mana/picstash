import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CollectionsPageView, type CollectionsPageViewProps } from '@/pages/collections/ui/CollectionsPageView';
import { createMantineWrapper } from '@~tests/unit/test-utils';

function createDefaultProps(): CollectionsPageViewProps {
  return {
    collections: [],
    isLoading: false,
    error: null,
    createModalOpen: false,
    newName: '',
    newDescription: '',
    isCreating: false,
    isDeleting: false,
    createError: null,
    onOpenCreateModal: vi.fn(),
    onCloseCreateModal: vi.fn(),
    onNewNameChange: vi.fn(),
    onNewDescriptionChange: vi.fn(),
    onCreate: vi.fn(),
    onDelete: vi.fn(),
  };
}

describe('CollectionsPageView', () => {
  it('should render without crashing', () => {
    render(<CollectionsPageView {...createDefaultProps()} />, {
      wrapper: createMantineWrapper(),
    });
    expect(screen.getByText('コレクション')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(<CollectionsPageView {...createDefaultProps()} isLoading />, {
      wrapper: createMantineWrapper(),
    });
    // Loader renders but doesn't have accessible role, just verify no error occurs
    expect(document.querySelector('.mantine-Loader-root')).toBeInTheDocument();
  });

  it('should show error state', () => {
    render(
      <CollectionsPageView {...createDefaultProps()} error={new Error('Test error')} />,
      { wrapper: createMantineWrapper() },
    );
    expect(screen.getByText(/コレクションの読み込みに失敗しました/)).toBeInTheDocument();
  });

  it('should show empty state', () => {
    render(<CollectionsPageView {...createDefaultProps()} />, {
      wrapper: createMantineWrapper(),
    });
    expect(screen.getByText('コレクションがまだありません')).toBeInTheDocument();
  });

  it('should show create button', () => {
    render(<CollectionsPageView {...createDefaultProps()} />, {
      wrapper: createMantineWrapper(),
    });
    expect(screen.getByRole('button', { name: /新規コレクション/ })).toBeInTheDocument();
  });
});
