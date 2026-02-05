import type { ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import { API_TYPES, type ApiClient } from '@picstash/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { Container } from 'inversify';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { ImageCollectionsSection } from '@/features/manage-image-collections';
import { ContainerProvider } from '@/shared/di';

interface MockCollectionsMethods {
  fetchImageCollections?: () => Promise<unknown>;
  list?: () => Promise<unknown>;
  addImage?: () => Promise<unknown>;
  removeImage?: () => Promise<unknown>;
}

function createMockApiClient(methods: MockCollectionsMethods = {}) {
  return {
    collections: {
      fetchImageCollections: methods.fetchImageCollections ?? vi.fn().mockResolvedValue([]),
      list: methods.list ?? vi.fn().mockResolvedValue([]),
      addImage: methods.addImage ?? vi.fn().mockResolvedValue(undefined),
      removeImage: methods.removeImage ?? vi.fn().mockResolvedValue(undefined),
    },
  } as unknown as ApiClient;
}

function createWrapper(methods: MockCollectionsMethods = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const container = new Container();
  container.bind<ApiClient>(API_TYPES.ApiClient).toConstantValue(createMockApiClient(methods));

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MantineProvider>
          <ContainerProvider container={container}>
            <MemoryRouter>{children}</MemoryRouter>
          </ContainerProvider>
        </MantineProvider>
      </QueryClientProvider>
    );
  };
}

describe('ImageCollectionsSection', () => {
  it('should render empty state when not in any collection', async () => {
    render(<ImageCollectionsSection imageId="img-1" />, {
      wrapper: createWrapper({
        fetchImageCollections: vi.fn().mockResolvedValue([]),
        list: vi.fn().mockResolvedValue([]),
      }),
    });

    await waitFor(() => {
      expect(screen.getByText('コレクションに追加されていません')).toBeInTheDocument();
    });
  });

  it('should render collections the image belongs to', async () => {
    render(<ImageCollectionsSection imageId="img-1" />, {
      wrapper: createWrapper({
        fetchImageCollections: vi.fn().mockResolvedValue([
          {
            id: 'col-1',
            name: 'Favorites',
            description: null,
            coverImageId: null,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ]),
        list: vi.fn().mockResolvedValue([
          {
            id: 'col-1',
            name: 'Favorites',
            description: null,
            coverImageId: null,
            imageCount: 5,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ]),
      }),
    });

    await waitFor(() => {
      expect(screen.getByText('Favorites')).toBeInTheDocument();
    });
  });

  it('should show add button to select collections', async () => {
    render(<ImageCollectionsSection imageId="img-1" />, {
      wrapper: createWrapper({
        fetchImageCollections: vi.fn().mockResolvedValue([]),
        list: vi.fn().mockResolvedValue([
          {
            id: 'col-1',
            name: 'Favorites',
            description: null,
            coverImageId: null,
            imageCount: 5,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ]),
      }),
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '追加' })).toBeInTheDocument();
    });
  });

  it('should render select dropdown when collections available', async () => {
    render(<ImageCollectionsSection imageId="img-1" />, {
      wrapper: createWrapper({
        fetchImageCollections: vi.fn().mockResolvedValue([]),
        list: vi.fn().mockResolvedValue([
          {
            id: 'col-1',
            name: 'Favorites',
            description: null,
            coverImageId: null,
            imageCount: 5,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ]),
      }),
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText('コレクションを選択')).toBeInTheDocument();
    });

    // Verify the add button exists but is disabled when no selection
    const addButton = screen.getByRole('button', { name: '追加' });
    expect(addButton).toBeDisabled();
  });

  it('should show link to create collection when no collections exist', async () => {
    render(<ImageCollectionsSection imageId="img-1" />, {
      wrapper: createWrapper({
        fetchImageCollections: vi.fn().mockResolvedValue([]),
        list: vi.fn().mockResolvedValue([]),
      }),
    });

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'コレクションを作成' })).toHaveAttribute('href', '/collections');
    });
  });

  it('should hide select when all collections are already assigned', async () => {
    render(<ImageCollectionsSection imageId="img-1" />, {
      wrapper: createWrapper({
        fetchImageCollections: vi.fn().mockResolvedValue([
          {
            id: 'col-1',
            name: 'Favorites',
            description: null,
            coverImageId: null,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ]),
        list: vi.fn().mockResolvedValue([
          {
            id: 'col-1',
            name: 'Favorites',
            description: null,
            coverImageId: null,
            imageCount: 5,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ]),
      }),
    });

    await waitFor(() => {
      // Favorites badge should be shown
      expect(screen.getByText('Favorites')).toBeInTheDocument();
    });

    // The select should not be shown when all collections are assigned
    expect(screen.queryByPlaceholderText('コレクションを選択')).not.toBeInTheDocument();
  });
});
