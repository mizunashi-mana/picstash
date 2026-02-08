import type { ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import { API_TYPES, type ApiClient, type CollectionListItem } from '@picstash/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { Container } from 'inversify';
import { describe, expect, it, vi } from 'vitest';
import { useImageCollectionsSectionViewProps } from '@/features/manage-image-collections/ui/useImageCollectionsSectionViewProps';
import { ContainerProvider } from '@/shared/di';

interface MockCollectionsMethods {
  fetchImageCollections?: (imageId: string) => Promise<CollectionListItem[]>;
  list?: () => Promise<CollectionListItem[]>;
  addImage?: (collectionId: string, params: { imageId: string }) => Promise<void>;
  removeImage?: (collectionId: string, imageId: string) => Promise<void>;
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
            {children}
          </ContainerProvider>
        </MantineProvider>
      </QueryClientProvider>
    );
  };
}

const mockCollections: CollectionListItem[] = [
  {
    id: 'col-1',
    name: 'Favorites',
    description: null,
    coverImageId: null,
    imageCount: 5,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'col-2',
    name: 'Work',
    description: 'Work related',
    coverImageId: null,
    imageCount: 10,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
  {
    id: 'col-3',
    name: 'Personal',
    description: null,
    coverImageId: null,
    imageCount: 3,
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
  },
];

describe('useImageCollectionsSectionViewProps', () => {
  describe('availableCollections', () => {
    it('should return all collections when image is not in any collection', async () => {
      const { result } = renderHook(() => useImageCollectionsSectionViewProps('img-1'), {
        wrapper: createWrapper({
          fetchImageCollections: vi.fn().mockResolvedValue([]),
          list: vi.fn().mockResolvedValue(mockCollections),
        }),
      });

      await waitFor(() => {
        expect(result.current.availableCollections.length).toBe(3);
      });

      expect(result.current.availableCollections).toEqual([
        { value: 'col-1', label: 'Favorites' },
        { value: 'col-2', label: 'Work' },
        { value: 'col-3', label: 'Personal' },
      ]);
    });

    it('should exclude collections the image is already in', async () => {
      const imageCollections: CollectionListItem[] = [
        {
          id: 'col-1',
          name: 'Favorites',
          description: null,
          coverImageId: null,
          imageCount: 5,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      const { result } = renderHook(() => useImageCollectionsSectionViewProps('img-1'), {
        wrapper: createWrapper({
          fetchImageCollections: vi.fn().mockResolvedValue(imageCollections),
          list: vi.fn().mockResolvedValue(mockCollections),
        }),
      });

      await waitFor(() => {
        expect(result.current.availableCollections.length).toBe(2);
      });

      expect(result.current.availableCollections).toEqual([
        { value: 'col-2', label: 'Work' },
        { value: 'col-3', label: 'Personal' },
      ]);
    });
  });

  describe('hasAnyCollections', () => {
    it('should be true when collections exist', async () => {
      const { result } = renderHook(() => useImageCollectionsSectionViewProps('img-1'), {
        wrapper: createWrapper({
          fetchImageCollections: vi.fn().mockResolvedValue([]),
          list: vi.fn().mockResolvedValue(mockCollections),
        }),
      });

      await waitFor(() => {
        expect(result.current.hasAnyCollections).toBe(true);
      });
    });

    it('should be false when no collections exist', async () => {
      const { result } = renderHook(() => useImageCollectionsSectionViewProps('img-1'), {
        wrapper: createWrapper({
          fetchImageCollections: vi.fn().mockResolvedValue([]),
          list: vi.fn().mockResolvedValue([]),
        }),
      });

      await waitFor(() => {
        expect(result.current.hasAnyCollections).toBe(false);
      });
    });
  });

  describe('selection state', () => {
    it('should start with no selection', async () => {
      const { result } = renderHook(() => useImageCollectionsSectionViewProps('img-1'), {
        wrapper: createWrapper({
          fetchImageCollections: vi.fn().mockResolvedValue([]),
          list: vi.fn().mockResolvedValue(mockCollections),
        }),
      });

      expect(result.current.selectedCollectionId).toBeNull();
    });

    it('should update selection when changed', async () => {
      const { result } = renderHook(() => useImageCollectionsSectionViewProps('img-1'), {
        wrapper: createWrapper({
          fetchImageCollections: vi.fn().mockResolvedValue([]),
          list: vi.fn().mockResolvedValue(mockCollections),
        }),
      });

      act(() => {
        result.current.onSelectedCollectionIdChange('col-2');
      });

      expect(result.current.selectedCollectionId).toBe('col-2');
    });
  });

  describe('onAdd', () => {
    it('should not add when no collection is selected', async () => {
      const addImageMock = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useImageCollectionsSectionViewProps('img-1'), {
        wrapper: createWrapper({
          fetchImageCollections: vi.fn().mockResolvedValue([]),
          list: vi.fn().mockResolvedValue(mockCollections),
          addImage: addImageMock,
        }),
      });

      await waitFor(() => {
        expect(result.current.availableCollections.length).toBe(3);
      });

      act(() => {
        result.current.onAdd();
      });

      expect(addImageMock).not.toHaveBeenCalled();
    });

    it('should add image to selected collection', async () => {
      const addImageMock = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useImageCollectionsSectionViewProps('img-1'), {
        wrapper: createWrapper({
          fetchImageCollections: vi.fn().mockResolvedValue([]),
          list: vi.fn().mockResolvedValue(mockCollections),
          addImage: addImageMock,
        }),
      });

      await waitFor(() => {
        expect(result.current.availableCollections.length).toBe(3);
      });

      act(() => {
        result.current.onSelectedCollectionIdChange('col-2');
      });

      act(() => {
        result.current.onAdd();
      });

      await waitFor(() => {
        expect(addImageMock).toHaveBeenCalledWith('col-2', { imageId: 'img-1' });
      });
    });
  });

  describe('onRemove', () => {
    it('should remove image from collection', async () => {
      const removeImageMock = vi.fn().mockResolvedValue(undefined);
      const imageCollections: CollectionListItem[] = [
        {
          id: 'col-1',
          name: 'Favorites',
          description: null,
          coverImageId: null,
          imageCount: 5,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      const { result } = renderHook(() => useImageCollectionsSectionViewProps('img-1'), {
        wrapper: createWrapper({
          fetchImageCollections: vi.fn().mockResolvedValue(imageCollections),
          list: vi.fn().mockResolvedValue(mockCollections),
          removeImage: removeImageMock,
        }),
      });

      await waitFor(() => {
        expect(result.current.imageCollections?.length).toBe(1);
      });

      act(() => {
        result.current.onRemove('col-1');
      });

      await waitFor(() => {
        expect(removeImageMock).toHaveBeenCalledWith('col-1', 'img-1');
      });
    });
  });
});
