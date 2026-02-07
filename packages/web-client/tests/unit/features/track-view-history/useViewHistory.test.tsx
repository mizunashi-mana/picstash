import type { ReactNode } from 'react';
import { API_TYPES, type ApiClient } from '@picstash/api';
import { renderHook, waitFor } from '@testing-library/react';
import { Container } from 'inversify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useViewHistory } from '@/features/track-view-history/model/useViewHistory';
import { ContainerProvider } from '@/shared/di';

const mockRecordStart = vi.fn();
const mockRecordEnd = vi.fn();
const mockRecordClick = vi.fn();

function createMockApiClient() {
  return {
    viewHistory: {
      recordStart: mockRecordStart,
      recordEnd: mockRecordEnd,
    },
    recommendations: {
      recordClick: mockRecordClick,
    },
  } as unknown as ApiClient;
}

function createWrapper() {
  const container = new Container();
  container.bind<ApiClient>(API_TYPES.ApiClient).toConstantValue(createMockApiClient());

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ContainerProvider container={container}>{children}</ContainerProvider>
    );
  };
}

// Helper to create hook wrapper functions
const createHookFn = (imageId?: string, options?: Parameters<typeof useViewHistory>[1]) =>
  () => { useViewHistory(imageId, options); };

describe('useViewHistory', () => {
  beforeEach(() => {
    mockRecordStart.mockResolvedValue({
      id: 'view-history-1',
      imageId: 'image-1',
      viewedAt: '2024-01-01T00:00:00Z',
      duration: null,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    });
    mockRecordEnd.mockResolvedValue({
      id: 'view-history-1',
      imageId: 'image-1',
      viewedAt: '2024-01-01T00:00:00Z',
      duration: 5000,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    });
    mockRecordClick.mockResolvedValue({
      id: 'conversion-1',
      imageId: 'image-1',
      recommendationScore: 0.85,
      impressionAt: '2024-01-01T00:00:00Z',
      clickedAt: '2024-01-01T00:00:01Z',
      viewHistoryId: 'view-history-1',
      createdAt: '2024-01-01T00:00:00Z',
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should call recordViewStart when mounted with imageId', async () => {
    renderHook(createHookFn('image-1'), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(mockRecordStart).toHaveBeenCalledWith('image-1');
    });
  });

  it('should not call recordViewStart when imageId is undefined', () => {
    renderHook(createHookFn(undefined), { wrapper: createWrapper() });

    expect(mockRecordStart).not.toHaveBeenCalled();
  });

  it('should not call recordViewStart when disabled', () => {
    renderHook(createHookFn('image-1', { enabled: false }), { wrapper: createWrapper() });

    expect(mockRecordStart).not.toHaveBeenCalled();
  });

  it('should call recordViewEnd when unmounted', async () => {
    const { unmount } = renderHook(createHookFn('image-1'), { wrapper: createWrapper() });

    // Wait for recordViewStart to complete
    await waitFor(() => {
      expect(mockRecordStart).toHaveBeenCalledWith('image-1');
    });

    unmount();

    await waitFor(() => {
      expect(mockRecordEnd).toHaveBeenCalledWith('view-history-1', expect.any(Number));
    });
  });

  it('should not call recordViewEnd when isDeleted is true', async () => {
    const container = new Container();
    container.bind<ApiClient>(API_TYPES.ApiClient).toConstantValue(createMockApiClient());

    const { unmount, rerender } = renderHook(
      ({ isDeleted }) => { useViewHistory('image-1', { isDeleted }); },
      {
        initialProps: { isDeleted: false },
        wrapper: ({ children }: { children: ReactNode }) => (
          <ContainerProvider container={container}>{children}</ContainerProvider>
        ),
      },
    );

    await waitFor(() => {
      expect(mockRecordStart).toHaveBeenCalled();
    });

    // Set isDeleted to true before unmounting
    rerender({ isDeleted: true });

    unmount();

    // recordViewEnd should not be called when image is deleted
    expect(mockRecordEnd).not.toHaveBeenCalled();
  });

  it('should call recordRecommendationClick when conversionId is provided', async () => {
    renderHook(createHookFn('image-1', { conversionId: 'conversion-1' }), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(mockRecordClick).toHaveBeenCalledWith('conversion-1', {
        viewHistoryId: 'view-history-1',
      });
    });
  });

  it('should not call recordRecommendationClick when conversionId is null', async () => {
    renderHook(createHookFn('image-1', { conversionId: null }), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(mockRecordStart).toHaveBeenCalled();
    });

    expect(mockRecordClick).not.toHaveBeenCalled();
  });

  it('should handle recordViewStart failure gracefully', async () => {
    mockRecordStart.mockRejectedValue(new Error('API Error'));

    // Should not throw
    const { unmount } = renderHook(createHookFn('image-1'), { wrapper: createWrapper() });

    // Wait for the async operation to complete
    await waitFor(() => {
      expect(mockRecordStart).toHaveBeenCalled();
    });

    // Should not throw on unmount either
    unmount();
  });

  it('should handle recordViewEnd failure gracefully', async () => {
    mockRecordEnd.mockRejectedValue(new Error('API Error'));

    const { unmount } = renderHook(createHookFn('image-1'), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(mockRecordStart).toHaveBeenCalled();
    });

    // Should not throw
    unmount();
  });
});
