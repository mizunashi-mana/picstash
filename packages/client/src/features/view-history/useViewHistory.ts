import { useCallback, useEffect, useRef } from 'react';
import { recordViewEnd, recordViewStart } from './api';

interface UseViewHistoryOptions {
  enabled?: boolean;
}

/**
 * Hook to track image view history.
 * Records view start when mounted and view end when unmounted or page becomes hidden.
 */
export function useViewHistory(
  imageId: string | undefined,
  options: UseViewHistoryOptions = {},
): void {
  const { enabled = true } = options;
  const viewHistoryIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const sendViewEnd = useCallback(async () => {
    if (viewHistoryIdRef.current === null || startTimeRef.current === null) {
      return;
    }

    const duration = Date.now() - startTimeRef.current;
    const viewHistoryId = viewHistoryIdRef.current;

    // Reset refs before async call to prevent duplicate sends
    viewHistoryIdRef.current = null;
    startTimeRef.current = null;

    try {
      await recordViewEnd(viewHistoryId, duration);
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
        const viewHistory = await recordViewStart(imageId);
        viewHistoryIdRef.current = viewHistory.id;
        startTimeRef.current = Date.now();
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
  }, [imageId, enabled, sendViewEnd]);
}
