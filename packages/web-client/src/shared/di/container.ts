import { Container } from 'inversify';

/**
 * Creates and configures the web-client DI container.
 *
 * Currently returns an empty container. API client bindings will be added
 * in future tasks (T3, T4) as part of the api-client-interface project.
 */
export function createContainer(): Container {
  const container = new Container();

  // API client bindings will be added here in T3/T4

  return container;
}
