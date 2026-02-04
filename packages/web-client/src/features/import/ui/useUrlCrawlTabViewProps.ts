import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  crawlUrl,
  deleteCrawlSession,
  getCrawlSession,
  importFromCrawl,
} from '@/features/import-url';
import type { UrlCrawlTabViewProps } from './UrlCrawlTabView';
import type { ImportResult } from '@/features/import-url';

export function useUrlCrawlTabViewProps(): UrlCrawlTabViewProps {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  // Keep ref in sync with state for cleanup
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  // Cleanup session on unmount
  useEffect(() => {
    return () => {
      if (sessionIdRef.current !== null) {
        deleteCrawlSession(sessionIdRef.current).catch(() => {
          // Ignore errors during cleanup
        });
      }
    };
  }, []);

  const crawlMutation = useMutation({
    mutationFn: crawlUrl,
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      setSelectedIndices(new Set());
      setImportResult(null);
    },
  });

  const sessionQuery = useQuery({
    queryKey: ['url-crawl-session', sessionId],
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- query is only enabled when sessionId !== null (see enabled option below)
    queryFn: async () => await getCrawlSession(sessionId!),
    enabled: sessionId !== null,
  });

  const session = sessionQuery.data;

  const deleteMutation = useMutation({
    mutationFn: deleteCrawlSession,
    onSuccess: () => {
      setSessionId(null);
      setSelectedIndices(new Set());
      setImportResult(null);
    },
  });

  const importMutation = useMutation({
    mutationFn: async (indices: number[]) => {
      if (sessionId === null) {
        throw new Error('No session');
      }
      return await importFromCrawl(sessionId, indices);
    },
    onSuccess: (result) => {
      setImportResult(result);
      // Clear selection after successful import
      if (result.successCount > 0) {
        // Remove successfully imported indices from selection
        const failedIndices = new Set(result.results.filter(r => !r.success).map(r => r.index));
        setSelectedIndices(failedIndices);
      }
    },
  });

  const handleSubmit = (url: string) => {
    crawlMutation.mutate(url);
  };

  const handleClose = () => {
    if (sessionId !== null) {
      deleteMutation.mutate(sessionId);
    }
  };

  const handleSelectAll = () => {
    if (session !== undefined) {
      setSelectedIndices(new Set(session.images.map(img => img.index)));
    }
  };

  const handleDeselectAll = () => {
    setSelectedIndices(new Set());
  };

  const handleImport = () => {
    if (selectedIndices.size > 0) {
      importMutation.mutate(Array.from(selectedIndices));
    }
  };

  const handleClearImportResult = () => {
    setImportResult(null);
  };

  return {
    sessionId,
    session,
    isSessionLoading: sessionQuery.isLoading,
    sessionError: sessionQuery.error,
    isCrawling: crawlMutation.isPending,
    crawlError: crawlMutation.error,
    selectedIndices,
    isImporting: importMutation.isPending,
    importResult,
    isClosing: deleteMutation.isPending,
    onSubmit: handleSubmit,
    onClose: handleClose,
    onSelectAll: handleSelectAll,
    onDeselectAll: handleDeselectAll,
    onImport: handleImport,
    onSelectionChange: setSelectedIndices,
    onClearImportResult: handleClearImportResult,
  };
}
