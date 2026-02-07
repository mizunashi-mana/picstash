import { useCallback, useEffect, useState } from 'react';
import { Center, Loader } from '@mantine/core';
import { JobStatusButton } from '@/features/jobs';
import { StorageSetupPage } from '@/features/storage-setup';
import { AppRoutes } from '@/routes';
import { AppLayout } from '@/shared/components/AppLayout';

type StorageState = 'loading' | 'not-initialized' | 'initialized';

export function App() {
  const [storageState, setStorageState] = useState<StorageState>('loading');

  useEffect(() => {
    const checkStorage = async () => {
      try {
        // Electron 環境でのみ window.picstash が存在
        if (window.picstash === undefined) {
          setStorageState('not-initialized');
          return;
        }
        const isInitialized = await window.picstash.storage.isInitialized();
        setStorageState(isInitialized ? 'initialized' : 'not-initialized');
      }
      catch {
        setStorageState('not-initialized');
      }
    };
    void checkStorage();
  }, []);

  const handleStorageSelected = useCallback(() => {
    setStorageState('initialized');
  }, []);

  if (storageState === 'loading') {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  if (storageState === 'not-initialized') {
    return <StorageSetupPage onStorageSelected={handleStorageSelected} />;
  }

  return (
    <AppLayout headerActions={<JobStatusButton />}>
      <AppRoutes />
    </AppLayout>
  );
}
