import { useLocalStorage } from '@mantine/hooks';

export type ViewMode = 'grid' | 'carousel';

const STORAGE_KEY = 'picstash-desktop:gallery-view-mode';

export function useViewMode(defaultValue: ViewMode = 'grid') {
  return useLocalStorage<ViewMode>({
    key: STORAGE_KEY,
    defaultValue,
  });
}
