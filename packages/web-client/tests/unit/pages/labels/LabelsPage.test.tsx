import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LabelsPage } from '@/pages/labels/ui/LabelsPage';
import { createTestWrapper } from '@~tests/unit/test-utils';

describe('LabelsPage', () => {
  it('should render without crashing', async () => {
    render(<LabelsPage />, {
      wrapper: createTestWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText('ラベル管理')).toBeInTheDocument();
    });
  });

  it('should show page title', async () => {
    render(<LabelsPage />, {
      wrapper: createTestWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'ラベル管理' })).toBeInTheDocument();
    });
  });
});
