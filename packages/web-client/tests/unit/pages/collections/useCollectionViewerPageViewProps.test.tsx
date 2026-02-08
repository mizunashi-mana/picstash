import type { ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import { API_TYPES, type ApiClient, type CollectionWithImages } from '@picstash/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { Container } from 'inversify';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { useCollectionViewerPageViewProps } from '@/pages/collections/ui/useCollectionViewerPageViewProps';
import { ContainerProvider } from '@/shared/di';

interface MockCollectionsMethods {
  detail?: (id: string) => Promise<CollectionWithImages>;
}

function createMockApiClient(methods: MockCollectionsMethods = {}) {
  return {
    collections: {
      detail: methods.detail ?? vi.fn().mockResolvedValue({
        id: 'col-1',
        name: 'Test Collection',
        description: null,
        coverImageId: null,
        images: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }),
    },
  } as unknown as ApiClient;
}

interface WrapperOptions {
  methods?: MockCollectionsMethods;
  initialPath?: string;
}

function createWrapper(options: WrapperOptions = {}) {
  const { methods = {}, initialPath = '/collections/col-1/view' } = options;

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
            <MemoryRouter initialEntries={[initialPath]}>
              <Routes>
                <Route path="/collections/:id/view/:imageId?" element={children} />
              </Routes>
            </MemoryRouter>
          </ContainerProvider>
        </MantineProvider>
      </QueryClientProvider>
    );
  };
}

const mockCollectionWithImages: CollectionWithImages = {
  id: 'col-1',
  name: 'Test Collection',
  description: 'A test collection',
  coverImageId: null,
  images: [
    { id: 'ci-1', imageId: 'img-1', order: 0, title: 'Image 1', thumbnailPath: null },
    { id: 'ci-2', imageId: 'img-2', order: 1, title: 'Image 2', thumbnailPath: null },
    { id: 'ci-3', imageId: 'img-3', order: 2, title: 'Image 3', thumbnailPath: null },
    { id: 'ci-4', imageId: 'img-4', order: 3, title: 'Image 4', thumbnailPath: null },
    { id: 'ci-5', imageId: 'img-5', order: 4, title: 'Image 5', thumbnailPath: null },
  ],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-05T00:00:00Z',
};

describe('useCollectionViewerPageViewProps', () => {
  describe('initial state', () => {
    it('should start at first image when no imageId in URL', async () => {
      const { result } = renderHook(() => useCollectionViewerPageViewProps(), {
        wrapper: createWrapper({
          methods: {
            detail: vi.fn().mockResolvedValue(mockCollectionWithImages),
          },
          initialPath: '/collections/col-1/view',
        }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.currentIndex).toBe(0);
      expect(result.current.currentImage?.imageId).toBe('img-1');
    });

    it('should start at specified image when imageId in URL', async () => {
      const { result } = renderHook(() => useCollectionViewerPageViewProps(), {
        wrapper: createWrapper({
          methods: {
            detail: vi.fn().mockResolvedValue(mockCollectionWithImages),
          },
          initialPath: '/collections/col-1/view/img-3',
        }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.currentIndex).toBe(2);
      expect(result.current.currentImage?.imageId).toBe('img-3');
    });
  });

  describe('navigation state', () => {
    it('should have correct canGoPrev/canGoNext at first image', async () => {
      const { result } = renderHook(() => useCollectionViewerPageViewProps(), {
        wrapper: createWrapper({
          methods: {
            detail: vi.fn().mockResolvedValue(mockCollectionWithImages),
          },
          initialPath: '/collections/col-1/view/img-1',
        }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.canGoPrev).toBe(false);
      expect(result.current.canGoNext).toBe(true);
    });

    it('should have correct canGoPrev/canGoNext at middle image', async () => {
      const { result } = renderHook(() => useCollectionViewerPageViewProps(), {
        wrapper: createWrapper({
          methods: {
            detail: vi.fn().mockResolvedValue(mockCollectionWithImages),
          },
          initialPath: '/collections/col-1/view/img-3',
        }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.canGoPrev).toBe(true);
      expect(result.current.canGoNext).toBe(true);
    });

    it('should have correct canGoPrev/canGoNext at last image', async () => {
      const { result } = renderHook(() => useCollectionViewerPageViewProps(), {
        wrapper: createWrapper({
          methods: {
            detail: vi.fn().mockResolvedValue(mockCollectionWithImages),
          },
          initialPath: '/collections/col-1/view/img-5',
        }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.canGoPrev).toBe(true);
      expect(result.current.canGoNext).toBe(false);
    });
  });

  describe('navigation actions', () => {
    it('should navigate to next image', async () => {
      const { result } = renderHook(() => useCollectionViewerPageViewProps(), {
        wrapper: createWrapper({
          methods: {
            detail: vi.fn().mockResolvedValue(mockCollectionWithImages),
          },
          initialPath: '/collections/col-1/view/img-1',
        }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.onGoNext();
      });

      expect(result.current.currentIndex).toBe(1);
      expect(result.current.currentImage?.imageId).toBe('img-2');
    });

    it('should navigate to previous image', async () => {
      const { result } = renderHook(() => useCollectionViewerPageViewProps(), {
        wrapper: createWrapper({
          methods: {
            detail: vi.fn().mockResolvedValue(mockCollectionWithImages),
          },
          initialPath: '/collections/col-1/view/img-3',
        }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.onGoPrev();
      });

      expect(result.current.currentIndex).toBe(1);
      expect(result.current.currentImage?.imageId).toBe('img-2');
    });
  });

  describe('empty collection', () => {
    it('should handle empty collection', async () => {
      const emptyCollection: CollectionWithImages = {
        id: 'col-1',
        name: 'Empty Collection',
        description: null,
        coverImageId: null,
        images: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const { result } = renderHook(() => useCollectionViewerPageViewProps(), {
        wrapper: createWrapper({
          methods: {
            detail: vi.fn().mockResolvedValue(emptyCollection),
          },
        }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.currentImage).toBeNull();
      expect(result.current.canGoPrev).toBe(false);
      expect(result.current.canGoNext).toBe(false);
    });
  });
});
