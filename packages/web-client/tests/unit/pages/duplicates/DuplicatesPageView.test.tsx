import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DuplicatesPageView, type DuplicatesPageViewProps } from '@/pages/duplicates/ui/DuplicatesPageView';
import { createMantineWrapper } from '@~tests/unit/test-utils';

function createDefaultProps(): DuplicatesPageViewProps {
  return {
    threshold: 0.9,
    selectedIds: new Set(),
    deleteModalOpen: false,
    deleteError: null,
    data: undefined,
    isLoading: false,
    error: null,
    isDeleting: false,
    getThumbnailUrl: vi.fn((id: string) => `/thumbnails/${id}`),
    onThresholdChange: vi.fn(),
    onSelectToggle: vi.fn(),
    onSelectAllDuplicates: vi.fn(),
    onDeleteSelected: vi.fn(),
    onConfirmDelete: vi.fn(),
    onCloseDeleteModal: vi.fn(),
    onClearDeleteError: vi.fn(),
  };
}

describe('DuplicatesPageView', () => {
  it('should render without crashing with data', () => {
    const props = createDefaultProps();
    props.data = { groups: [], totalGroups: 0, totalDuplicates: 0 };
    render(<DuplicatesPageView {...props} />, {
      wrapper: createMantineWrapper(),
    });
    expect(screen.getByRole('heading', { name: '重複画像' })).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(<DuplicatesPageView {...createDefaultProps()} isLoading />, {
      wrapper: createMantineWrapper(),
    });
    // Loader renders, just verify no error
    expect(document.querySelector('.mantine-Loader-root')).toBeInTheDocument();
  });

  it('should show error state', () => {
    render(
      <DuplicatesPageView {...createDefaultProps()} error={new Error('Test error')} />,
      { wrapper: createMantineWrapper() },
    );
    expect(screen.getByText(/重複画像の読み込みに失敗しました/)).toBeInTheDocument();
  });

  it('should show no duplicates message when empty', () => {
    const props = createDefaultProps();
    props.data = { groups: [], totalGroups: 0, totalDuplicates: 0 };
    render(<DuplicatesPageView {...props} />, {
      wrapper: createMantineWrapper(),
    });
    expect(screen.getByText(/重複画像が見つかりませんでした/)).toBeInTheDocument();
  });

  it('should show threshold slider', () => {
    const props = createDefaultProps();
    props.data = { groups: [], totalGroups: 0, totalDuplicates: 0 };
    render(<DuplicatesPageView {...props} />, {
      wrapper: createMantineWrapper(),
    });
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });
});
