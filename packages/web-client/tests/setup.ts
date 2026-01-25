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
class ResizeObserverMock {
  observe(): void {
    // Mock implementation - no-op
  }

  unobserve(): void {
    // Mock implementation - no-op
  }

  disconnect(): void {
    // Mock implementation - no-op
  }
}

window.ResizeObserver = ResizeObserverMock;
