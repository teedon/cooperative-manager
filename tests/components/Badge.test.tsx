import React from 'react';
import { render } from '@testing-library/react-native';
import Badge from '../../src/components/common/Badge';

describe('Badge', () => {
  it('renders correctly with text', () => {
    const { getByText } = render(<Badge text="Active" />);
    expect(getByText('Active')).toBeTruthy();
  });

  it('renders with different variants', () => {
    const variants = ['default', 'success', 'warning', 'error', 'info'] as const;

    variants.forEach((variant) => {
      const { getByText } = render(<Badge text={variant} variant={variant} />);
      expect(getByText(variant)).toBeTruthy();
    });
  });

  it('renders with different sizes', () => {
    const { rerender, getByText } = render(<Badge text="Small" size="small" />);
    expect(getByText('Small')).toBeTruthy();

    rerender(<Badge text="Medium" size="medium" />);
    expect(getByText('Medium')).toBeTruthy();
  });
});
