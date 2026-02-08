import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatsPage } from '@/pages/stats/ui/StatsPage';
import { createTestWrapper } from '@~tests/unit/test-utils';

describe('StatsPage', () => {
  it('should render without crashing', async () => {
    render(<StatsPage />, {
      wrapper: createTestWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText('統計ダッシュボード')).toBeInTheDocument();
    });
  });

  it('should show period selector', async () => {
    render(<StatsPage />, {
      wrapper: createTestWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText('7日間')).toBeInTheDocument();
    });
  });
});
