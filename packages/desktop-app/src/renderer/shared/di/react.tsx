import { createContext, useContext, useMemo } from 'react';
import { API_TYPES, type ApiClient } from '@picstash/api';
import { createContainer } from './container';
import type { Container } from 'inversify';

const ContainerContext = createContext<Container | null>(null);

interface ContainerProviderProps {
  container?: Container;
  children: React.ReactNode;
}

/**
 * Provider component that makes the DI container available to child components.
 *
 * If no container is provided, a default container is created.
 * For testing/Storybook, a custom container with mock bindings can be passed.
 */
export function ContainerProvider({
  container,
  children,
}: ContainerProviderProps) {
  const containerInstance = useMemo(() => {
    return container ?? createContainer();
  }, [container]);

  return (
    <ContainerContext value={containerInstance}>
      {children}
    </ContainerContext>
  );
}

/**
 * Hook to access the DI container directly.
 *
 * @throws Error if used outside of ContainerProvider
 */
export function useContainer(): Container {
  const container = useContext(ContainerContext);
  if (container === null) {
    throw new Error('useContainer must be used within a ContainerProvider');
  }
  return container;
}

/**
 * Hook to access the ApiClient from the DI container.
 *
 * This is a convenience hook that retrieves the ApiClient instance
 * bound to API_TYPES.ApiClient in the container.
 *
 * @throws Error if used outside of ContainerProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const api = useApiClient();
 *   const { data } = useQuery({
 *     queryKey: ['images'],
 *     queryFn: () => api.images.list(),
 *   });
 *   return <div>{data?.length} images</div>;
 * }
 * ```
 */
export function useApiClient(): ApiClient {
  const container = useContainer();
  return container.get<ApiClient>(API_TYPES.ApiClient);
}
