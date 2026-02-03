import { describe, expect, it } from 'vitest';
import { formatDate, formatFileSize } from '@/pages/image-detail/lib/format';

describe('formatFileSize', () => {
  it('should return bytes for values under 1024', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(1023)).toBe('1023 B');
  });

  it('should return KB for values under 1MB', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(1024 * 1023)).toBe('1023.0 KB');
  });

  it('should return MB for values 1MB and above', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
    expect(formatFileSize(1024 * 1024 * 2.5)).toBe('2.5 MB');
  });

  it('should return N/A for negative values', () => {
    expect(formatFileSize(-1)).toBe('N/A');
  });

  it('should return N/A for non-finite values', () => {
    expect(formatFileSize(Number.NaN)).toBe('N/A');
    expect(formatFileSize(Number.POSITIVE_INFINITY)).toBe('N/A');
  });
});

describe('formatDate', () => {
  it('should format ISO date string in ja-JP locale', () => {
    const result = formatDate('2026-01-15T10:30:00Z');
    // ja-JP locale formats as YYYY/MM/DD HH:MM
    expect(result).toMatch(/2026/);
    expect(result).toMatch(/01/);
    expect(result).toMatch(/15/);
  });

  it('should include hours and minutes', () => {
    const result = formatDate('2026-06-01T14:05:00+09:00');
    expect(result).toMatch(/14/);
    expect(result).toMatch(/05/);
  });
});
