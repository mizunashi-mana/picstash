import '@testing-library/dom';
import '@testing-library/jest-dom/vitest';

// Mock matchMedia for Mantine components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock ResizeObserver for Mantine ScrollArea and other components
class ResizeObserverMock implements ResizeObserver {
  private readonly callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe(_target: Element, _options?: ResizeObserverOptions): void {
    // Mock implementation - no-op (callback stored but not invoked)
    void this.callback;
  }

  unobserve(_target: Element): void {
    // Mock implementation - no-op
  }

  disconnect(): void {
    // Mock implementation - no-op
  }
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: ResizeObserverMock,
});
