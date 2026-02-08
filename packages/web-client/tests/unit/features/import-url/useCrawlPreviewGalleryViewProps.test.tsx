import type { ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import { API_TYPES, type ApiClient, type CrawledImage } from '@picstash/api';
import { act, renderHook } from '@testing-library/react';
import { Container } from 'inversify';
import { describe, expect, it, vi } from 'vitest';
import { useCrawlPreviewGalleryViewProps } from '@/features/import-url/ui/useCrawlPreviewGalleryViewProps';
import { ContainerProvider } from '@/shared/di';

function createMockApiClient() {
  return {
    urlCrawl: {
      getThumbnailUrl: vi.fn((sessionId: string, index: number) => `/api/crawl/${sessionId}/thumbnail/${index.toString()}`),
      getImageUrl: vi.fn((sessionId: string, index: number) => `/api/crawl/${sessionId}/image/${index.toString()}`),
    },
  } as unknown as ApiClient;
}

function createWrapper() {
  const container = new Container();
  container.bind<ApiClient>(API_TYPES.ApiClient).toConstantValue(createMockApiClient());

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MantineProvider>
        <ContainerProvider container={container}>
          {children}
        </ContainerProvider>
      </MantineProvider>
    );
  };
}

const mockImages: CrawledImage[] = [
  { index: 0, url: 'https://example.com/image1.jpg', filename: 'image1.jpg' },
  { index: 1, url: 'https://example.com/image2.jpg', filename: 'image2.jpg' },
  { index: 2, url: 'https://example.com/image3.jpg', filename: 'image3.jpg' },
];

describe('useCrawlPreviewGalleryViewProps', () => {
  describe('initial state', () => {
    it('should pass through props correctly', () => {
      const onSelectionChange = vi.fn();
      const { result } = renderHook(
        () =>
          useCrawlPreviewGalleryViewProps({
            sessionId: 'session-123',
            images: mockImages,
            selectedIndices: new Set([0, 2]),
            onSelectionChange,
          }),
        { wrapper: createWrapper() },
      );

      expect(result.current.sessionId).toBe('session-123');
      expect(result.current.images).toEqual(mockImages);
      expect(result.current.selectedIndices).toEqual(new Set([0, 2]));
    });

    it('should start with no preview image', () => {
      const onSelectionChange = vi.fn();
      const { result } = renderHook(
        () =>
          useCrawlPreviewGalleryViewProps({
            sessionId: 'session-123',
            images: mockImages,
            selectedIndices: new Set(),
            onSelectionChange,
          }),
        { wrapper: createWrapper() },
      );

      expect(result.current.previewImage).toBeNull();
      expect(result.current.previewOpened).toBe(false);
    });
  });

  describe('onSelectionToggle', () => {
    it('should add index to selection when not selected', () => {
      const onSelectionChange = vi.fn();
      const { result } = renderHook(
        () =>
          useCrawlPreviewGalleryViewProps({
            sessionId: 'session-123',
            images: mockImages,
            selectedIndices: new Set([0]),
            onSelectionChange,
          }),
        { wrapper: createWrapper() },
      );

      act(() => {
        result.current.onSelectionToggle(1);
      });

      expect(onSelectionChange).toHaveBeenCalledWith(new Set([0, 1]));
    });

    it('should remove index from selection when already selected', () => {
      const onSelectionChange = vi.fn();
      const { result } = renderHook(
        () =>
          useCrawlPreviewGalleryViewProps({
            sessionId: 'session-123',
            images: mockImages,
            selectedIndices: new Set([0, 1, 2]),
            onSelectionChange,
          }),
        { wrapper: createWrapper() },
      );

      act(() => {
        result.current.onSelectionToggle(1);
      });

      expect(onSelectionChange).toHaveBeenCalledWith(new Set([0, 2]));
    });
  });

  describe('preview', () => {
    it('should open preview when clicking on image', () => {
      const onSelectionChange = vi.fn();
      const { result } = renderHook(
        () =>
          useCrawlPreviewGalleryViewProps({
            sessionId: 'session-123',
            images: mockImages,
            selectedIndices: new Set(),
            onSelectionChange,
          }),
        { wrapper: createWrapper() },
      );

      const mockEvent = {
        stopPropagation: vi.fn(),
      } as unknown as React.MouseEvent;

      act(() => {
        result.current.onPreviewClick(mockImages[1]!, mockEvent);
      });

      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(result.current.previewImage).toEqual(mockImages[1]);
      expect(result.current.previewOpened).toBe(true);
    });

    it('should close preview when calling onPreviewClose', () => {
      const onSelectionChange = vi.fn();
      const { result } = renderHook(
        () =>
          useCrawlPreviewGalleryViewProps({
            sessionId: 'session-123',
            images: mockImages,
            selectedIndices: new Set(),
            onSelectionChange,
          }),
        { wrapper: createWrapper() },
      );

      const mockEvent = {
        stopPropagation: vi.fn(),
      } as unknown as React.MouseEvent;

      act(() => {
        result.current.onPreviewClick(mockImages[0]!, mockEvent);
      });
      expect(result.current.previewOpened).toBe(true);

      act(() => {
        result.current.onPreviewClose();
      });
      expect(result.current.previewOpened).toBe(false);
    });
  });

  describe('URL functions', () => {
    it('should provide getThumbnailUrl from API client', () => {
      const onSelectionChange = vi.fn();
      const { result } = renderHook(
        () =>
          useCrawlPreviewGalleryViewProps({
            sessionId: 'session-123',
            images: mockImages,
            selectedIndices: new Set(),
            onSelectionChange,
          }),
        { wrapper: createWrapper() },
      );

      const url = result.current.getThumbnailUrl('session-123', 0);
      expect(url).toBe('/api/crawl/session-123/thumbnail/0');
    });

    it('should provide getImageUrl from API client', () => {
      const onSelectionChange = vi.fn();
      const { result } = renderHook(
        () =>
          useCrawlPreviewGalleryViewProps({
            sessionId: 'session-123',
            images: mockImages,
            selectedIndices: new Set(),
            onSelectionChange,
          }),
        { wrapper: createWrapper() },
      );

      const url = result.current.getImageUrl('session-123', 1);
      expect(url).toBe('/api/crawl/session-123/image/1');
    });
  });
});
