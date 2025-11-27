import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Button from '../../src/components/common/Button';

describe('Button', () => {
  it('renders correctly with title', () => {
    const { getByText } = render(<Button title="Click me" onPress={() => {}} />);
    expect(getByText('Click me')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <Button title="Click me" onPress={onPress} testID="test-button" />
    );
    fireEvent.press(getByTestId('test-button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <Button title="Click me" onPress={onPress} disabled testID="test-button" />
    );
    fireEvent.press(getByTestId('test-button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('does not call onPress when loading', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <Button title="Click me" onPress={onPress} loading testID="test-button" />
    );
    fireEvent.press(getByTestId('test-button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('renders with different variants', () => {
    const { rerender, getByTestId } = render(
      <Button title="Primary" onPress={() => {}} variant="primary" testID="test-button" />
    );
    expect(getByTestId('test-button')).toBeTruthy();

    rerender(
      <Button title="Secondary" onPress={() => {}} variant="secondary" testID="test-button" />
    );
    expect(getByTestId('test-button')).toBeTruthy();

    rerender(<Button title="Danger" onPress={() => {}} variant="danger" testID="test-button" />);
    expect(getByTestId('test-button')).toBeTruthy();
  });
});
