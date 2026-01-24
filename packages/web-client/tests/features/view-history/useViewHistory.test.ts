import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { recordRecommendationClick } from '@/features/recommendations';
import { recordViewEnd, recordViewStart } from '@/features/view-history/api';
import { useViewHistory } from '@/features/view-history/useViewHistory';

// Mock API modules
vi.mock('@/features/view-history/api', () => ({
  recordViewStart: vi.fn(),
  recordViewEnd: vi.fn(),
}));

vi.mock('@/features/recommendations', () => ({
  recordRecommendationClick: vi.fn(),
}));

// Helper to create hook wrapper functions
const createHookFn = (imageId?: string, options?: Parameters<typeof useViewHistory>[1]) =>
  () => { useViewHistory(imageId, options); };

describe('useViewHistory', () => {
  beforeEach(() => {
    vi.mocked(recordViewStart).mockResolvedValue({
      id: 'view-history-1',
      imageId: 'image-1',
      viewedAt: '2024-01-01T00:00:00Z',
      duration: null,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    });
    vi.mocked(recordViewEnd).mockResolvedValue({
      id: 'view-history-1',
      imageId: 'image-1',
      viewedAt: '2024-01-01T00:00:00Z',
      duration: 5000,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    });
    vi.mocked(recordRecommendationClick).mockResolvedValue({
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
    renderHook(createHookFn('image-1'));

    await waitFor(() => {
      expect(recordViewStart).toHaveBeenCalledWith('image-1');
    });
  });

  it('should not call recordViewStart when imageId is undefined', () => {
    renderHook(createHookFn(undefined));

    expect(recordViewStart).not.toHaveBeenCalled();
  });

  it('should not call recordViewStart when disabled', () => {
    renderHook(createHookFn('image-1', { enabled: false }));

    expect(recordViewStart).not.toHaveBeenCalled();
  });

  it('should call recordViewEnd when unmounted', async () => {
    const { unmount } = renderHook(createHookFn('image-1'));

    // Wait for recordViewStart to complete
    await waitFor(() => {
      expect(recordViewStart).toHaveBeenCalledWith('image-1');
    });

    unmount();

    await waitFor(() => {
      expect(recordViewEnd).toHaveBeenCalledWith('view-history-1', expect.any(Number));
    });
  });

  it('should not call recordViewEnd when isDeleted is true', async () => {
    const { unmount, rerender } = renderHook(
      ({ isDeleted }) => { useViewHistory('image-1', { isDeleted }); },
      { initialProps: { isDeleted: false } },
    );

    await waitFor(() => {
      expect(recordViewStart).toHaveBeenCalled();
    });

    // Set isDeleted to true before unmounting
    rerender({ isDeleted: true });

    unmount();

    // recordViewEnd should not be called when image is deleted
    expect(recordViewEnd).not.toHaveBeenCalled();
  });

  it('should call recordRecommendationClick when conversionId is provided', async () => {
    renderHook(createHookFn('image-1', { conversionId: 'conversion-1' }));

    await waitFor(() => {
      expect(recordRecommendationClick).toHaveBeenCalledWith('conversion-1', {
        viewHistoryId: 'view-history-1',
      });
    });
  });

  it('should not call recordRecommendationClick when conversionId is null', async () => {
    renderHook(createHookFn('image-1', { conversionId: null }));

    await waitFor(() => {
      expect(recordViewStart).toHaveBeenCalled();
    });

    expect(recordRecommendationClick).not.toHaveBeenCalled();
  });

  it('should handle recordViewStart failure gracefully', async () => {
    vi.mocked(recordViewStart).mockRejectedValue(new Error('API Error'));

    // Should not throw
    const { unmount } = renderHook(createHookFn('image-1'));

    // Wait for the async operation to complete
    await waitFor(() => {
      expect(recordViewStart).toHaveBeenCalled();
    });

    // Should not throw on unmount either
    unmount();
  });

  it('should handle recordViewEnd failure gracefully', async () => {
    vi.mocked(recordViewEnd).mockRejectedValue(new Error('API Error'));

    const { unmount } = renderHook(createHookFn('image-1'));

    await waitFor(() => {
      expect(recordViewStart).toHaveBeenCalled();
    });

    // Should not throw
    unmount();
  });
});
