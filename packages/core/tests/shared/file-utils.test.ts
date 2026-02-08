import * as fs from 'node:fs/promises';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { fileExists } from '@/shared/file-utils';

vi.mock('node:fs/promises');

describe('fileExists', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return true when file exists', async () => {
    vi.mocked(fs.access).mockResolvedValue(undefined);

    const result = await fileExists('/path/to/existing-file.txt');

    expect(result).toBe(true);
    expect(fs.access).toHaveBeenCalledWith('/path/to/existing-file.txt');
  });

  it('should return false when file does not exist', async () => {
    vi.mocked(fs.access).mockRejectedValue(new Error('ENOENT: no such file or directory'));

    const result = await fileExists('/path/to/non-existing-file.txt');

    expect(result).toBe(false);
    expect(fs.access).toHaveBeenCalledWith('/path/to/non-existing-file.txt');
  });

  it('should return false for permission denied error', async () => {
    vi.mocked(fs.access).mockRejectedValue(new Error('EACCES: permission denied'));

    const result = await fileExists('/path/to/restricted-file.txt');

    expect(result).toBe(false);
  });
});
