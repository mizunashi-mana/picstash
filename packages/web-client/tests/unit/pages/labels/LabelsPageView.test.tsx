import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LabelsPageView, type LabelsPageViewProps } from '@/pages/labels/ui/LabelsPageView';
import { createMantineWrapper } from '@~tests/unit/test-utils';

function createDefaultProps(): LabelsPageViewProps {
  return {
    labels: [],
    isLoading: false,
    error: null,
    existingColors: [],
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
    createError: null,
    onCreate: vi.fn(),
    onUpdate: vi.fn(),
    onDelete: vi.fn(),
  };
}

describe('LabelsPageView', () => {
  it('should render without crashing', () => {
    render(<LabelsPageView {...createDefaultProps()} />, {
      wrapper: createMantineWrapper(),
    });
    expect(screen.getByText('ラベル管理')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(<LabelsPageView {...createDefaultProps()} isLoading />, {
      wrapper: createMantineWrapper(),
    });
    // Loader renders, just verify no error occurs
    expect(document.querySelector('.mantine-Loader-root')).toBeInTheDocument();
  });

  it('should show error state', () => {
    render(
      <LabelsPageView {...createDefaultProps()} error={new Error('Test error')} />,
      { wrapper: createMantineWrapper() },
    );
    expect(screen.getByText(/ラベルの読み込みエラー/)).toBeInTheDocument();
  });

  it('should render label list when labels exist', () => {
    const props = createDefaultProps();
    props.labels = [
      { id: 'label-1', name: 'Test Label', color: '#ff0000', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
    ];
    render(<LabelsPageView {...props} />, {
      wrapper: createMantineWrapper(),
    });
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });
});
