import type { ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import { API_TYPES, type ApiClient, type DuplicateGroup } from '@picstash/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { Container } from 'inversify';
import { describe, expect, it, vi } from 'vitest';
import { useDuplicatesPageViewProps } from '@/pages/duplicates/ui/useDuplicatesPageViewProps';
import { ContainerProvider } from '@/shared/di';

interface MockImagesMethods {
  fetchDuplicates?: () => Promise<DuplicateGroup[]>;
  delete?: (id: string) => Promise<void>;
  getThumbnailUrl?: (id: string) => string;
}

function createMockApiClient(methods: MockImagesMethods = {}) {
  return {
    images: {
      fetchDuplicates: methods.fetchDuplicates ?? vi.fn().mockResolvedValue([]),
      delete: methods.delete ?? vi.fn().mockResolvedValue(undefined),
      getThumbnailUrl: methods.getThumbnailUrl ?? vi.fn((id: string) => `/thumbnails/${id}`),
    },
  } as unknown as ApiClient;
}

function createWrapper(methods: MockImagesMethods = {}) {
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

const mockDuplicateGroups: DuplicateGroup[] = [
  {
    original: { id: 'img-1', title: 'image1.jpg', thumbnailPath: null, createdAt: '2024-01-01T00:00:00Z' },
    duplicates: [
      { id: 'img-2', title: 'image2.jpg', thumbnailPath: null, createdAt: '2024-01-02T00:00:00Z', distance: 0.05 },
      { id: 'img-3', title: 'image3.jpg', thumbnailPath: null, createdAt: '2024-01-03T00:00:00Z', distance: 0.10 },
    ],
  },
  {
    original: { id: 'img-4', title: 'image4.jpg', thumbnailPath: null, createdAt: '2024-01-04T00:00:00Z' },
    duplicates: [
      { id: 'img-5', title: 'image5.jpg', thumbnailPath: null, createdAt: '2024-01-05T00:00:00Z', distance: 0.15 },
    ],
  },
];

describe('useDuplicatesPageViewProps', () => {
  describe('initial state', () => {
    it('should return initial state with empty selection', async () => {
      const { result } = renderHook(() => useDuplicatesPageViewProps(), {
        wrapper: createWrapper({
          fetchDuplicates: vi.fn().mockResolvedValue([]),
        }),
      });

      expect(result.current.threshold).toBe(0.1);
      expect(result.current.selectedIds.size).toBe(0);
      expect(result.current.deleteModalOpen).toBe(false);
      expect(result.current.deleteError).toBeNull();
    });

    it('should load duplicate groups', async () => {
      const { result } = renderHook(() => useDuplicatesPageViewProps(), {
        wrapper: createWrapper({
          fetchDuplicates: vi.fn().mockResolvedValue(mockDuplicateGroups),
        }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockDuplicateGroups);
    });
  });

  describe('onSelectToggle', () => {
    it('should add image to selection when not selected', async () => {
      const { result } = renderHook(() => useDuplicatesPageViewProps(), {
        wrapper: createWrapper({
          fetchDuplicates: vi.fn().mockResolvedValue(mockDuplicateGroups),
        }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.onSelectToggle('img-2');
      });

      expect(result.current.selectedIds.has('img-2')).toBe(true);
      expect(result.current.selectedIds.size).toBe(1);
    });

    it('should remove image from selection when already selected', async () => {
      const { result } = renderHook(() => useDuplicatesPageViewProps(), {
        wrapper: createWrapper({
          fetchDuplicates: vi.fn().mockResolvedValue(mockDuplicateGroups),
        }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.onSelectToggle('img-2');
      });
      expect(result.current.selectedIds.has('img-2')).toBe(true);

      act(() => {
        result.current.onSelectToggle('img-2');
      });
      expect(result.current.selectedIds.has('img-2')).toBe(false);
    });
  });

  describe('onSelectAllDuplicates', () => {
    it('should select all duplicates in a group when none are selected', async () => {
      const { result } = renderHook(() => useDuplicatesPageViewProps(), {
        wrapper: createWrapper({
          fetchDuplicates: vi.fn().mockResolvedValue(mockDuplicateGroups),
        }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.onSelectAllDuplicates(mockDuplicateGroups[0]!);
      });

      expect(result.current.selectedIds.has('img-2')).toBe(true);
      expect(result.current.selectedIds.has('img-3')).toBe(true);
      expect(result.current.selectedIds.size).toBe(2);
    });

    it('should deselect all duplicates in a group when all are selected', async () => {
      const { result } = renderHook(() => useDuplicatesPageViewProps(), {
        wrapper: createWrapper({
          fetchDuplicates: vi.fn().mockResolvedValue(mockDuplicateGroups),
        }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.onSelectAllDuplicates(mockDuplicateGroups[0]!);
      });
      expect(result.current.selectedIds.size).toBe(2);

      act(() => {
        result.current.onSelectAllDuplicates(mockDuplicateGroups[0]!);
      });
      expect(result.current.selectedIds.size).toBe(0);
    });
  });

  describe('delete modal', () => {
    it('should open delete modal when images are selected', async () => {
      const { result } = renderHook(() => useDuplicatesPageViewProps(), {
        wrapper: createWrapper({
          fetchDuplicates: vi.fn().mockResolvedValue(mockDuplicateGroups),
        }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.onSelectToggle('img-2');
      });

      act(() => {
        result.current.onDeleteSelected();
      });

      expect(result.current.deleteModalOpen).toBe(true);
    });

    it('should not open delete modal when no images are selected', async () => {
      const { result } = renderHook(() => useDuplicatesPageViewProps(), {
        wrapper: createWrapper({
          fetchDuplicates: vi.fn().mockResolvedValue(mockDuplicateGroups),
        }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.onDeleteSelected();
      });

      expect(result.current.deleteModalOpen).toBe(false);
    });
  });

  describe('threshold', () => {
    it('should update threshold', async () => {
      const { result } = renderHook(() => useDuplicatesPageViewProps(), {
        wrapper: createWrapper({
          fetchDuplicates: vi.fn().mockResolvedValue([]),
        }),
      });

      expect(result.current.threshold).toBe(0.1);

      act(() => {
        result.current.onThresholdChange(0.2);
      });

      expect(result.current.threshold).toBe(0.2);
    });
  });

  describe('getThumbnailUrl', () => {
    it('should return thumbnail URL from API client', async () => {
      const mockGetThumbnailUrl = vi.fn((id: string) => `/api/thumbnails/${id}`);
      const { result } = renderHook(() => useDuplicatesPageViewProps(), {
        wrapper: createWrapper({
          fetchDuplicates: vi.fn().mockResolvedValue([]),
          getThumbnailUrl: mockGetThumbnailUrl,
        }),
      });

      const url = result.current.getThumbnailUrl('img-1');
      expect(url).toBe('/api/thumbnails/img-1');
    });
  });
});
