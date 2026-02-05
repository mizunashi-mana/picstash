import { renderHook } from '@testing-library/react';
import { Container } from 'inversify';
import { describe, expect, it } from 'vitest';
import { ContainerProvider, useContainer } from '@/shared/di/react';

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
