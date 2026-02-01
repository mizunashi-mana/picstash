import type { ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { fetchImages } from '@/entities/image';
import { ImageGallery } from '@/features/gallery/components/ImageGallery';

vi.mock('@/entities/image', () => ({
  fetchImages: vi.fn(),
  getThumbnailUrl: (id: string) => `/api/images/${id}/thumbnail`,
}));

vi.mock('@/features/gallery/api', () => ({
  saveSearchHistory: vi.fn(),
  deleteAllSearchHistory: vi.fn(),
}));

vi.mock('@/features/gallery/components/SearchBar', () => ({
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

function createWrapper(initialEntries: string[] = ['/']) {
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
          <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
        </MantineProvider>
      </QueryClientProvider>
    );
  };
}

describe('ImageGallery', () => {
  it('should render collapsed by default when no query', () => {
    render(<ImageGallery />, { wrapper: createWrapper() });

    expect(screen.getByRole('button', { name: '展開する' })).toBeInTheDocument();
  });

  it('should render expanded when query exists in URL', async () => {
    vi.mocked(fetchImages).mockResolvedValue([]);

    render(<ImageGallery />, { wrapper: createWrapper(['/?q=test']) });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '折りたたむ' })).toBeInTheDocument();
    });
  });

  it('should fetch images when expanded', async () => {
    vi.mocked(fetchImages).mockResolvedValue([]);
    const user = userEvent.setup();

    render(<ImageGallery />, { wrapper: createWrapper() });

    await user.click(screen.getByRole('button', { name: '展開する' }));

    await waitFor(() => {
      expect(fetchImages).toHaveBeenCalled();
    });
  });

  it('should render search bar when expanded', async () => {
    vi.mocked(fetchImages).mockResolvedValue([]);
    const user = userEvent.setup();

    render(<ImageGallery />, { wrapper: createWrapper() });

    // Expand gallery first
    await user.click(screen.getByRole('button', { name: '展開する' }));

    expect(screen.getByTestId('search-bar')).toBeInTheDocument();
  });

  it('should render loading state', async () => {
    vi.mocked(fetchImages).mockImplementation(async () => await new Promise(() => {})); // Never resolves
    const user = userEvent.setup();

    render(<ImageGallery />, { wrapper: createWrapper() });

    await user.click(screen.getByRole('button', { name: '展開する' }));

    expect(screen.getByText('画像を読み込み中...')).toBeInTheDocument();
  });

  it('should display images when loaded', async () => {
    vi.mocked(fetchImages).mockResolvedValue([
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
    ]);
    const user = userEvent.setup();

    render(<ImageGallery />, { wrapper: createWrapper() });

    await user.click(screen.getByRole('button', { name: '展開する' }));

    await waitFor(() => {
      expect(screen.getByText('1件')).toBeInTheDocument();
    });
  });
});
