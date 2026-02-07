import { Container } from 'inversify';
import { describe, expect, it } from 'vitest';
import { createContainer } from '@/shared/di/container';

describe('createContainer', () => {
  it('should return an inversify Container', () => {
    const container = createContainer();

    expect(container).toBeInstanceOf(Container);
  });

  it('should return a new container on each call', () => {
    const container1 = createContainer();
    const container2 = createContainer();

    expect(container1).not.toBe(container2);
  });
});
