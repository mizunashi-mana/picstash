import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CollectionsPage } from '@/pages/collections/ui/CollectionsPage';
import { createTestWrapper } from '@~tests/unit/test-utils';

describe('CollectionsPage', () => {
  it('should render without crashing', async () => {
    render(<CollectionsPage />, {
      wrapper: createTestWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText('コレクション')).toBeInTheDocument();
    });
  });

  it('should show empty state when no collections', async () => {
    render(<CollectionsPage />, {
      wrapper: createTestWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText('コレクションがまだありません')).toBeInTheDocument();
    });
  });
});
