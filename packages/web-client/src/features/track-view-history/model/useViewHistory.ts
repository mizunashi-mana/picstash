import { useCallback, useEffect, useRef } from 'react';
import { useApiClient } from '@/shared';

interface UseViewHistoryOptions {
  enabled?: boolean;
  /** Conversion ID from recommendation click tracking */
  conversionId?: string | null;
  /** Set to true when the image has been deleted to skip cleanup */
  isDeleted?: boolean;
}

/**
 * Hook to track image view history.
 * Records view start when mounted and view end when unmounted or page becomes hidden.
 * If conversionId is provided, also records the recommendation click.
 */
export function useViewHistory(
  imageId: string | undefined,
  options: UseViewHistoryOptions = {},
): void {
  const { enabled = true, conversionId, isDeleted = false } = options;
  const apiClient = useApiClient();
  const viewHistoryIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const conversionRecordedRef = useRef<boolean>(false);
  const lastConversionIdRef = useRef<string | null | undefined>(undefined);
  const isDeletedRef = useRef<boolean>(false);
  const apiClientRef = useRef(apiClient);

  // Keep refs in sync with values
  useEffect(() => {
    isDeletedRef.current = isDeleted;
  }, [isDeleted]);

  useEffect(() => {
    apiClientRef.current = apiClient;
  }, [apiClient]);

  // Reset conversionRecordedRef when conversionId changes
  useEffect(() => {
    if (lastConversionIdRef.current !== conversionId) {
      lastConversionIdRef.current = conversionId;
      conversionRecordedRef.current = false;
    }
  }, [conversionId]);

  const sendViewEnd = useCallback(async () => {
    // Skip if image was deleted (view history is cascade deleted)
    if (isDeletedRef.current) {
      viewHistoryIdRef.current = null;
      startTimeRef.current = null;
      return;
    }

    if (viewHistoryIdRef.current === null || startTimeRef.current === null) {
      return;
    }

    const duration = Date.now() - startTimeRef.current;
    const viewHistoryId = viewHistoryIdRef.current;

    // Reset refs before async call to prevent duplicate sends
    viewHistoryIdRef.current = null;
    startTimeRef.current = null;

    try {
      await apiClientRef.current.viewHistory.recordEnd(viewHistoryId, duration);
    }
    catch {
      // Silently fail - view history is not critical
    }
  }, []);

  useEffect(() => {
    if (!enabled || imageId === undefined) {
      return;
    }

    // Record view start
    const startView = async () => {
      try {
        const viewHistory = await apiClientRef.current.viewHistory.recordStart(imageId);
        viewHistoryIdRef.current = viewHistory.id;
        startTimeRef.current = Date.now();

        // Record recommendation click if conversionId is provided
        if (
          conversionId !== undefined
          && conversionId !== null
          && !conversionRecordedRef.current
        ) {
          conversionRecordedRef.current = true;
          try {
            await apiClientRef.current.recommendations.recordClick(conversionId, {
              viewHistoryId: viewHistory.id,
            });
          }
          catch {
            // Silently fail - conversion tracking is not critical
          }
        }
      }
      catch {
        // Silently fail - view history is not critical
      }
    };

    void startView();

    // Handle visibility change (user switches tab or minimizes window)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        void sendViewEnd();
      }
    };

    // Handle page unload (user navigates away or closes tab)
    const handleBeforeUnload = () => {
      // Skip if image was deleted (view history is cascade deleted)
      if (isDeletedRef.current) {
        return;
      }

      if (viewHistoryIdRef.current !== null && startTimeRef.current !== null) {
        const duration = Date.now() - startTimeRef.current;
        // Use fetch with keepalive for reliable delivery during page unload
        void fetch(`/api/view-history/${viewHistoryIdRef.current}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ duration }),
          keepalive: true,
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup: record view end when unmounting
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      void sendViewEnd();
    };
  }, [imageId, enabled, conversionId, sendViewEnd]);
}
