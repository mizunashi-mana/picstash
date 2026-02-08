import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DuplicatesPage } from '@/pages/duplicates/ui/DuplicatesPage';
import { createTestWrapper } from '@~tests/unit/test-utils';

describe('DuplicatesPage', () => {
  it('should render without crashing', async () => {
    render(<DuplicatesPage />, {
      wrapper: createTestWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '重複画像' })).toBeInTheDocument();
    });
  });

  it('should show threshold slider after loading', async () => {
    render(<DuplicatesPage />, {
      wrapper: createTestWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByRole('slider')).toBeInTheDocument();
    });
  });
});
