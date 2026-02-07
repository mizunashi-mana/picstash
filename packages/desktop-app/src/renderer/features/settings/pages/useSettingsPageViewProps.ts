import { useCallback, useEffect, useState } from 'react';
import type { SettingsPageViewProps } from './SettingsPageView.js';

/**
 * SettingsPage の State / Handler を提供する Hook
 */
export function useSettingsPageViewProps(): SettingsPageViewProps {
  // === State ===
  const [storagePath, setStoragePath] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChanging, setIsChanging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // === Effects ===
  useEffect(() => {
    const loadStoragePath = async () => {
      try {
        if (window.picstash === undefined) {
          throw new Error('Picstash API is not available');
        }
        const path = await window.picstash.storage.getPath();
        setStoragePath(path);
      }
      catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load storage path');
      }
      finally {
        setIsLoading(false);
      }
    };
    void loadStoragePath();
  }, []);

  // === Handlers ===
  const handleChangeFolder = useCallback(() => {
    const doChangeFolder = async () => {
      setIsChanging(true);
      setError(null);

      try {
        if (window.picstash === undefined) {
          throw new Error('Picstash API is not available');
        }

        const selectedPath = await window.picstash.storage.selectPath();
        if (selectedPath !== null) {
          // フォルダが変更された場合、アプリを再起動してキャッシュをクリア
          window.location.reload();
        }
      }
      catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to change folder');
      }
      finally {
        setIsChanging(false);
      }
    };

    void doChangeFolder();
  }, []);

  return {
    storagePath,
    isLoading,
    isChanging,
    error,
    onChangeFolder: handleChangeFolder,
  };
}
