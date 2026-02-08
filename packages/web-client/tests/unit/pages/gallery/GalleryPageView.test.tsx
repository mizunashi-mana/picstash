import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GalleryPageView, type GalleryPageViewProps } from '@/pages/gallery/ui/GalleryPageView';
import { createTestWrapper } from '@~tests/unit/test-utils';

function createDefaultProps(): GalleryPageViewProps {
  return {
    query: '',
    viewMode: 'grid',
    allImages: [],
    total: 0,
    isLoading: false,
    error: null,
    isFetchingNextPage: false,
    columns: 4,
    virtualRows: [],
    virtualTotalSize: 0,
    parentRef: { current: null },
    getImageUrl: vi.fn((id: string) => `/images/${id}`),
    getThumbnailUrl: vi.fn((id: string) => `/thumbnails/${id}`),
    onSearchChange: vi.fn(),
    onDeleteAllHistory: vi.fn(),
    onViewModeChange: vi.fn(),
    onCarouselIndexChange: vi.fn(),
  };
}

describe('GalleryPageView', () => {
  it('should render without crashing', () => {
    render(<GalleryPageView {...createDefaultProps()} />, {
      wrapper: createTestWrapper(),
    });
    // Just verify the component renders
    expect(screen.getByRole('heading', { name: 'ギャラリー' })).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(<GalleryPageView {...createDefaultProps()} isLoading />, {
      wrapper: createTestWrapper(),
    });
    expect(screen.getByText(/画像を読み込み中/)).toBeInTheDocument();
  });

  it('should show error state', () => {
    render(
      <GalleryPageView {...createDefaultProps()} error={new Error('Test error')} />,
      { wrapper: createTestWrapper() },
    );
    expect(screen.getByText(/画像の読み込みに失敗しました/)).toBeInTheDocument();
  });

  it('should show empty state', () => {
    render(<GalleryPageView {...createDefaultProps()} />, {
      wrapper: createTestWrapper(),
    });
    expect(screen.getByText('画像がありません')).toBeInTheDocument();
  });
});
