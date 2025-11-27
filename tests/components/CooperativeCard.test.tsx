import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import CooperativeCard from '../../src/components/cooperative/CooperativeCard';
import { Cooperative } from '../../src/models';

const mockCooperative: Cooperative = {
  id: 'coop-1',
  name: 'Test Cooperative',
  description: 'A test cooperative for unit testing',
  imageUrl: 'https://example.com/image.jpg',
  status: 'active',
  memberCount: 10,
  totalContributions: 5000,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('CooperativeCard', () => {
  it('renders correctly with cooperative data', () => {
    const { getByText } = render(<CooperativeCard cooperative={mockCooperative} />);
    expect(getByText('Test Cooperative')).toBeTruthy();
    expect(getByText('A test cooperative for unit testing')).toBeTruthy();
    expect(getByText('10')).toBeTruthy();
    expect(getByText('$5,000')).toBeTruthy();
    expect(getByText('active')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <CooperativeCard cooperative={mockCooperative} onPress={onPress} testID="coop-card" />
    );
    fireEvent.press(getByTestId('coop-card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders inactive status correctly', () => {
    const inactiveCooperative = { ...mockCooperative, status: 'inactive' as const };
    const { getByText } = render(<CooperativeCard cooperative={inactiveCooperative} />);
    expect(getByText('inactive')).toBeTruthy();
  });

  it('renders without description', () => {
    const noDescCooperative = { ...mockCooperative, description: undefined };
    const { getByText, queryByText } = render(<CooperativeCard cooperative={noDescCooperative} />);
    expect(getByText('Test Cooperative')).toBeTruthy();
    expect(queryByText('A test cooperative for unit testing')).toBeNull();
  });
});
