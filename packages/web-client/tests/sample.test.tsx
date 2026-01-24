import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('Sample React Test', () => {
  it('should render a component', () => {
    render(<div data-testid="test">Hello World</div>);
    expect(screen.getByTestId('test')).toBeDefined();
    expect(screen.getByText('Hello World')).toBeDefined();
  });
});
