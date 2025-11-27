import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ListingCard from '../../src/components/groupbuys/ListingCard';
import { GroupBuy } from '../../src/models';

const mockGroupBuy: GroupBuy = {
  id: 'gb-1',
  cooperativeId: 'coop-1',
  title: 'Bulk Rice Purchase',
  description: 'Premium quality rice at wholesale price',
  imageUrl: 'https://example.com/rice.jpg',
  unitPrice: 75,
  totalUnits: 20,
  availableUnits: 8,
  minUnitsPerMember: 1,
  maxUnitsPerMember: 5,
  interestRate: 5,
  allocationMethod: 'first_come',
  deadline: '2024-07-15T23:59:59Z',
  status: 'open',
  createdBy: 'user-1',
  createdAt: '2024-06-01T00:00:00Z',
  updatedAt: '2024-06-01T00:00:00Z',
};

describe('ListingCard', () => {
  it('renders correctly with group buy data', () => {
    const { getByText } = render(<ListingCard groupBuy={mockGroupBuy} />);
    expect(getByText('Bulk Rice Purchase')).toBeTruthy();
    expect(getByText('Premium quality rice at wholesale price')).toBeTruthy();
    expect(getByText('$75.00')).toBeTruthy();
    expect(getByText('open')).toBeTruthy();
  });

  it('shows availability information', () => {
    const { getByText } = render(<ListingCard groupBuy={mockGroupBuy} />);
    expect(getByText('8 of 20 available')).toBeTruthy();
  });

  it('shows interest rate', () => {
    const { getByText } = render(<ListingCard groupBuy={mockGroupBuy} />);
    expect(getByText('5%')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <ListingCard groupBuy={mockGroupBuy} onPress={onPress} testID="listing-card" />
    );
    fireEvent.press(getByTestId('listing-card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders different status badges correctly', () => {
    const closedGroupBuy = { ...mockGroupBuy, status: 'closed' as const };
    const { getByText } = render(<ListingCard groupBuy={closedGroupBuy} />);
    expect(getByText('closed')).toBeTruthy();
  });
});
