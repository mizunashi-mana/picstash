import { API_TYPES, type ApiClient } from '@picstash/api';
import { renderHook } from '@testing-library/react';
import { Container } from 'inversify';
import { describe, expect, it } from 'vitest';
import { FetchApiClient } from '@/shared/api/fetch-client';
import { ContainerProvider, useContainer, useApiClient } from '@/shared/di/react';

describe('ContainerProvider', () => {
  it('should provide a default container when none is passed', () => {
    const { result } = renderHook(() => useContainer(), {
      wrapper: ({ children }) => (
        <ContainerProvider>{children}</ContainerProvider>
      ),
    });

    expect(result.current).toBeInstanceOf(Container);
  });

  it('should provide the custom container when passed', () => {
    const customContainer = new Container();

    const { result } = renderHook(() => useContainer(), {
      wrapper: ({ children }) => (
        <ContainerProvider container={customContainer}>{children}</ContainerProvider>
      ),
    });

    expect(result.current).toBe(customContainer);
  });

  it('should memoize the container across re-renders', () => {
    const { result, rerender } = renderHook(() => useContainer(), {
      wrapper: ({ children }) => (
        <ContainerProvider>{children}</ContainerProvider>
      ),
    });

    const firstContainer = result.current;
    rerender();
    const secondContainer = result.current;

    expect(firstContainer).toBe(secondContainer);
  });
});

describe('useContainer', () => {
  it('should throw an error when used outside of ContainerProvider', () => {
    expect(() => {
      renderHook(() => useContainer());
    }).toThrow('useContainer must be used within a ContainerProvider');
  });
});

describe('useApiClient', () => {
  it('should return the ApiClient from the container', () => {
    const { result } = renderHook(() => useApiClient(), {
      wrapper: ({ children }) => (
        <ContainerProvider>{children}</ContainerProvider>
      ),
    });

    expect(result.current).toBeInstanceOf(FetchApiClient);
  });

  it('should return the same ApiClient instance across re-renders', () => {
    const { result, rerender } = renderHook(() => useApiClient(), {
      wrapper: ({ children }) => (
        <ContainerProvider>{children}</ContainerProvider>
      ),
    });

    const firstClient = result.current;
    rerender();
    const secondClient = result.current;

    expect(firstClient).toBe(secondClient);
  });

  it('should return a custom ApiClient when bound to a custom container', () => {
    const customContainer = new Container();
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- test mock object
    const mockApiClient = {} as ApiClient;
    customContainer.bind<ApiClient>(API_TYPES.ApiClient).toConstantValue(mockApiClient);

    const { result } = renderHook(() => useApiClient(), {
      wrapper: ({ children }) => (
        <ContainerProvider container={customContainer}>{children}</ContainerProvider>
      ),
    });

    expect(result.current).toBe(mockApiClient);
  });

  it('should throw an error when used outside of ContainerProvider', () => {
    expect(() => {
      renderHook(() => useApiClient());
    }).toThrow('useContainer must be used within a ContainerProvider');
  });
});
