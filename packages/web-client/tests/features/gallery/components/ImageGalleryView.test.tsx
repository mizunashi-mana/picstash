import type { ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { ImageGalleryView } from '@/features/gallery/ui/ImageGalleryView';
import type { Image } from '@/entities/image';

vi.mock('@/entities/image', () => ({
  getThumbnailUrl: (id: string) => `/api/images/${id}/thumbnail`,
}));

vi.mock('@/features/search-images', () => ({
  SearchBar: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <input
      data-testid="search-bar"
      value={value}
      onChange={(e) => {
        onChange(e.target.value);
      }}
    />
  ),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MantineProvider>
          <MemoryRouter>{children}</MemoryRouter>
        </MantineProvider>
      </QueryClientProvider>
    );
  };
}

const mockImages: Image[] = [
  {
    id: 'img-1',
    title: 'Image 1',
    path: '/images/1.png',
    thumbnailPath: '/thumbnails/1.png',
    mimeType: 'image/png',
    size: 1000,
    width: 100,
    height: 100,
    description: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'img-2',
    title: 'Image 2',
    path: '/images/2.png',
    thumbnailPath: '/thumbnails/2.png',
    mimeType: 'image/png',
    size: 2000,
    width: 200,
    height: 200,
    description: null,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
];

describe('ImageGalleryView', () => {
  it('should render loading state', () => {
    render(
      <ImageGalleryView
        images={undefined}
        isLoading={true}
        error={null}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText('画像を読み込み中...')).toBeInTheDocument();
  });

  it('should render error state', () => {
    render(
      <ImageGalleryView
        images={undefined}
        isLoading={false}
        error={new Error('Network error')}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText(/画像の読み込みに失敗しました/)).toBeInTheDocument();
    expect(screen.getByText(/Network error/)).toBeInTheDocument();
  });

  it('should render empty state without search', () => {
    render(
      <ImageGalleryView
        images={[]}
        isLoading={false}
        error={null}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText('画像がありません')).toBeInTheDocument();
    expect(screen.getByText('画像をアップロードしてください')).toBeInTheDocument();
  });

  it('should render empty state with search query', () => {
    render(
      <ImageGalleryView
        images={[]}
        isLoading={false}
        error={null}
        searchQuery="test"
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText('検索結果がありません')).toBeInTheDocument();
    expect(screen.getByText('別のキーワードで検索してください')).toBeInTheDocument();
  });

  it('should render images', () => {
    render(
      <ImageGalleryView
        images={mockImages}
        isLoading={false}
        error={null}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText('2件')).toBeInTheDocument();
    // Check that image cards link to detail pages
    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', '/images/img-1');
    expect(links[1]).toHaveAttribute('href', '/images/img-2');
  });

  it('should render search bar when onSearchChange is provided', () => {
    const onSearchChange = vi.fn();

    render(
      <ImageGalleryView
        images={mockImages}
        isLoading={false}
        error={null}
        searchQuery=""
        onSearchChange={onSearchChange}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByTestId('search-bar')).toBeInTheDocument();
  });

  it('should toggle expand/collapse', async () => {
    const onToggleExpand = vi.fn();
    const user = userEvent.setup();

    render(
      <ImageGalleryView
        images={mockImages}
        isLoading={false}
        error={null}
        isExpanded={true}
        onToggleExpand={onToggleExpand}
      />,
      { wrapper: createWrapper() },
    );

    const toggleButton = screen.getByRole('button', { name: '折りたたむ' });
    await user.click(toggleButton);

    expect(onToggleExpand).toHaveBeenCalled();
  });

  it('should show expand button when collapsed', () => {
    render(
      <ImageGalleryView
        images={mockImages}
        isLoading={false}
        error={null}
        isExpanded={false}
        onToggleExpand={vi.fn()}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByRole('button', { name: '展開する' })).toBeInTheDocument();
  });

  it('should render history menu button', () => {
    render(
      <ImageGalleryView
        images={mockImages}
        isLoading={false}
        error={null}
        onSearchChange={vi.fn()}
        onDeleteAllHistory={vi.fn()}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByRole('button', { name: '検索履歴メニュー' })).toBeInTheDocument();
  });
});
