import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StatsPageView, type StatsPageViewProps } from '@/pages/stats/ui/StatsPageView';
import { createMantineWrapper } from '@~tests/unit/test-utils';

function createDefaultProps(): StatsPageViewProps {
  return {
    days: '7',
    overviewStats: undefined,
    viewTrends: undefined,
    recommendationTrends: undefined,
    popularImages: undefined,
    isLoading: false,
    hasError: false,
    onDaysChange: vi.fn(),
    getThumbnailUrl: vi.fn((id: string) => `/thumbnails/${id}`),
  };
}

describe('StatsPageView', () => {
  it('should render without crashing', () => {
    render(<StatsPageView {...createDefaultProps()} />, {
      wrapper: createMantineWrapper(),
    });
    expect(screen.getByText('統計ダッシュボード')).toBeInTheDocument();
  });

  it('should show period selector', () => {
    render(<StatsPageView {...createDefaultProps()} />, {
      wrapper: createMantineWrapper(),
    });
    expect(screen.getByText('7日間')).toBeInTheDocument();
    expect(screen.getByText('30日間')).toBeInTheDocument();
    expect(screen.getByText('90日間')).toBeInTheDocument();
  });

  it('should show error state', () => {
    render(<StatsPageView {...createDefaultProps()} hasError />, {
      wrapper: createMantineWrapper(),
    });
    expect(screen.getByText(/統計の読み込みに失敗しました/)).toBeInTheDocument();
  });

  it('should render with stats data', () => {
    const props = createDefaultProps();
    props.overviewStats = { totalImages: 100, totalViews: 500, totalRecommendations: 50 };
    render(<StatsPageView {...props} />, {
      wrapper: createMantineWrapper(),
    });
    expect(screen.getByText('統計ダッシュボード')).toBeInTheDocument();
  });
});
