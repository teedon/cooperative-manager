import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Card from '../../src/components/common/Card';
import { Text } from 'react-native';

describe('Card', () => {
  it('renders correctly with title and subtitle', () => {
    const { getByText } = render(<Card title="Test Title" subtitle="Test Subtitle" />);
    expect(getByText('Test Title')).toBeTruthy();
    expect(getByText('Test Subtitle')).toBeTruthy();
  });

  it('renders children content', () => {
    const { getByText } = render(
      <Card>
        <Text>Child Content</Text>
      </Card>
    );
    expect(getByText('Child Content')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <Card title="Clickable Card" onPress={onPress} testID="test-card" />
    );
    fireEvent.press(getByTestId('test-card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders without image if imageUrl is not provided', () => {
    const { queryByTestId } = render(<Card title="No Image Card" testID="test-card" />);
    expect(queryByTestId('test-card')).toBeTruthy();
  });
});
