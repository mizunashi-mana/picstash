import type { ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import {
  fetchCollections,
  fetchImageCollections,
} from '@/features/collections';
import { ImageCollectionsSection } from '@/features/gallery/components/ImageCollectionsSection';

vi.mock('@/features/collections', () => ({
  fetchCollections: vi.fn(),
  fetchImageCollections: vi.fn(),
  addImageToCollection: vi.fn(),
  removeImageFromCollection: vi.fn(),
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

describe('ImageCollectionsSection', () => {
  it('should render empty state when not in any collection', async () => {
    vi.mocked(fetchImageCollections).mockResolvedValue([]);
    vi.mocked(fetchCollections).mockResolvedValue([]);

    render(<ImageCollectionsSection imageId="img-1" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('コレクションに追加されていません')).toBeInTheDocument();
    });
  });

  it('should render collections the image belongs to', async () => {
    vi.mocked(fetchImageCollections).mockResolvedValue([
      {
        id: 'col-1',
        name: 'Favorites',
        description: null,
        coverImageId: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ]);
    vi.mocked(fetchCollections).mockResolvedValue([
      {
        id: 'col-1',
        name: 'Favorites',
        description: null,
        coverImageId: null,
        imageCount: 5,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ]);

    render(<ImageCollectionsSection imageId="img-1" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Favorites')).toBeInTheDocument();
    });
  });

  it('should show add button to select collections', async () => {
    vi.mocked(fetchImageCollections).mockResolvedValue([]);
    vi.mocked(fetchCollections).mockResolvedValue([
      {
        id: 'col-1',
        name: 'Favorites',
        description: null,
        coverImageId: null,
        imageCount: 5,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ]);

    render(<ImageCollectionsSection imageId="img-1" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '追加' })).toBeInTheDocument();
    });
  });

  it('should render select dropdown when collections available', async () => {
    vi.mocked(fetchImageCollections).mockResolvedValue([]);
    vi.mocked(fetchCollections).mockResolvedValue([
      {
        id: 'col-1',
        name: 'Favorites',
        description: null,
        coverImageId: null,
        imageCount: 5,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ]);

    render(<ImageCollectionsSection imageId="img-1" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByPlaceholderText('コレクションを選択')).toBeInTheDocument();
    });

    // Verify the add button exists but is disabled when no selection
    const addButton = screen.getByRole('button', { name: '追加' });
    expect(addButton).toBeDisabled();
  });

  it('should show link to create collection when no collections exist', async () => {
    vi.mocked(fetchImageCollections).mockResolvedValue([]);
    vi.mocked(fetchCollections).mockResolvedValue([]);

    render(<ImageCollectionsSection imageId="img-1" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'コレクションを作成' })).toHaveAttribute('href', '/collections');
    });
  });

  it('should hide select when all collections are already assigned', async () => {
    vi.mocked(fetchImageCollections).mockResolvedValue([
      {
        id: 'col-1',
        name: 'Favorites',
        description: null,
        coverImageId: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ]);
    vi.mocked(fetchCollections).mockResolvedValue([
      {
        id: 'col-1',
        name: 'Favorites',
        description: null,
        coverImageId: null,
        imageCount: 5,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ]);

    render(<ImageCollectionsSection imageId="img-1" />, { wrapper: createWrapper() });

    await waitFor(() => {
      // Favorites badge should be shown
      expect(screen.getByText('Favorites')).toBeInTheDocument();
    });

    // The select should not be shown when all collections are assigned
    expect(screen.queryByPlaceholderText('コレクションを選択')).not.toBeInTheDocument();
  });
});
