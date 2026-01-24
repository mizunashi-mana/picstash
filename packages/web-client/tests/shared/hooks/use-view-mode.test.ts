import { useLocalStorage } from '@mantine/hooks';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useViewMode } from '@/shared/hooks/use-view-mode';

// Mock @mantine/hooks
vi.mock('@mantine/hooks', () => ({
  useLocalStorage: vi.fn(),
}));

describe('useViewMode', () => {
  beforeEach(() => {
    vi.mocked(useLocalStorage).mockReturnValue(['grid', vi.fn(), vi.fn()]);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should call useLocalStorage with correct storage key', () => {
    useViewMode();

    expect(useLocalStorage).toHaveBeenCalledWith({
      key: 'picstash:gallery-view-mode',
      defaultValue: 'grid',
    });
  });

  it('should use provided default value', () => {
    useViewMode('carousel');

    expect(useLocalStorage).toHaveBeenCalledWith({
      key: 'picstash:gallery-view-mode',
      defaultValue: 'carousel',
    });
  });

  it('should return the result from useLocalStorage', () => {
    const mockSetValue = vi.fn();
    const mockRemoveValue = vi.fn();
    vi.mocked(useLocalStorage).mockReturnValue(['carousel', mockSetValue, mockRemoveValue]);

    const result = useViewMode();

    expect(result).toEqual(['carousel', mockSetValue, mockRemoveValue]);
  });
});
