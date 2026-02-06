import type { ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import { API_TYPES, type ApiClient } from '@picstash/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Container } from 'inversify';
import { describe, expect, it, vi } from 'vitest';
import { SearchBar } from '@/features/search-images';
import { ContainerProvider } from '@/shared/di';

const mockSuggestions = vi.fn().mockResolvedValue({ suggestions: [] });
const mockDeleteHistory = vi.fn();

function createMockApiClient() {
  return {
    search: {
      suggestions: mockSuggestions,
      deleteHistory: mockDeleteHistory,
    },
  } as unknown as ApiClient;
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const container = new Container();
  container.bind<ApiClient>(API_TYPES.ApiClient).toConstantValue(createMockApiClient());

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ContainerProvider container={container}>
          <MantineProvider>{children}</MantineProvider>
        </ContainerProvider>
      </QueryClientProvider>
    );
  };
}

describe('SearchBar', () => {
  it('should render with placeholder', () => {
    render(<SearchBar value="" onChange={vi.fn()} />, { wrapper: createWrapper() });

    expect(screen.getByPlaceholderText('検索...')).toBeInTheDocument();
  });

  it('should render with initial value', () => {
    render(<SearchBar value="test query" onChange={vi.fn()} />, { wrapper: createWrapper() });

    expect(screen.getByDisplayValue('test query')).toBeInTheDocument();
  });

  it('should render search button', () => {
    render(<SearchBar value="" onChange={vi.fn()} />, { wrapper: createWrapper() });

    expect(screen.getByRole('button', { name: '検索' })).toBeInTheDocument();
  });

  it('should show clear button when value is not empty', () => {
    render(<SearchBar value="test" onChange={vi.fn()} />, { wrapper: createWrapper() });

    expect(screen.getByRole('button', { name: '検索をクリア' })).toBeInTheDocument();
  });

  it('should not show clear button when value is empty', () => {
    render(<SearchBar value="" onChange={vi.fn()} />, { wrapper: createWrapper() });

    expect(screen.queryByRole('button', { name: '検索をクリア' })).not.toBeInTheDocument();
  });

  it('should call onChange with empty string when clear button clicked', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<SearchBar value="test" onChange={onChange} />, { wrapper: createWrapper() });

    await user.click(screen.getByRole('button', { name: '検索をクリア' }));

    expect(onChange).toHaveBeenCalledWith('');
  });

  it('should call onChange when search button clicked', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<SearchBar value="" onChange={onChange} />, { wrapper: createWrapper() });

    // Type in the input
    const input = screen.getByPlaceholderText('検索...');
    await user.type(input, 'new query');

    // Click search button
    await user.click(screen.getByRole('button', { name: '検索' }));

    expect(onChange).toHaveBeenCalledWith('new query');
  });

  it('should call onChange when Enter key pressed', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<SearchBar value="" onChange={onChange} />, { wrapper: createWrapper() });

    const input = screen.getByPlaceholderText('検索...');
    await user.type(input, 'new query');
    await user.keyboard('{Enter}');

    expect(onChange).toHaveBeenCalledWith('new query');
  });

  it('should fetch suggestions when typing', async () => {
    mockSuggestions.mockResolvedValue({
      suggestions: [
        { type: 'keyword', value: 'test suggestion' },
      ],
    });

    const user = userEvent.setup();

    render(<SearchBar value="" onChange={vi.fn()} />, { wrapper: createWrapper() });

    const input = screen.getByPlaceholderText('検索...');
    await user.type(input, 'test');

    await waitFor(() => {
      expect(mockSuggestions).toHaveBeenCalledWith('test');
    });
  });

  it('should update value when parent prop changes', () => {
    const container = new Container();
    container.bind<ApiClient>(API_TYPES.ApiClient).toConstantValue(createMockApiClient());

    const { rerender } = render(
      <SearchBar value="initial" onChange={vi.fn()} />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByDisplayValue('initial')).toBeInTheDocument();

    rerender(
      <MantineProvider>
        <QueryClientProvider client={new QueryClient()}>
          <ContainerProvider container={container}>
            <SearchBar value="updated" onChange={vi.fn()} />
          </ContainerProvider>
        </QueryClientProvider>
      </MantineProvider>,
    );

    expect(screen.getByDisplayValue('updated')).toBeInTheDocument();
  });
});
