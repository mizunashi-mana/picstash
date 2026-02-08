import { describe, expect, it } from 'vitest';
import { calculateColumns } from '@/pages/gallery/ui/useGalleryPageViewProps';

describe('calculateColumns', () => {
  it('should return 2 columns for zero width (fallback)', () => {
    expect(calculateColumns(0)).toBe(2);
  });

  it('should return minimum 2 columns for small width', () => {
    expect(calculateColumns(100)).toBe(2);
    expect(calculateColumns(200)).toBe(2);
  });

  it('should return maximum 6 columns for very large width', () => {
    expect(calculateColumns(2000)).toBe(6);
    expect(calculateColumns(5000)).toBe(6);
  });

  it('should calculate correct columns for various widths', () => {
    // 2 columns
    expect(calculateColumns(320)).toBe(2);
    expect(calculateColumns(400)).toBe(2);

    // 3 columns
    expect(calculateColumns(500)).toBe(3);
    expect(calculateColumns(600)).toBe(3);

    // 4 columns
    expect(calculateColumns(700)).toBe(4);
    expect(calculateColumns(800)).toBe(4);

    // 5 columns
    expect(calculateColumns(850)).toBe(5);
    expect(calculateColumns(950)).toBe(5);

    // 6 columns
    expect(calculateColumns(1000)).toBe(6);
  });

  it('should handle edge cases at column boundaries', () => {
    // Boundary at 3 columns: need (w + 16) >= 3 * 166 = 498, so w >= 482
    expect(calculateColumns(481)).toBe(2);
    expect(calculateColumns(482)).toBe(3);

    // Boundary at 4 columns: need (w + 16) >= 4 * 166 = 664, so w >= 648
    expect(calculateColumns(647)).toBe(3);
    expect(calculateColumns(648)).toBe(4);
  });
});
